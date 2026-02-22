interface ErrorPanelProps {
  errors: string[];
}

export function ErrorPanel({ errors }: ErrorPanelProps) {
  if (errors.length === 0) return null;
  return (
    <div className="error-panel">
      <div className="error-panel-title">
        ⚠ {errors.length} export error{errors.length > 1 ? 's' : ''}
      </div>
      <ul className="error-list">
        {errors.map((msg, i) => (
          <li key={i} className="error-item">{msg}</li>
        ))}
      </ul>
    </div>
  );
}
