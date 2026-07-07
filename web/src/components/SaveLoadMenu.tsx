import { useState, useRef } from 'react';

export interface SavedWorkflow {
  id: string;
  name: string;
  savedAt: string;
}

interface Props {
  onLoadFile: () => void;
  onSaveWip: () => void;
  onLoadWip: () => void;
  onClearWip: () => void;
  wipSavedAt: string | null;
  savedWorkflows: SavedWorkflow[];
  onSaveAs: (name: string) => boolean;
  onLoadWorkflow: (id: string) => void;
  onDeleteWorkflow: (id: string) => void;
  onClose: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function SaveLoadMenu({
  onLoadFile, onSaveWip, onLoadWip, onClearWip, wipSavedAt,
  savedWorkflows, onSaveAs, onLoadWorkflow, onDeleteWorkflow,
  onClose,
}: Props) {
  const [savingAs, setSavingAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [showLoadSub, setShowLoadSub] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formattedWip = wipSavedAt ? fmtDate(wipSavedAt) : null;

  function handleSaveAsClick() {
    setSavingAs(true);
    setSaveAsName('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSaveAsConfirm() {
    const name = saveAsName.trim();
    if (!name) return;
    if (!onSaveAs(name)) return;
    setSavingAs(false);
    onClose();
  }

  return (
    <div className="save-load-menu">
      <button className="menu-item" onClick={() => { onClose(); onLoadFile(); }}>
        Load from File
      </button>

      <div className="menu-divider" />

      <button className="menu-item" onClick={() => { onSaveWip(); onClose(); }}>
        Save Work In Progress
      </button>
      <button
        className="menu-item"
        onClick={() => { onLoadWip(); onClose(); }}
        disabled={!wipSavedAt}
      >
        Load Work In Progress
        {formattedWip && <span className="menu-item-sub">Last saved: {formattedWip}</span>}
      </button>
      <button
        className="menu-item menu-item-danger"
        onClick={() => { onClearWip(); onClose(); }}
        disabled={!wipSavedAt}
      >
        Clear Saved Progress
      </button>

      <div className="menu-divider" />
      <div className="menu-section-label">Named Workflows</div>

      {savingAs ? (
        <div className="menu-save-as">
          <input
            ref={inputRef}
            className="menu-save-as-input"
            value={saveAsName}
            onChange={e => setSaveAsName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveAsConfirm();
              if (e.key === 'Escape') setSavingAs(false);
            }}
            placeholder="Workflow name..."
          />
          <div className="menu-save-as-actions">
            <button
              className="menu-save-as-btn"
              onClick={handleSaveAsConfirm}
              disabled={!saveAsName.trim()}
            >
              Save
            </button>
            <button
              className="menu-save-as-btn menu-save-as-cancel"
              onClick={() => setSavingAs(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="menu-item" onClick={handleSaveAsClick}>
          Save As...
        </button>
      )}

      <div className="menu-item-with-sub">
        <button
          className={`menu-item menu-item-has-sub${showLoadSub ? ' menu-item-sub-open' : ''}`}
          onClick={() => setShowLoadSub(s => !s)}
        >
          Load Named
          <span className="menu-item-arrow">‹</span>
        </button>
        {showLoadSub && (
          <div className="save-load-submenu">
            {savedWorkflows.length === 0 ? (
              <div className="submenu-empty">No saved workflows</div>
            ) : (
              savedWorkflows.map((wf, i) => (
                <div key={wf.id} className="submenu-item">
                  <button
                    className="submenu-item-btn"
                    onClick={() => { onLoadWorkflow(wf.id); onClose(); }}
                  >
                    <span className="submenu-item-num">{i + 1}.</span>
                    <span className="submenu-item-name">{wf.name}</span>
                    <span className="submenu-item-date">{fmtDate(wf.savedAt)}</span>
                  </button>
                  <button
                    className="submenu-item-delete"
                    title="Delete"
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Delete workflow "${wf.name}"? This cannot be undone.`)) {
                        onDeleteWorkflow(wf.id);
                      }
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
