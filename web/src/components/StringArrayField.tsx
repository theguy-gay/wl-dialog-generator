import { SubBox } from './SubBox';

interface StringArrayFieldProps {
  label: string;
  tooltip?: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export function StringArrayField({ label, tooltip, values, onChange }: StringArrayFieldProps) {
  function add() {
    onChange([...values, '']);
  }

  function remove(i: number) {
    onChange(values.filter((_, idx) => idx !== i));
  }

  function update(i: number, value: string) {
    onChange(values.map((v, idx) => (idx === i ? value : v)));
  }

  return (
    <SubBox label={label} tooltip={tooltip} onAdd={add}>
      {values.map((v, i) => (
        <div className="node-array-entry" key={i}>
          <input
            className="nodrag"
            type="text"
            value={v}
            onChange={e => update(i, e.target.value)}
          />
          <button className="node-icon-btn nodrag" onClick={() => remove(i)} title="Remove">×</button>
        </div>
      ))}
    </SubBox>
  );
}
