import { useState, useEffect, useRef } from 'react';

interface NodeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
}

export function NodeInput({ value, onChange, onFocus, onBlur, ...props }: NodeInputProps) {
  const [local, setLocal] = useState(value);
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setLocal(value);
  }, [value]);

  return (
    <input
      {...props}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onFocus={e => { focused.current = true; onFocus?.(e); }}
      onBlur={e => { focused.current = false; onChange(e.target.value); onBlur?.(e); }}
    />
  );
}
