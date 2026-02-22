interface FieldLabelProps {
  children: React.ReactNode;
  tooltip?: string;
}

export function FieldLabel({ children, tooltip }: FieldLabelProps) {
  return (
    <label>
      {tooltip ? (
        <span className="node-field-help" data-tooltip={tooltip}>{children}</span>
      ) : children}
    </label>
  );
}
