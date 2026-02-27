import {
  getBezierPath,
  useEdges,
  type EdgeProps,
} from '@xyflow/react';

export function CustomEdge({
  id,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const color = (data?.color as string) ?? '#888888';
  const edges = useEdges();

  // All colors pointing into the same target node
  const targetColors = edges
    .filter(e => e.target === target)
    .map(e => e.data?.color as string)
    .filter(Boolean);

  const useGradientMarker = targetColors.length > 1;

  // Stable ID: sort so all edges sharing a target produce the same defs
  const sortedKey = [...targetColors].sort().map(c => c.slice(1)).join('-');
  const gradientId = `lg-${sortedKey}`;
  const gradientMarkerId = `arrow-grad-${sortedKey}`;
  const solidMarkerId = `arrow-${color.slice(1)}`;

  // Double the colors so the looping animation has no seam.
  // The gradient spans 0–20 (twice the 10-unit marker width); we animate
  // the transform by -10 units so the visible window scrolls right.
  const animColors = [...targetColors, ...targetColors];
  const dur = `${targetColors.length * 1.5}s`;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {useGradientMarker && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0" y1="0"
            x2="20" y2="0"
            gradientUnits="userSpaceOnUse"
          >
            {animColors.map((c, i) => (
              <stop
                key={i}
                offset={`${(i / (animColors.length - 1)) * 100}%`}
                stopColor={c}
              />
            ))}
            {/* Shift the gradient left so the 0–10 viewport scrolls right */}
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0,0"
              to="-10,0"
              dur={dur}
              repeatCount="indefinite"
            />
          </linearGradient>
          <marker
            id={gradientMarkerId}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={`url(#${gradientId})`} />
          </marker>
        </defs>
      )}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        style={{ stroke: color, strokeWidth: 2 }}
        markerEnd={`url(#${useGradientMarker ? gradientMarkerId : solidMarkerId})`}
      />
    </>
  );
}
