import defaultDialogs from '../../../dialogs.json';
import { dialogToFlow } from '../utils/dialogToFlow';
import { flowToDialog } from '../utils/flowToDialog';
import type { Dialogs } from '../types';
import type { Node, Edge } from '@xyflow/react';

test('round-trip: dialogToFlow → flowToDialog produces identical JSON', () => {
  const { nodes, edges, replace } = dialogToFlow(defaultDialogs as Dialogs);
  const result = flowToDialog(nodes, edges, replace);
  expect(result).toEqual(defaultDialogs);
});

test('unconnected playerChoice node is omitted from export', () => {
  const nodes: Node[] = [
    {
      id: 'npcLine-intro',
      type: 'npcLine',
      position: { x: 0, y: 0 },
      data: { _label: 'intro', _type: 'npcLine', _isStart: true, duration: 3 },
    },
    {
      id: 'playerChoice-choice1',
      type: 'playerChoice',
      position: { x: 0, y: 300 },
      data: {
        _label: 'choice1',
        _type: 'playerChoice',
        _isStart: false,
        choices: [{ text: 'Option A' }, { text: 'Option B' }],
      },
    },
  ];
  const edges: Edge[] = [];

  const result = flowToDialog(nodes, edges);
  expect(result.playerChoices).toEqual({});
});

test('partially connected playerChoice only exports connected choices', () => {
  const nodes: Node[] = [
    {
      id: 'npcLine-intro',
      type: 'npcLine',
      position: { x: 0, y: 0 },
      data: { _label: 'intro', _type: 'npcLine', _isStart: true, duration: 3 },
    },
    {
      id: 'npcLine-response',
      type: 'npcLine',
      position: { x: 0, y: 300 },
      data: { _label: 'response', _type: 'npcLine', _isStart: false, duration: 2 },
    },
    {
      id: 'playerChoice-menu',
      type: 'playerChoice',
      position: { x: 0, y: 150 },
      data: {
        _label: 'menu',
        _type: 'playerChoice',
        _isStart: false,
        choices: [{ text: 'Connected' }, { text: 'Not connected' }],
      },
    },
  ];
  const edges: Edge[] = [
    {
      id: 'edge-npcLine-intro-to-menu',
      source: 'npcLine-intro',
      target: 'playerChoice-menu',
    },
    {
      id: 'edge-playerChoice-menu-0-to-response',
      source: 'playerChoice-menu',
      sourceHandle: 'choice-0',
      target: 'npcLine-response',
      data: { choiceIndex: 0 },
    },
  ];

  const result = flowToDialog(nodes, edges);
  expect(result.playerChoices['menu']).toEqual([
    { text: 'Connected', triggers: 'response' },
  ]);
});
