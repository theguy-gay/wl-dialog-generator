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
import { CustomEdge } from './CustomEdge';
import { EDGE_COLORS, pickEdgeColor } from '../utils/edgeColors';
import './nodes.css';

// Defined outside the component so the object reference is stable across renders
const nodeTypes = {
  start: StartNode,
  npcLine: NpcLineNode,
  playerChoice: PlayerChoiceNode,
};

const edgeTypes = {
  default: CustomEdge,
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
      setEdges(eds => {
        let data: Record<string, unknown> = { color: pickEdgeColor(eds.length) };
        if (connection.sourceHandle?.startsWith('choice-')) {
          const idx = parseInt(connection.sourceHandle.slice('choice-'.length), 10);
          if (!isNaN(idx)) data = { ...data, choiceIndex: idx };
        }
        return addEdge({ ...connection, data }, eds);
      });
    },
    [setEdges]
  );

  return (
    <>
      {/* Global SVG marker defs — one colored arrowhead per palette color */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          {EDGE_COLORS.map(color => {
            const id = `arrow-${color.slice(1)}`;
            return (
              <marker
                key={id}
                id={id}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={color} />
              </marker>
            );
          })}
        </defs>
      </svg>

      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
    </>
  );
}

export default DialogEditor;
