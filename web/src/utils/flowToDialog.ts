import type { Node, Edge } from '@xyflow/react';
import type { Dialogs, NPCLine, PlayerChoice, Camera, HidableGroup, CharacterAnimation } from '../types';

function stripPrefix(nodeId: string): string {
  if (nodeId.startsWith('npcLine-')) return nodeId.slice('npcLine-'.length);
  if (nodeId.startsWith('playerChoice-')) return nodeId.slice('playerChoice-'.length);
  return nodeId;
}

export function flowToDialog(nodes: Node[], edges: Edge[], replace?: boolean): Dialogs {
  // Index outgoing edges by source node ID for O(1) lookup
  const outgoingEdges = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (!outgoingEdges.has(edge.source)) outgoingEdges.set(edge.source, []);
    outgoingEdges.get(edge.source)!.push(edge);
  }

  const startNode = nodes.find(n => n.data._isStart === true);
  if (!startNode) throw new Error('No start node found in flow');
  const start = stripPrefix(startNode.id);

  const npcLines: { [label: string]: NPCLine } = {};
  const playerChoices: { [label: string]: PlayerChoice[] } = {};

  for (const node of nodes) {
    const data = node.data;
    const label = stripPrefix(node.id);

    if (data._type === 'npcLine') {
      // Build NPCLine field-by-field — never spread data (avoids _label/_type/_isStart bleeding in)
      const line: NPCLine = { duration: data.duration as number };
      if (data.text !== undefined) line.text = data.text as string;
      if (data.media !== undefined) line.media = data.media as string | string[];
      if (data.animation !== undefined) line.animation = data.animation as string | CharacterAnimation;
      if (data.camera !== undefined) line.camera = data.camera as Camera;
      if (data.hidableGroup !== undefined) line.hidableGroup = data.hidableGroup as HidableGroup;

      // Derive triggers from outgoing edges
      const outEdges = outgoingEdges.get(node.id) ?? [];
      if (outEdges.length === 1) {
        line.triggers = stripPrefix(outEdges[0].target);
      } else if (outEdges.length > 1) {
        // Sort by trailing index in edge ID (e.g. edge-npcLine-X-to-Y-0, -1, ...) to preserve original order
        const sorted = outEdges.slice().sort((a, b) => {
          const getIdx = (id: string) => { const m = id.match(/-(\d+)$/); return m ? parseInt(m[1], 10) : 0; };
          return getIdx(a.id) - getIdx(b.id);
        });
        line.triggers = sorted.map(e => stripPrefix(e.target));
      }
      // 0 outgoing edges: no triggers property

      npcLines[label] = line;

    } else if (data._type === 'playerChoice') {
      const choiceTexts = data.choices as Array<{ text: string }>;
      const outEdges = (outgoingEdges.get(node.id) ?? [])
        .slice()
        .sort((a, b) => {
          const ai = (a.data?.choiceIndex as number) ?? 0;
          const bi = (b.data?.choiceIndex as number) ?? 0;
          return ai - bi;
        });

      const choices: PlayerChoice[] = choiceTexts.map((ct, i) => ({
        text: ct.text,
        triggers: stripPrefix(outEdges[i].target),
      }));

      playerChoices[label] = choices;
    }
  }

  const result: Dialogs = { start, npcLines, playerChoices };
  if (replace !== undefined) result.replace = replace;
  return result;
}
