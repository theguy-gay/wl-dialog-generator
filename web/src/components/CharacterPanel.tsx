import { useAiVoice } from '../context/AiVoiceContext';

interface Props {
  onAddCharacter: () => void;
  onRemoveCharacter: (charId: string) => void;
}

export function CharacterPanel({ onAddCharacter, onRemoveCharacter }: Props) {
  const { characters } = useAiVoice();

  return (
    <aside className="character-panel">
      <div className="character-panel-header">
        <span>Characters</span>
        <button className="toolbar-btn ai-btn character-panel-add-btn" onClick={onAddCharacter}>+ Add</button>
      </div>
      <div className="character-panel-list">
        {characters.length === 0 && (
          <div className="character-panel-empty">
            Add characters and drag them onto NPC line nodes to assign voices.
          </div>
        )}
        {characters.map(char => (
          <div
            key={char.id}
            className="character-card"
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('application/x-character-id', char.id);
              e.dataTransfer.effectAllowed = 'copy';
            }}
            title={`Voice ID: ${char.voiceId}\nDrag onto an NPC line node to assign`}
          >
            <span className="character-card-color" style={{ background: char.color }} />
            <span className="character-card-name">{char.name}</span>
            <button
              className="character-card-remove"
              onClick={() => onRemoveCharacter(char.id)}
              title="Remove character"
            >×</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
