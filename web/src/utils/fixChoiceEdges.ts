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

/**
 * Updates edges after choices are reordered in a PlayerChoiceNode.
 * Remaps each choice-N sourceHandle to follow the item that moved.
 */
export function fixChoiceEdgesOnReorder(
  edges: Edge[], nodeId: string, oldIndex: number, newIndex: number
): Edge[] {
  return edges.map(e => {
    if (e.source !== nodeId || !e.sourceHandle?.startsWith('choice-')) return e;
    const hi = parseInt(e.sourceHandle.slice('choice-'.length), 10);
    if (isNaN(hi)) return e;
    let newHi = hi;
    if (hi === oldIndex) newHi = newIndex;
    else if (oldIndex < newIndex && hi > oldIndex && hi <= newIndex) newHi = hi - 1;
    else if (oldIndex > newIndex && hi >= newIndex && hi < oldIndex) newHi = hi + 1;
    if (newHi === hi) return e;
    return { ...e, sourceHandle: `choice-${newHi}`, data: { ...e.data, choiceIndex: newHi } };
  });
}
