interface Props {
  onLoadFile: () => void;
  onSaveWip: () => void;
  onLoadWip: () => void;
  onClearWip: () => void;
  wipSavedAt: string | null;
  onClose: () => void;
}

export function SaveLoadMenu({ onLoadFile, onSaveWip, onLoadWip, onClearWip, wipSavedAt, onClose }: Props) {
  const formattedDate = wipSavedAt
    ? new Date(wipSavedAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="save-load-menu">
      <button
        className="menu-item"
        onClick={() => { onClose(); onLoadFile(); }}
      >
        Load from File
      </button>
      <div className="menu-divider" />
      <button
        className="menu-item"
        onClick={() => { onSaveWip(); onClose(); }}
      >
        Save Work In Progress
      </button>
      <button
        className="menu-item"
        onClick={() => { onLoadWip(); onClose(); }}
        disabled={!wipSavedAt}
      >
        Load Work In Progress
        {formattedDate && <span className="menu-item-sub">Last saved: {formattedDate}</span>}
      </button>
      <button
        className="menu-item menu-item-danger"
        onClick={() => { onClearWip(); onClose(); }}
        disabled={!wipSavedAt}
      >
        Clear Saved Progress
      </button>
    </div>
  );
}
