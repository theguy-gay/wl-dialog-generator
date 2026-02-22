import { MarkerType } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { Dialogs } from '../types';

export interface DialogFlowResult {
  nodes: Node[];
  edges: Edge[];
  replace?: boolean;
}

function resolveTargetNodeId(target: string, dialogs: Dialogs): string {
  if (target in dialogs.playerChoices) return `playerChoice-${target}`;
  return `npcLine-${target}`;
}

export function computeTreeLayout(
  nodeIds: string[],
  edges: Edge[],
  startId: string,
): Map<string, { x: number; y: number }> {
  const X_SPACING = 500;
  const Y_SPACING = 300;

  // Build adjacency list (source → [targets])
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const edge of edges) adj.get(edge.source)?.push(edge.target);

  // BFS from start — assign the shallowest level to each node
  const level = new Map<string, number>();
  level.set(startId, 0);
  const queue = [startId];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (!level.has(next)) {
        level.set(next, level.get(cur)! + 1);
        queue.push(next);
      }
    }
  }

  // Any node not reachable from start goes below the rest
  const maxLevel = Math.max(0, ...level.values());
  for (const id of nodeIds) {
    if (!level.has(id)) level.set(id, maxLevel + 1);
  }

  // Group by level and assign centered x positions
  const groups = new Map<number, string[]>();
  for (const [id, lv] of level) {
    if (!groups.has(lv)) groups.set(lv, []);
    groups.get(lv)!.push(id);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [lv, ids] of groups) {
    const totalHeight = (ids.length - 1) * Y_SPACING;
    ids.forEach((id, i) => {
      positions.set(id, {
        x: lv * X_SPACING,
        y: -totalHeight / 2 + i * Y_SPACING,
      });
    });
  }
  return positions;
}

export function dialogToFlow(dialogs: Dialogs): DialogFlowResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const arrow = { type: MarkerType.ArrowClosed };

  // Process NPC lines
  for (const [label, line] of Object.entries(dialogs.npcLines)) {
    const data: Record<string, unknown> = {
      _label: label,
      _type: 'npcLine',
      _isStart: label === dialogs.start,
      duration: line.duration,
    };
    if (line.text !== undefined) data.text = line.text;
    if (line.media !== undefined) data.media = line.media;
    if (line.animation !== undefined) data.animation = line.animation;
    if (line.camera !== undefined) data.camera = line.camera;
    if (line.hidableGroup !== undefined) data.hidableGroup = line.hidableGroup;

    nodes.push({
      id: `npcLine-${label}`,
      type: 'npcLine',
      position: { x: 0, y: 0 }, // overwritten by computeTreeLayout below
      data,
    });

    // Build edges from triggers
    if (line.triggers !== undefined) {
      if (Array.isArray(line.triggers)) {
        line.triggers.forEach((target, i) => {
          edges.push({
            id: `edge-npcLine-${label}-to-${target}-${i}`,
            source: `npcLine-${label}`,
            target: resolveTargetNodeId(target, dialogs),
            markerEnd: arrow,
          });
        });
      } else {
        const target = line.triggers;
        edges.push({
          id: `edge-npcLine-${label}-to-${target}`,
          source: `npcLine-${label}`,
          target: resolveTargetNodeId(target, dialogs),
          markerEnd: arrow,
        });
      }
    }
  }

  // Process player choices
  for (const [label, choices] of Object.entries(dialogs.playerChoices)) {
    nodes.push({
      id: `playerChoice-${label}`,
      type: 'playerChoice',
      position: { x: 0, y: 0 }, // overwritten by computeTreeLayout below
      data: {
        _label: label,
        _type: 'playerChoice',
        _isStart: label === dialogs.start,
        choices: choices.map(c => ({ text: c.text })),
      },
    });

    choices.forEach((choice, i) => {
      edges.push({
        id: `edge-playerChoice-${label}-${i}-to-${choice.triggers}`,
        source: `playerChoice-${label}`,
        sourceHandle: `choice-${i}`,
        target: `npcLine-${choice.triggers}`,
        markerEnd: arrow,
        data: { choiceIndex: i },
      });
    });
  }

  // Compute BFS tree layout
  const startId = dialogs.start in dialogs.playerChoices
    ? `playerChoice-${dialogs.start}`
    : `npcLine-${dialogs.start}`;

  const positions = computeTreeLayout(nodes.map(n => n.id), edges, startId);
  for (const node of nodes) {
    node.position = positions.get(node.id) ?? { x: 0, y: 0 };
  }

  const result: DialogFlowResult = { nodes, edges };
  if (dialogs.replace !== undefined) result.replace = dialogs.replace;
  return result;
}
