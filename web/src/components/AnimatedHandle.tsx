import { useEffect, useState } from 'react';
import { Handle } from '@xyflow/react';
import type { HandleProps } from '@xyflow/react';

interface AnimatedHandleProps extends HandleProps {
  colors: string[];
}

const CYCLE_MS = 1500;

export function AnimatedHandle({ colors, style, ...props }: AnimatedHandleProps) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (colors.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % colors.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [colors.length]);

  const color = colors[idx];

  return (
    <Handle
      style={{
        ...style,
        ...(color ? { backgroundColor: color, transition: 'background-color 0.5s ease' } : {}),
      }}
      {...props}
    />
  );
}
