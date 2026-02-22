import type { Node, Edge } from '@xyflow/react';

function stripPrefix(nodeId: string): string {
  if (nodeId.startsWith('npcLine-')) return nodeId.slice('npcLine-'.length);
  if (nodeId.startsWith('playerChoice-')) return nodeId.slice('playerChoice-'.length);
  return nodeId;
}

export function validateFlow(nodes: Node[], edges: Edge[]): string[] {
  const errors: string[] = [];

  // Build outgoing edge index
  const outgoingEdges = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
    outgoingEdges.get(edge.source)!.push(edge);
  }

  // Find start node
  const startNode = nodes.find(n => n.data._isStart === true);
  if (!startNode) return ['No start node found'];

  // BFS — only validate reachable nodes
  const reachable = new Set<string>();
  const queue: string[] = [startNode.id];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (reachable.has(cur)) continue;
    reachable.add(cur);
    for (const edge of outgoingEdges.get(cur) ?? []) queue.push(edge.target);
  }

  for (const node of nodes) {
    if (!reachable.has(node.id)) continue;
    const label = stripPrefix(node.id);
    const data = node.data;

    if (data._type === 'npcLine') {
      const duration = data.duration as number;
      if (typeof duration !== 'number' || !isFinite(duration)) {
        errors.push(`NPC line "${label}": duration must be a number`);
      }

    } else if (data._type === 'playerChoice') {
      const choices = data.choices as Array<{ text: string }>;
      const nodeEdges = outgoingEdges.get(node.id) ?? [];

      const getChoiceIdx = (e: Edge): number => {
        if (typeof e.sourceHandle === 'string' && e.sourceHandle.startsWith('choice-')) {
          const n = parseInt(e.sourceHandle.slice('choice-'.length), 10);
          if (!isNaN(n)) return n;
        }
        return (e.data?.choiceIndex as number) ?? -1;
      };

      choices.forEach((choice, i) => {
        if (!choice.text.trim()) {
          errors.push(`Player choice "${label}": choice ${i + 1} text is empty`);
        }
        if (!nodeEdges.some(e => getChoiceIdx(e) === i)) {
          errors.push(`Player choice "${label}": choice ${i + 1} is not connected`);
        }
      });
    }
  }

  return errors;
}
