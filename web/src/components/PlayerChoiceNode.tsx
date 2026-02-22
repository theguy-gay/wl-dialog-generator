import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export function PlayerChoiceNode({ id, data }: NodeProps) {
  const { updateNodeData } = useReactFlow();

  const choices = data.choices as Array<{ text: string }>;

  function onChoiceTextChange(index: number, value: string) {
    const newChoices = choices.map((c, i) => (i === index ? { text: value } : c));
    updateNodeData(id, { choices: newChoices });
  }

  return (
    <div className="dialog-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header node-header-choice">{data._label as string}</div>

      <div className="node-fields">
        {choices.map((choice, i) => (
          <div className="node-field node-choice-row" key={i}>
            <label>Choice {i + 1}</label>
            <input
              className="nodrag"
              type="text"
              value={choice.text}
              onChange={e => onChoiceTextChange(i, e.target.value)}
            />
            <Handle
              type="source"
              position={Position.Right}
              id={`choice-${i}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
