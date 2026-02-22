import type { Node, Edge } from '@xyflow/react';
import { validateFlow } from '../utils/validateFlow';

// Helpers for building minimal nodes
function npcLine(label: string, isStart: boolean, duration: number): Node {
  return {
    id: `npcLine-${label}`,
    type: 'npcLine',
    position: { x: 0, y: 0 },
    data: { _label: label, _type: 'npcLine', _isStart: isStart, duration },
  };
}

function playerChoice(label: string, choices: Array<{ text: string }>): Node {
  return {
    id: `playerChoice-${label}`,
    type: 'playerChoice',
    position: { x: 0, y: 0 },
    data: { _label: label, _type: 'playerChoice', _isStart: false, choices },
  };
}

function edgeNpc(from: string, to: string): Edge {
  return { id: `edge-${from}-to-${to}`, source: `npcLine-${from}`, target: `npcLine-${to}` };
}

function edgeNpcToChoice(from: string, to: string): Edge {
  return { id: `edge-${from}-to-${to}`, source: `npcLine-${from}`, target: `playerChoice-${to}` };
}

function edgeChoice(from: string, choiceIdx: number, to: string): Edge {
  return {
    id: `edge-${from}-${choiceIdx}-to-${to}`,
    source: `playerChoice-${from}`,
    sourceHandle: `choice-${choiceIdx}`,
    target: `npcLine-${to}`,
    data: { choiceIndex: choiceIdx },
  };
}

test('valid flow produces no errors', () => {
  const nodes: Node[] = [
    npcLine('intro', true, 3),
    playerChoice('menu', [{ text: 'Option A' }, { text: 'Option B' }]),
    npcLine('responseA', false, 2),
    npcLine('responseB', false, 2),
  ];
  const edges: Edge[] = [
    edgeNpcToChoice('intro', 'menu'),
    edgeChoice('menu', 0, 'responseA'),
    edgeChoice('menu', 1, 'responseB'),
  ];
  expect(validateFlow(nodes, edges)).toEqual([]);
});

test('NPC line with NaN duration reports an error', () => {
  const nodes: Node[] = [npcLine('intro', true, NaN)];
  const errors = validateFlow(nodes, []);
  expect(errors).toContain('NPC line "intro": duration must be a number');
});

test('player choice with empty text reports an error', () => {
  const nodes: Node[] = [
    npcLine('intro', true, 2),
    playerChoice('menu', [{ text: '' }]),
  ];
  const edges: Edge[] = [
    edgeNpcToChoice('intro', 'menu'),
    edgeChoice('menu', 0, 'intro'),
  ];
  const errors = validateFlow(nodes, edges);
  expect(errors).toContain('Player choice "menu": choice 1 text is empty');
});

test('player choice with unconnected choice reports an error', () => {
  const nodes: Node[] = [
    npcLine('intro', true, 2),
    playerChoice('menu', [{ text: 'Go' }, { text: 'Stay' }]),
    npcLine('next', false, 2),
  ];
  const edges: Edge[] = [
    edgeNpcToChoice('intro', 'menu'),
    edgeChoice('menu', 0, 'next'),
    // choice 1 has no edge
  ];
  const errors = validateFlow(nodes, edges);
  expect(errors).toContain('Player choice "menu": choice 2 is not connected');
  expect(errors).not.toContain('Player choice "menu": choice 1 is not connected');
});

test('orphaned node with invalid duration is not reported', () => {
  const nodes: Node[] = [
    npcLine('intro', true, 2),
    npcLine('orphan', false, NaN), // not reachable from start
  ];
  const errors = validateFlow(nodes, []);
  expect(errors).toEqual([]);
});
