import { useReactFlow } from '@xyflow/react';

export function useRenameNode(id: string, nodeType: 'npcLine' | 'playerChoice') {
  const { setNodes, setEdges, getNodes } = useReactFlow();

  return function rename(newLabel: string): boolean {
    const trimmed = newLabel.trim();
    if (!trimmed) return false;
    const newId = `${nodeType}-${trimmed}`;
    if (id === newId) return true; // no-op

    // Reject if new ID already exists (another node has this label)
    if (getNodes().some(n => n.id === newId)) return false;

    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, id: newId, data: { ...n.data, _label: trimmed } } : n
    ));
    setEdges(edges => edges.map(e => ({
      ...e,
      source: e.source === id ? newId : e.source,
      target: e.target === id ? newId : e.target,
    })));
    return true;
  };
}
