import defaultDialogs from '../../../dialogs.json';
import { dialogToFlow } from '../utils/dialogToFlow';
import { flowToDialog } from '../utils/flowToDialog';
import type { Dialogs } from '../types';

test('round-trip: dialogToFlow → flowToDialog produces identical JSON', () => {
  const { nodes, edges, replace } = dialogToFlow(defaultDialogs as Dialogs);
  const result = flowToDialog(nodes, edges, replace);
  expect(result).toEqual(defaultDialogs);
});
