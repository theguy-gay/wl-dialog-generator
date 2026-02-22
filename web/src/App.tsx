import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import DialogEditor from './components/DialogEditor';
import { ErrorPanel } from './components/ErrorPanel';
import { SaveLoadMenu } from './components/SaveLoadMenu';
import type { Dialogs } from './types';
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

  const errors = useMemo(() => validateFlow(nodes, edges), [nodes, edges]);

  // Close menu when clicking outside the wrapper
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (saveLoadWrapperRef.current && !saveLoadWrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleExport = useCallback(() => {
    if (errors.length > 0) return;
    const dialogs = flowToDialog(nodes, edges);
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
  }, [nodes, edges, errors]);

  const handleOrganizeNodes = useCallback(() => {
    const startNode = nodes.find(n => n.data._type === 'start');
    const startId = startNode?.id ?? nodes[0]?.id;
    if (!startId) return;
    const positions = computeTreeLayout(nodes.map(n => n.id), edges, startId);
    setNodes(nds => nds.map(n => ({ ...n, position: positions.get(n.id) ?? n.position })));
  }, [nodes, edges, setNodes]);

  const handleAddStart = useCallback(() => {
    if (nodes.some(n => n.data._type === 'start')) return;
    const newNode: Node = {
      id: 'start',
      type: 'start',
      position: { x: -600, y: 0 },
      data: { _type: 'start' },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  const handleAddNpcLine = useCallback(() => {
    const npcCount = nodes.filter(n => n.data._type === 'npcLine').length + 1;
    const label = `npcLine${npcCount}`;
    const maxY = Math.max(0, ...nodes.map(n => n.position.y));
    const newNode: Node = {
      id: `npcLine-${label}`,
      type: 'npcLine',
      position: { x: 0, y: maxY + 300 },
      data: { _label: label, _type: 'npcLine', duration: 1 },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  const handleAddPlayerChoice = useCallback(() => {
    const choiceCount = nodes.filter(n => n.data._type === 'playerChoice').length + 1;
    const label = `playerChoice${choiceCount}`;
    const maxY = Math.max(0, ...nodes.map(n => n.position.y));
    const newNode: Node = {
      id: `playerChoice-${label}`,
      type: 'playerChoice',
      position: { x: 0, y: maxY + 300 },
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
        setNodes(newNodes);
        setEdges(newEdges);
      } catch (err) {
        alert('Failed to load file: ' + (err instanceof Error ? err.message : 'Invalid JSON'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [setNodes, setEdges]);

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

  return (
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
          <button className="toolbar-btn toolbar-btn-primary" onClick={handleExport} disabled={errors.length > 0}>Export JSON</button>
        </div>
      </header>
      <main className="app-main">
        <DialogEditor
          nodes={nodes}
          onNodesChange={onNodesChange}
          edges={edges}
          setEdges={setEdges}
          onEdgesChange={onEdgesChange}
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
    </div>
  );
}

export default App;
