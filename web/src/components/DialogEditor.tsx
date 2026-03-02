import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
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

// Renders inside ReactFlow's context to expose a viewport-center getter to the parent
function ViewportBridge({
  containerRef,
  onReady,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReady: (fn: () => { x: number; y: number }) => void;
}) {
  const { screenToFlowPosition } = useReactFlow();
  const s2f = useRef(screenToFlowPosition);
  s2f.current = screenToFlowPosition;

  useEffect(() => {
    onReady(() => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return s2f.current({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

interface DialogEditorProps {
  nodes: Node[];
  onNodesChange: OnNodesChange;
  edges: Edge[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  onEdgesChange: OnEdgesChange;
  onRegisterGetCenter: (fn: () => { x: number; y: number }) => void;
}

function DialogEditor({ nodes, onNodesChange, edges, setEdges, onEdgesChange, onRegisterGetCenter }: DialogEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
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
          <ViewportBridge containerRef={containerRef} onReady={onRegisterGetCenter} />
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
    </>
  );
}

export default DialogEditor;
