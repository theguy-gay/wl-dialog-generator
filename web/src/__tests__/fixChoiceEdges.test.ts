import type { Edge } from '@xyflow/react';
import { fixChoiceEdgesOnRemove } from '../utils/fixChoiceEdges';

const nodeId = 'playerChoice-myChoice';

function makeEdge(sourceHandle: string, target: string, choiceIndex?: number): Edge {
  return {
    id: `e-${sourceHandle}-${target}`,
    source: nodeId,
    sourceHandle,
    target,
    data: choiceIndex !== undefined ? { choiceIndex } : {},
  } as Edge;
}

function makeUnrelatedEdge(): Edge {
  return {
    id: 'e-other',
    source: 'otherNode',
    sourceHandle: 'choice-0',
    target: 'npcLine-foo',
    data: { choiceIndex: 0 },
  } as Edge;
}

describe('fixChoiceEdgesOnRemove', () => {
  test('removes edge for deleted choice and shifts higher indices down', () => {
    const edges: Edge[] = [
      makeEdge('choice-0', 'npcLine-A', 0),
      makeEdge('choice-1', 'npcLine-B', 1),
    ];

    const result = fixChoiceEdgesOnRemove(edges, nodeId, 0);

    expect(result).toHaveLength(1);
    expect(result[0].sourceHandle).toBe('choice-0');
    expect(result[0].target).toBe('npcLine-B');
    expect((result[0].data as { choiceIndex: number }).choiceIndex).toBe(0);
  });

  test('removes edge for last choice and leaves earlier edges unchanged', () => {
    const edges: Edge[] = [
      makeEdge('choice-0', 'npcLine-A', 0),
      makeEdge('choice-1', 'npcLine-B', 1),
    ];

    const result = fixChoiceEdgesOnRemove(edges, nodeId, 1);

    expect(result).toHaveLength(1);
    expect(result[0].sourceHandle).toBe('choice-0');
    expect(result[0].target).toBe('npcLine-A');
    expect((result[0].data as { choiceIndex: number }).choiceIndex).toBe(0);
  });

  test('removes middle choice edge and shifts only higher indices', () => {
    const edges: Edge[] = [
      makeEdge('choice-0', 'npcLine-A', 0),
      makeEdge('choice-1', 'npcLine-B', 1),
      makeEdge('choice-2', 'npcLine-C', 2),
    ];

    const result = fixChoiceEdgesOnRemove(edges, nodeId, 1);

    expect(result).toHaveLength(2);
    expect(result[0].sourceHandle).toBe('choice-0');
    expect(result[0].target).toBe('npcLine-A');
    expect((result[0].data as { choiceIndex: number }).choiceIndex).toBe(0);
    expect(result[1].sourceHandle).toBe('choice-1');
    expect(result[1].target).toBe('npcLine-C');
    expect((result[1].data as { choiceIndex: number }).choiceIndex).toBe(1);
  });

  test('does not affect edges from other nodes', () => {
    const unrelated = makeUnrelatedEdge();
    const edges: Edge[] = [
      makeEdge('choice-0', 'npcLine-A', 0),
      unrelated,
    ];

    const result = fixChoiceEdgesOnRemove(edges, nodeId, 0);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(unrelated);
  });

  test('handles gracefully when no edge exists for the deleted choice', () => {
    const edges: Edge[] = [
      makeEdge('choice-1', 'npcLine-B', 1),
    ];

    const result = fixChoiceEdgesOnRemove(edges, nodeId, 0);

    expect(result).toHaveLength(1);
    expect(result[0].sourceHandle).toBe('choice-0');
    expect((result[0].data as { choiceIndex: number }).choiceIndex).toBe(0);
  });
});
