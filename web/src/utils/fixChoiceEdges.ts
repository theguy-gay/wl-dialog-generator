import type { Edge } from '@xyflow/react';

/**
 * Updates edges after a choice row is removed from a PlayerChoiceNode.
 * - Drops the edge that was connected to the deleted choice.
 * - Shifts down the sourceHandle index (and data.choiceIndex) for all edges
 *   connected to choices that came after the deleted one.
 */
export function fixChoiceEdgesOnRemove(edges: Edge[], nodeId: string, removedIndex: number): Edge[] {
  return edges
    .filter(e => !(e.source === nodeId && e.sourceHandle === `choice-${removedIndex}`))
    .map(e => {
      if (e.source !== nodeId || !e.sourceHandle?.startsWith('choice-')) return e;
      const idx = parseInt(e.sourceHandle.slice('choice-'.length), 10);
      if (isNaN(idx) || idx <= removedIndex) return e;
      const newIdx = idx - 1;
      return { ...e, sourceHandle: `choice-${newIdx}`, data: { ...e.data, choiceIndex: newIdx } };
    });
}
