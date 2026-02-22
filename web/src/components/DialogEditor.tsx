import { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  {
    id: 'npc-start',
    type: 'default',
    position: { x: 250, y: 100 },
    data: { label: 'NPC Line: slaveConversationIntro' },
  },
  {
    id: 'player-1',
    type: 'default',
    position: { x: 100, y: 300 },
    data: { label: 'Player Choice: introResponse' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-start-player1',
    source: 'npc-start',
    target: 'player-1',
    animated: true,
  },
];

function DialogEditor() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

export default DialogEditor;
