import { useState } from 'react';

interface Props {
  onConfirm: (apiKey: string) => void;
  onCancel: () => void;
}

export function AiVoiceModal({ onConfirm, onCancel }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!apiKey.trim()) {
      setError('Please enter an API key.');
      return;
    }
    onConfirm(apiKey.trim());
  }

  return (
    <div className="ai-modal-overlay" onClick={onCancel}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        <h2 className="ai-modal-title">Enable AI Voice Mode</h2>

        <div className="ai-modal-section">
          <h3>How it works</h3>
          <p>
            AI Voice Mode integrates ElevenLabs text-to-speech into the dialog editor.
            You can assign voice characters to NPC line nodes and generate audio directly
            in the browser. When exporting, a ZIP file will be produced containing the
            dialog JSON and all generated MP3 files at their media paths.
          </p>
        </div>

        <div className="ai-modal-disclaimer">
          <strong>Important:</strong>
          <ul>
            <li>You must comply with the <a href="https://elevenlabs.io/terms" target="_blank" rel="noreferrer">ElevenLabs Terms of Service</a>.</li>
            <li>Your API key is <strong>never saved</strong> — not to disk, localStorage, or anywhere. You will need to re-enter it each session.</li>
            <li>Your key needs <strong>Text to Speech</strong> permissions.</li>
            <li>Keep your API key private and never share it.</li>
          </ul>
        </div>

        <div className="ai-modal-section">
          <label className="ai-modal-label">ElevenLabs API Key</label>
          <input
            className="ai-modal-input"
            type="text"
            placeholder="sk-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          {error && <div className="ai-modal-error">{error}</div>}
        </div>

        <div className="ai-modal-actions">
          <button className="toolbar-btn" onClick={onCancel}>Cancel</button>
          <button
            className="toolbar-btn ai-btn"
            onClick={handleSubmit}
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
