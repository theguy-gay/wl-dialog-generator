import { useCallback, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Dialogs } from '../types';
import { dialogToFlow } from '../utils/dialogToFlow';
import { flowToDialog } from '../utils/flowToDialog';
import { NpcLineNode } from './NpcLineNode';
import { PlayerChoiceNode } from './PlayerChoiceNode';
import './nodes.css';
import dialogsJson from '../../../dialogs.json';

const { nodes: initialNodes, edges: initialEdges, replace: initialReplace } =
  dialogToFlow(dialogsJson as Dialogs);

// Defined outside the component so the object reference is stable across renders
const nodeTypes = {
  npcLine: NpcLineNode,
  playerChoice: PlayerChoiceNode,
};

function DialogEditor() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [replace] = useState<boolean | undefined>(initialReplace);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const handleExport = useCallback(() => {
    const dialogs = flowToDialog(nodes, edges, replace);
    const json = JSON.stringify(dialogs, null, 4);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dialog.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, replace]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Panel position="top-right">
          <button onClick={handleExport} style={{ padding: '6px 14px', cursor: 'pointer' }}>
            Export JSON
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default DialogEditor;
