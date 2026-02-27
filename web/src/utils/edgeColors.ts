export const EDGE_COLORS = [
  '#4a9eff',
  '#ff6b6b',
  '#51cf66',
  '#ffd43b',
  '#cc5de8',
  '#ff922b',
  '#20c997',
  '#f06595',
  '#74c0fc',
  '#a9e34b',
];

export function pickEdgeColor(index: number): string {
  return EDGE_COLORS[index % EDGE_COLORS.length];
}

