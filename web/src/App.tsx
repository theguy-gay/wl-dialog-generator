import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { AiVoiceContext, CHARACTER_COLORS } from './context/AiVoiceContext';
import type { Character } from './context/AiVoiceContext';
import { generateSpeech } from './utils/elevenLabsApi';
import { AiVoiceModal } from './components/AiVoiceModal';
import { AddCharacterModal } from './components/AddCharacterModal';
import { CharacterPanel } from './components/CharacterPanel';

// Approximate node bounding box used for collision detection (generous to avoid overlap)
const NODE_W = 280;
const NODE_H = 190;
const GRID_STEP = 80;
const PAD = 20;

function findFreePosition(center: { x: number; y: number }, nodes: Node[]): { x: number; y: number } {
  const cx = center.x - NODE_W / 2;
  const cy = center.y - NODE_H / 2;

  function overlaps(x: number, y: number): boolean {
    return nodes.some(n =>
      !(x + NODE_W + PAD < n.position.x ||
        x > n.position.x + NODE_W + PAD ||
        y + NODE_H + PAD < n.position.y ||
        y > n.position.y + NODE_H + PAD)
    );
  }

  if (!overlaps(cx, cy)) return { x: cx, y: cy };

  for (let ring = 1; ring <= 20; ring++) {
    const candidates: { x: number; y: number }[] = [];
    for (let i = -ring; i <= ring; i++) {
      for (let j = -ring; j <= ring; j++) {
        if (Math.abs(i) === ring || Math.abs(j) === ring) {
          candidates.push({ x: cx + i * GRID_STEP, y: cy + j * GRID_STEP });
        }
      }
    }
    candidates.sort((a, b) => (a.x - cx) ** 2 + (a.y - cy) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2));
    for (const pos of candidates) {
      if (!overlaps(pos.x, pos.y)) return pos;
    }
  }

  return { x: cx, y: cy };
}
import DialogEditor from './components/DialogEditor';
import { ErrorPanel } from './components/ErrorPanel';
import { SaveLoadMenu } from './components/SaveLoadMenu';
import type { Dialogs, AiVoiceMetadata } from './types';
import { dialogToFlow, computeTreeLayout } from './utils/dialogToFlow';
import { flowToDialog } from './utils/flowToDialog';
import { validateFlow } from './utils/validateFlow';
import './App.css';
import dialogsJson from '../../dialogs.json';

const WIP_KEY = 'wl-dialog-wip';

const { nodes: initialNodes, edges: initialEdges } =
  dialogToFlow(dialogsJson as Dialogs);

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wipSavedAt, setWipSavedAt] = useState<string | null>(() => {
    const saved = localStorage.getItem(WIP_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved).savedAt ?? null; } catch { return null; }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveLoadWrapperRef = useRef<HTMLDivElement>(null);
  const getCenterRef = useRef<(() => { x: number; y: number }) | null>(null);
  const handleRegisterGetCenter = useCallback((fn: () => { x: number; y: number }) => {
    getCenterRef.current = fn;
  }, []);

  const errors = useMemo(() => validateFlow(nodes, edges), [nodes, edges]);

  // AI Voice Mode state
  const [aiMode, setAiMode] = useState<{ apiKey: string } | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAddCharModal, setShowAddCharModal] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [voiceGenerations, setVoiceGenerations] = useState<Map<string, ArrayBuffer>>(() => new Map());
  const [generatingNodes, setGeneratingNodes] = useState<Set<string>>(() => new Set());
  // Holds parsed file data when the AI modal is triggered mid-load
  const [pendingFileLoad, setPendingFileLoad] = useState<{
    nodes: Node[];
    edges: Edge[];
    aiVoice: AiVoiceMetadata;
  } | null>(null);

  function applyAiVoiceToNodes(loadedNodes: Node[], aiVoice: AiVoiceMetadata): Node[] {
    const { characters: loadedChars = [], voiceAssignments = {} } = aiVoice;
    setCharacters(loadedChars);
    setVoiceGenerations(new Map());
    return loadedNodes.map(n => {
      if (n.data._type !== 'npcLine') return n;
      const label = n.id.startsWith('npcLine-') ? n.id.slice('npcLine-'.length) : n.id;
      const charId = voiceAssignments[label];
      return charId ? { ...n, data: { ...n.data, aiCharacterId: charId } } : n;
    });
  }

  const handleEnableAiMode = useCallback((apiKey: string) => {
    setAiMode({ apiKey });
    setShowAiModal(false);
    if (pendingFileLoad) {
      setNodes(applyAiVoiceToNodes(pendingFileLoad.nodes, pendingFileLoad.aiVoice));
      setEdges(pendingFileLoad.edges);
      setPendingFileLoad(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFileLoad, setNodes, setEdges]);

  const handleAiModalCancel = useCallback(() => {
    setShowAiModal(false);
    if (pendingFileLoad) {
      setNodes(pendingFileLoad.nodes);
      setEdges(pendingFileLoad.edges);
      setPendingFileLoad(null);
    }
  }, [pendingFileLoad, setNodes, setEdges]);

  const handleDisableAiMode = useCallback(() => {
    setAiMode(null);
    setCharacters([]);
    setVoiceGenerations(new Map());
    setGeneratingNodes(new Set());
    setNodes(nds => nds.map(n => {
      if (n.data.aiCharacterId === undefined) return n;
      const { aiCharacterId: _, ...rest } = n.data;
      return { ...n, data: rest };
    }));
  }, [setNodes]);

  const handleAddCharacter = useCallback((name: string, voiceId: string) => {
    setCharacters(prev => {
      const color = CHARACTER_COLORS[prev.length % CHARACTER_COLORS.length];
      return [...prev, { id: `char-${Date.now()}`, name, voiceId, color }];
    });
    setShowAddCharModal(false);
  }, []);

  const handleRemoveCharacter = useCallback((charId: string) => {
    setCharacters(prev => prev.filter(c => c.id !== charId));
    // Unassign from any nodes using this character
    setNodes(nds => nds.map(n => {
      if (n.data.aiCharacterId !== charId) return n;
      const { aiCharacterId: _, ...rest } = n.data;
      return { ...n, data: rest };
    }));
    setVoiceGenerations(prev => {
      // We don't know which nodes used this char, so leave generations intact
      return prev;
    });
  }, [setNodes]);

  const handleGenerateVoice = useCallback(async (nodeId: string, text: string, voiceId: string) => {
    if (!aiMode) return;
    setGeneratingNodes(prev => new Set(prev).add(nodeId));
    try {
      const buf = await generateSpeech(aiMode.apiKey, voiceId, text);

      // Decode to get actual audio duration
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(buf.slice(0));
      await audioCtx.close();
      const duration = Math.round(decoded.duration * 10) / 10;

      setNodes(nds => nds.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, duration } } : n
      ));
      setVoiceGenerations(prev => {
        const next = new Map(prev);
        next.set(nodeId, buf);
        return next;
      });
    } catch (err) {
      alert('Voice generation failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGeneratingNodes(prev => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
  }, [aiMode, setNodes]);

  const handlePlayVoice = useCallback((nodeId: string) => {
    const buf = voiceGenerations.get(nodeId);
    if (!buf) return;
    const blob = new Blob([buf], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  }, [voiceGenerations]);

  const handleUnassignCharacter = useCallback((nodeId: string) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n;
      const { aiCharacterId: _, ...rest } = n.data;
      return { ...n, data: rest };
    }));
    setVoiceGenerations(prev => {
      if (!prev.has(nodeId)) return prev;
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
  }, [setNodes]);

  // Close menu when clicking outside the wrapper
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (saveLoadWrapperRef.current && !saveLoadWrapperRef.current.contains(e.target as HTMLElement)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleExport = useCallback(async () => {
    if (errors.length > 0) return;
    if (aiMode && voiceGenerations.size > 0) {
      const { exportZip } = await import('./utils/exportZip');
      await exportZip(nodes, edges, voiceGenerations, characters);
      return;
    }
    const dialogs = flowToDialog(nodes, edges);
    if (aiMode && characters.length > 0) {
      const voiceAssignments: { [label: string]: string } = {};
      for (const n of nodes) {
        if (n.data._type === 'npcLine' && typeof n.data.aiCharacterId === 'string') {
          const label = n.id.startsWith('npcLine-') ? n.id.slice('npcLine-'.length) : n.id;
          voiceAssignments[label] = n.data.aiCharacterId as string;
        }
      }
      dialogs._aiVoice = { characters, voiceAssignments };
    }
    const json = JSON.stringify(dialogs, null, 4);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialog.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [nodes, edges, errors, aiMode, voiceGenerations]);

  const handleOrganizeNodes = useCallback(() => {
    const startNode = nodes.find(n => n.data._type === 'start');
    const startId = startNode?.id ?? nodes[0]?.id;
    if (!startId) return;
    const positions = computeTreeLayout(nodes.map(n => n.id), edges, startId);
    setNodes(nds => nds.map(n => ({ ...n, position: positions.get(n.id) ?? n.position })));
  }, [nodes, edges, setNodes]);

  const handleAddStart = useCallback(() => {
    if (nodes.some(n => n.data._type === 'start')) return;
    const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
    const newNode: Node = {
      id: 'start',
      type: 'start',
      position: findFreePosition(center, nodes),
      data: { _type: 'start' },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  const handleAddNpcLine = useCallback(() => {
    const npcCount = nodes.filter(n => n.data._type === 'npcLine').length + 1;
    const label = `npcLine${npcCount}`;
    const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
    const newNode: Node = {
      id: `npcLine-${label}`,
      type: 'npcLine',
      position: findFreePosition(center, nodes),
      data: { _label: label, _type: 'npcLine', duration: 1 },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  const handleAddPlayerChoice = useCallback(() => {
    const choiceCount = nodes.filter(n => n.data._type === 'playerChoice').length + 1;
    const label = `playerChoice${choiceCount}`;
    const center = getCenterRef.current?.() ?? { x: 0, y: 0 };
    const newNode: Node = {
      id: `playerChoice-${label}`,
      type: 'playerChoice',
      position: findFreePosition(center, nodes),
      data: {
        _label: label,
        _type: 'playerChoice',
        choices: [{ text: 'Choice 1' }],
      },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  const handleLoadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const { nodes: newNodes, edges: newEdges } = dialogToFlow(json as Dialogs);

        if (json._aiVoice) {
          if (aiMode) {
            setNodes(applyAiVoiceToNodes(newNodes, json._aiVoice));
            setEdges(newEdges);
          } else {
            setPendingFileLoad({ nodes: newNodes, edges: newEdges, aiVoice: json._aiVoice });
            setShowAiModal(true);
          }
        } else {
          setNodes(newNodes);
          setEdges(newEdges);
        }
      } catch (err) {
        alert('Failed to load file: ' + (err instanceof Error ? err.message : 'Invalid JSON'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setNodes, setEdges, aiMode, setCharacters, setVoiceGenerations]);

  const handleSaveWip = useCallback(() => {
    const savedAt = new Date().toISOString();
    localStorage.setItem(WIP_KEY, JSON.stringify({ version: 1, nodes, edges, savedAt }));
    setWipSavedAt(savedAt);
  }, [nodes, edges]);

  // Keep a ref so the autosave interval always uses the latest handleSaveWip
  const handleSaveWipRef = useRef(handleSaveWip);
  useEffect(() => { handleSaveWipRef.current = handleSaveWip; }, [handleSaveWip]);

  // Autosave every 5 minutes
  useEffect(() => {
    const id = setInterval(() => handleSaveWipRef.current(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const handleLoadWip = useCallback(() => {
    const saved = localStorage.getItem(WIP_KEY);
    if (!saved) return;
    try {
      const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
      setNodes(savedNodes);
      setEdges(savedEdges);
    } catch (err) {
      alert('Failed to load saved progress: ' + (err instanceof Error ? err.message : 'Invalid data'));
    }
  }, [setNodes, setEdges]);

  const handleClearWip = useCallback(() => {
    localStorage.removeItem(WIP_KEY);
    setWipSavedAt(null);
  }, []);

  const exportLabel = aiMode && voiceGenerations.size > 0 ? 'Export ZIP' : 'Export JSON';

  return (
    <AiVoiceContext.Provider value={{
      aiMode,
      characters,
      voiceGenerations,
      generatingNodes,
      onGenerateVoice: handleGenerateVoice,
      onPlayVoice: handlePlayVoice,
      onUnassignCharacter: handleUnassignCharacter,
    }}>
      <div className="app">
        <header className="app-header">
          <div className="app-title">
            <h1>WL Dialog Generator</h1>
          </div>
          <div className="app-toolbar">
            <button className="toolbar-btn" onClick={handleAddStart}>+ Start</button>
            <button className="toolbar-btn" onClick={handleAddNpcLine}>+ NPC Line</button>
            <button className="toolbar-btn" onClick={handleAddPlayerChoice}>+ Player Choice</button>
            <button className="toolbar-btn" onClick={handleOrganizeNodes}>Organize Nodes</button>
            <div className="save-load-wrapper" ref={saveLoadWrapperRef}>
              <button className="toolbar-btn" onClick={() => setMenuOpen(o => !o)}>Save/Load</button>
              {menuOpen && (
                <SaveLoadMenu
                  onLoadFile={() => fileInputRef.current?.click()}
                  onSaveWip={handleSaveWip}
                  onLoadWip={handleLoadWip}
                  onClearWip={handleClearWip}
                  wipSavedAt={wipSavedAt}
                  onClose={() => setMenuOpen(false)}
                />
              )}
            </div>
            {aiMode ? (
              <button className="toolbar-btn ai-btn ai-btn-active" onClick={handleDisableAiMode} title="Click to deactivate AI Voice Mode">
                AI Voice: ON
              </button>
            ) : (
              <button className="toolbar-btn ai-btn" onClick={() => setShowAiModal(true)}>
                AI Voice
              </button>
            )}
            <button className="toolbar-btn toolbar-btn-primary" onClick={handleExport} disabled={errors.length > 0}>{exportLabel}</button>
          </div>
        </header>
        <main className={`app-main${aiMode ? ' app-main-ai' : ''}`}>
          {aiMode && (
            <CharacterPanel
              onAddCharacter={() => setShowAddCharModal(true)}
              onRemoveCharacter={handleRemoveCharacter}
            />
          )}
          <DialogEditor
            nodes={nodes}
            onNodesChange={onNodesChange}
            edges={edges}
            setEdges={setEdges}
            onEdgesChange={onEdgesChange}
            onRegisterGetCenter={handleRegisterGetCenter}
          />
        </main>
        <ErrorPanel errors={errors} />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleLoadFile}
        />
        {showAiModal && (
          <AiVoiceModal onConfirm={handleEnableAiMode} onCancel={handleAiModalCancel} />
        )}
        {showAddCharModal && aiMode && (
          <AddCharacterModal onConfirm={handleAddCharacter} onCancel={() => setShowAddCharModal(false)} />
        )}
      </div>
    </AiVoiceContext.Provider>
  );
}

export default App;
