interface SubBoxProps {
  label: string;
  tooltip?: string;
  onRemove?: () => void;
  onAdd?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  children: React.ReactNode;
}

export function SubBox({ label, tooltip, onRemove, onAdd, dragHandleProps, children }: SubBoxProps) {
  return (
    <div className="node-subbox">
      <div className="node-subbox-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {dragHandleProps && (
            <button className="node-drag-handle nodrag" {...dragHandleProps} title="Drag to reorder">⠿</button>
          )}
          {tooltip ? (
            <span className="node-field-help" data-tooltip={tooltip}>{label}</span>
          ) : label}
        </span>
        <span>
          {onAdd && (
            <button className="node-icon-btn nodrag" onClick={onAdd} title="Add">+</button>
          )}
          {onRemove && (
            <button className="node-icon-btn nodrag" onClick={onRemove} title="Remove">×</button>
          )}
        </span>
      </div>
      <div className="node-subbox-body">
        {children}
      </div>
    </div>
  );
}
