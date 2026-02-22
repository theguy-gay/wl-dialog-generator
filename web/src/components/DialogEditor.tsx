import { useCallback } from 'react';
import {
  ReactFlow,
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import { type Dispatch, type SetStateAction } from 'react';
import '@xyflow/react/dist/style.css';
import { NpcLineNode } from './NpcLineNode';
import { PlayerChoiceNode } from './PlayerChoiceNode';
import { StartNode } from './StartNode';
import './nodes.css';

// Defined outside the component so the object reference is stable across renders
const nodeTypes = {
  start: StartNode,
  npcLine: NpcLineNode,
  playerChoice: PlayerChoiceNode,
};

interface DialogEditorProps {
  nodes: Node[];
  onNodesChange: OnNodesChange;
  edges: Edge[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onEdgesChange: OnEdgesChange;
}

function DialogEditor({ nodes, onNodesChange, edges, setEdges, onEdgesChange }: DialogEditorProps) {
  const onConnect = useCallback(
    (connection: Connection) => {
      let data: Record<string, unknown> | undefined;
      if (connection.sourceHandle?.startsWith('choice-')) {
        const idx = parseInt(connection.sourceHandle.slice('choice-'.length), 10);
        if (!isNaN(idx)) data = { choiceIndex: idx };
      }
      setEdges(eds => addEdge({ ...connection, data }, eds));
    },
    [setEdges]
  );

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
      </ReactFlow>
    </div>
  );
}

export default DialogEditor;
