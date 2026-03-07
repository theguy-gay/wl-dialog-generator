import { createContext, useContext } from 'react';

export interface Character {
  id: string;
  name: string;
  voiceId: string;
  color: string;
}

export interface AiVoiceContextValue {
  aiMode: { apiKey: string } | null;
  characters: Character[];
  voiceGenerations: Map<string, ArrayBuffer>;
  generatingNodes: Set<string>;
  onGenerateVoice: (nodeId: string, text: string, voiceId: string) => Promise<void>;
  onPlayVoice: (nodeId: string) => void;
  onUnassignCharacter: (nodeId: string) => void;
}

export const AiVoiceContext = createContext<AiVoiceContextValue>(null!);

export function useAiVoice(): AiVoiceContextValue {
  return useContext(AiVoiceContext);
}

export const CHARACTER_COLORS = [
  '#a855f7',
  '#22d3ee',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#14b8a6',
];
