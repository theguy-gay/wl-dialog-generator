import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useAiVoice } from '../context/AiVoiceContext';

interface Props {
  nodeId: string;
  text: string | undefined;
  assignedCharacterId: string | undefined;
}

export function AiVoiceSection({ nodeId, text, assignedCharacterId }: Props) {
  const { updateNodeData } = useReactFlow();
  const { characters, voiceGenerations, generatingNodes, onGenerateVoice, onPlayVoice, onUnassignCharacter } = useAiVoice();
  const [isDragOver, setIsDragOver] = useState(false);

  const assignedChar = assignedCharacterId
    ? characters.find(c => c.id === assignedCharacterId)
    : undefined;

  const isGenerating = generatingNodes.has(nodeId);
  const hasGeneration = voiceGenerations.has(nodeId);

  return (
    <div className="ai-voice-section nodrag">
      {assignedChar ? (
        <>
          <div className="character-badge-node" style={{ borderColor: assignedChar.color }}>
            <span className="character-badge-dot" style={{ background: assignedChar.color }} />
            <span className="character-badge-name">{assignedChar.name}</span>
            <button
              className="character-badge-remove"
              onClick={() => onUnassignCharacter(nodeId)}
              title="Unassign character"
            >×</button>
          </div>
          <div className="ai-voice-controls">
            <button
              className="voice-generate-btn nodrag"
              onClick={() => {
                if (!text?.trim()) return;
                onGenerateVoice(nodeId, text, assignedChar.voiceId);
              }}
              disabled={isGenerating || !text?.trim()}
              title={!text?.trim() ? 'Add text to the node first' : 'Generate voice'}
            >
              {isGenerating ? (
                <span className="voice-spinner" />
              ) : hasGeneration ? (
                'Regenerate'
              ) : (
                'Generate Voice'
              )}
            </button>
            {hasGeneration && !isGenerating && (
              <button
                className="voice-play-btn nodrag"
                onClick={() => onPlayVoice(nodeId)}
                title="Play generated audio"
              >
                ▶ Play
              </button>
            )}
          </div>
        </>
      ) : (
        <div
          className={`voice-drop-zone${isDragOver ? ' voice-drop-zone-over' : ''}`}
          onDragOver={e => {
            if (e.dataTransfer.types.includes('application/x-character-id')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDragEnter={e => {
            if (e.dataTransfer.types.includes('application/x-character-id')) {
              setIsDragOver(true);
            }
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={e => {
            const charId = e.dataTransfer.getData('application/x-character-id');
            setIsDragOver(false);
            if (charId) {
              e.preventDefault();
              e.stopPropagation();
              updateNodeData(nodeId, { aiCharacterId: charId });
            }
          }}
        >
          Drop character here
        </div>
      )}
    </div>
  );
}
