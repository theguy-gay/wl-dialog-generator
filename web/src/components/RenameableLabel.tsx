import { useState, useEffect } from 'react';

interface Props {
  label: string;
  onRename: (newLabel: string) => boolean;
}

export function RenameableLabel({ label, onRename }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);

  useEffect(() => { if (!editing) setValue(label); }, [label, editing]);

  function commit() {
    const ok = onRename(value);
    if (!ok) setValue(label); // revert on failure (empty or conflict)
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="nodrag node-header-input"
        value={value}
        autoFocus
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setValue(label); setEditing(false); }
        }}
      />
    );
  }

  return (
    <span className="node-header-label" onClick={() => setEditing(true)}>
      {label}
    </span>
  );
}
