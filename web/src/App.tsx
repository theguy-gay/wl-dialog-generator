import { useCallback, useMemo, useState } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import DialogEditor from './components/DialogEditor';
import { ErrorPanel } from './components/ErrorPanel';
import type { Dialogs } from './types';
import { dialogToFlow, computeTreeLayout } from './utils/dialogToFlow';
import { flowToDialog } from './utils/flowToDialog';
import { validateFlow } from './utils/validateFlow';
import './App.css';
import dialogsJson from '../../dialogs.json';

const { nodes: initialNodes, edges: initialEdges, replace: initialReplace } =
  dialogToFlow(dialogsJson as Dialogs);

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [replace] = useState<boolean | undefined>(initialReplace);

  const errors = useMemo(() => validateFlow(nodes, edges), [nodes, edges]);

  const handleExport = useCallback(() => {
    if (errors.length > 0) return;
    const dialogs = flowToDialog(nodes, edges, replace);
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
  }, [nodes, edges, replace, errors]);

  const handleOrganizeNodes = useCallback(() => {
    const startNode = nodes.find(n => n.data._isStart);
    const startId = startNode?.id ?? nodes[0]?.id;
    if (!startId) return;
    const positions = computeTreeLayout(nodes.map(n => n.id), edges, startId);
    setNodes(nds => nds.map(n => ({ ...n, position: positions.get(n.id) ?? n.position })));
  }, [nodes, edges, setNodes]);

  const handleAddNpcLine = useCallback(() => {
    const npcCount = nodes.filter(n => n.data._type === 'npcLine').length + 1;
    const label = `npcLine${npcCount}`;
    const maxY = Math.max(0, ...nodes.map(n => n.position.y));
    const newNode: Node = {
      id: `npcLine-${label}`,
      type: 'npcLine',
      position: { x: 0, y: maxY + 300 },
      data: { _label: label, _type: 'npcLine', _isStart: false, duration: 1 },
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
        _isStart: false,
        choices: [{ text: 'Choice 1' }],
      },
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>WL Dialog Generator</h1>
        </div>
        <div className="app-toolbar">
          <button className="toolbar-btn" onClick={handleAddNpcLine}>+ NPC Line</button>
          <button className="toolbar-btn" onClick={handleAddPlayerChoice}>+ Player Choice</button>
          <button className="toolbar-btn" onClick={handleOrganizeNodes}>Organize Nodes</button>
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
    </div>
  );
}

export default App;
