import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export function StartNode({ id, data }: NodeProps) {
  const { updateNodeData, deleteElements } = useReactFlow();

  const replace = data.replace as boolean | undefined;

  return (
    <div className="dialog-node">
      <div className="node-header node-header-start">
        <span>Start</span>
        <button
          className="node-delete-btn nodrag"
          onClick={() => deleteElements({ nodes: [{ id }] })}
          title="Delete node"
        >×</button>
      </div>

      <div className="node-fields">
        <div className="node-field">
          <label>Replace</label>
          <input
            className="nodrag"
            type="checkbox"
            checked={!!replace}
            onChange={e => updateNodeData(id, { replace: e.target.checked || undefined })}
          />
        </div>

        <div className="node-field node-choice-row">
          <label>Start</label>
          <Handle
            type="source"
            position={Position.Right}
            id="start"
          />
        </div>
      </div>
    </div>
  );
}
