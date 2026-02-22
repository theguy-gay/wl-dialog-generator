import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { RenameableLabel } from './RenameableLabel';
import { useRenameNode } from '../hooks/useRenameNode';
import { SubBox } from './SubBox';
import { fixChoiceEdgesOnRemove } from '../utils/fixChoiceEdges';

export function PlayerChoiceNode({ id, data }: NodeProps) {
  const { updateNodeData, deleteElements, setEdges } = useReactFlow();
  const rename = useRenameNode(id, 'playerChoice');

  const choices = data.choices as Array<{ text: string }>;

  function onChoiceTextChange(index: number, value: string) {
    const newChoices = choices.map((c, i) => (i === index ? { text: value } : c));
    updateNodeData(id, { choices: newChoices });
  }

  function addChoice() {
    updateNodeData(id, { choices: [...choices, { text: '' }] });
  }

  function removeChoice(index: number) {
    updateNodeData(id, { choices: choices.filter((_, i) => i !== index) });
    setEdges(edges => fixChoiceEdgesOnRemove(edges, id, index));
  }

  return (
    <div className="dialog-node">
      <Handle type="target" position={Position.Left} style={{ top: 14 }} />

      <div className="node-header node-header-choice">
        <RenameableLabel label={data._label as string} onRename={rename} />
        <button
          className="node-delete-btn nodrag"
          onClick={() => deleteElements({ nodes: [{ id }] })}
          title="Delete node"
        >×</button>
      </div>

      <div className="node-fields">
        <SubBox label="Choices" onAdd={addChoice}>
          {choices.map((choice, i) => (
            <div className="node-field node-choice-row" key={i}>
              <label>Choice {i + 1}</label>
              <input
                className="nodrag"
                type="text"
                value={choice.text}
                onChange={e => onChoiceTextChange(i, e.target.value)}
              />
              <button
                className="node-icon-btn nodrag"
                onClick={() => removeChoice(i)}
                title="Remove"
              >
                ×
              </button>
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${i}`}
              />
            </div>
          ))}
        </SubBox>
      </div>
    </div>
  );
}
