import { useState } from 'react';
import { getVoices, validateVoiceId } from '../utils/elevenLabsApi';
import type { VoiceEntry } from '../utils/elevenLabsApi';
import { useAiVoice } from '../context/AiVoiceContext';

interface Props {
  onConfirm: (name: string, voiceId: string) => void;
  onCancel: () => void;
}

export function AddCharacterModal({ onConfirm, onCancel }: Props) {
  const { aiMode } = useAiVoice();
  const [name, setName] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [validateError, setValidateError] = useState('');
  const [validating, setValidating] = useState(false);
  const [formError, setFormError] = useState('');

  const [voices, setVoices] = useState<VoiceEntry[] | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState('');

  async function handleLoadVoices() {
    if (!aiMode || voicesLoading) return;
    setVoicesLoading(true);
    setVoicesError('');
    try {
      const list = await getVoices(aiMode.apiKey);
      setVoices(list);
    } catch (err) {
      setVoicesError(err instanceof Error ? err.message : String(err));
    } finally {
      setVoicesLoading(false);
    }
  }

  function handleSelectVoice(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = voices?.find(v => v.voiceId === e.target.value);
    if (!selected) return;
    setVoiceId(selected.voiceId);
    setVoiceName(selected.name);
    setValidateError('');
    if (!name.trim()) setName(selected.name);
  }

  async function handleValidateVoice() {
    if (!voiceId.trim() || !aiMode) return;
    setValidating(true);
    setValidateError('');
    setVoiceName(null);
    const result = await validateVoiceId(aiMode.apiKey, voiceId.trim());
    setValidating(false);
    if (result === null) {
      setValidateError('Voice ID not found or inaccessible.');
    } else {
      setVoiceName(result);
    }
  }

  function handleConfirm() {
    if (!name.trim()) { setFormError('Name is required.'); return; }
    if (!voiceId.trim()) { setFormError('Voice ID is required.'); return; }
    onConfirm(name.trim(), voiceId.trim());
  }

  return (
    <div className="ai-modal-overlay" onClick={onCancel}>
      <div className="ai-modal ai-modal-sm" onClick={e => e.stopPropagation()}>
        <h2 className="ai-modal-title">Add Character</h2>

        <div className="ai-modal-section">
          <label className="ai-modal-label">Character Name</label>
          <input
            className="ai-modal-input"
            type="text"
            placeholder="e.g. Narrator"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="ai-modal-section">
          <div className="ai-modal-voice-header">
            <label className="ai-modal-label" style={{ marginBottom: 0 }}>Voice</label>
            <button
              className="toolbar-btn ai-btn ai-btn-xs"
              onClick={handleLoadVoices}
              disabled={voicesLoading}
            >
              {voicesLoading ? 'Loading...' : voices ? 'Refresh' : 'Browse library'}
            </button>
          </div>

          {voicesError && <div className="ai-modal-error" style={{ marginTop: 6 }}>{voicesError}</div>}

          {voices && voices.length > 0 && (
            <select
              className="ai-modal-input ai-modal-select"
              value={voiceId}
              onChange={handleSelectVoice}
            >
              <option value="">— select a voice —</option>
              {voices.map(v => (
                <option key={v.voiceId} value={v.voiceId}>{v.name}</option>
              ))}
            </select>
          )}

          {voices && voices.length === 0 && (
            <div className="ai-modal-error" style={{ marginTop: 6 }}>No voices found in your library.</div>
          )}

          <label className="ai-modal-label" style={{ marginTop: 10 }}>Voice ID</label>
          <div className="ai-modal-row">
            <input
              className="ai-modal-input"
              type="text"
              placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
              value={voiceId}
              onChange={e => { setVoiceId(e.target.value); setVoiceName(null); setValidateError(''); }}
            />
            <button
              className="toolbar-btn ai-btn"
              onClick={handleValidateVoice}
              disabled={validating || !voiceId.trim()}
            >
              {validating ? '...' : 'Check'}
            </button>
          </div>
          {voiceName && <div className="ai-modal-success">Voice: <strong>{voiceName}</strong></div>}
          {validateError && <div className="ai-modal-error">{validateError}</div>}
        </div>

        {formError && <div className="ai-modal-error">{formError}</div>}

        <div className="ai-modal-actions">
          <button className="toolbar-btn" onClick={onCancel}>Cancel</button>
          <button className="toolbar-btn ai-btn" onClick={handleConfirm}>Add Character</button>
        </div>
      </div>
    </div>
  );
}
