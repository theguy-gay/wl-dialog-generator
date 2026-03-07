import type { Node, Edge } from '@xyflow/react';
import type { AiVoiceCharacter } from '../types';
import { flowToDialog } from './flowToDialog';

function deriveMediaPath(node: Node): string {
  const media = node.data.media;
  if (typeof media === 'string' && media) return media;
  if (Array.isArray(media) && media[0]) return media[0] as string;
  return `sounds/dialog/${node.data._label as string}.mp3`;
}

function stripPrefix(nodeId: string): string {
  if (nodeId.startsWith('npcLine-')) return nodeId.slice('npcLine-'.length);
  return nodeId;
}

export async function exportZip(
  nodes: Node[],
  edges: Edge[],
  voiceGenerations: Map<string, ArrayBuffer>,
  characters: AiVoiceCharacter[]
): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  const dialogs = flowToDialog(nodes, edges);

  const voiceAssignments: { [label: string]: string } = {};
  for (const node of nodes) {
    if (node.data._type !== 'npcLine') continue;
    if (typeof node.data.aiCharacterId === 'string') {
      voiceAssignments[stripPrefix(node.id)] = node.data.aiCharacterId;
    }
  }
  if (characters.length > 0 || Object.keys(voiceAssignments).length > 0) {
    dialogs._aiVoice = { characters, voiceAssignments };
  }

  zip.file('dialog.json', JSON.stringify(dialogs, null, 4));

  for (const node of nodes) {
    if (node.data._type !== 'npcLine') continue;
    const buf = voiceGenerations.get(node.id);
    if (!buf) continue;
    const path = deriveMediaPath(node);
    zip.file(path, buf);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dialog.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
