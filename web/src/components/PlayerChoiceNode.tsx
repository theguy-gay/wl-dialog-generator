import { Handle, Position, useReactFlow, useEdges } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { AnimatedHandle } from './AnimatedHandle';
import { RenameableLabel } from './RenameableLabel';
import { useRenameNode } from '../hooks/useRenameNode';
import { SubBox } from './SubBox';
import { SortableArrayItem } from './SortableArrayItem';
import { fixChoiceEdgesOnRemove, fixChoiceEdgesOnReorder } from '../utils/fixChoiceEdges';

export function PlayerChoiceNode({ id, data }: NodeProps) {
  const { updateNodeData, deleteElements, setEdges } = useReactFlow();
  const edges = useEdges();

  const incomingColors = edges
    .filter(e => e.target === id)
    .map(e => e.data?.color as string)
    .filter(Boolean);
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
      <AnimatedHandle type="target" position={Position.Left} style={{ top: 14 }} colors={incomingColors} />

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
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const oldIndex = choices.findIndex((_, i) => `choice-item-${i}` === active.id);
              const newIndex = choices.findIndex((_, i) => `choice-item-${i}` === over.id);
              if (oldIndex !== -1 && newIndex !== -1) {
                updateNodeData(id, { choices: arrayMove(choices, oldIndex, newIndex) });
                setEdges(edges => fixChoiceEdgesOnReorder(edges, id, oldIndex, newIndex));
              }
            }}
          >
            <SortableContext items={choices.map((_, i) => `choice-item-${i}`)} strategy={verticalListSortingStrategy}>
              {choices.map((choice, i) => {
                const choiceColor = edges.find(
                  e => e.source === id && e.sourceHandle === `choice-${i}`
                )?.data?.color as string | undefined;
                return (
                  <SortableArrayItem key={`choice-item-${i}`} id={`choice-item-${i}`} className="node-choice-row">
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
                      style={choiceColor ? { background: choiceColor } : {}}
                    />
                  </SortableArrayItem>
                );
              })}
            </SortableContext>
          </DndContext>
        </SubBox>
      </div>
    </div>
  );
}
