import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { SubBox } from './SubBox';

interface SortableArrayItemProps {
  id: string;
  className?: string;
  children: ReactNode;
}

export function SortableArrayItem({ id, className, children }: SortableArrayItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`node-array-entry${className ? ` ${className}` : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <button className="node-drag-handle nodrag" {...attributes} {...listeners} title="Drag to reorder">
        ⠿
      </button>
      {children}
    </div>
  );
}

interface SortableSubBoxWrapperProps {
  id: string;
  label: string;
  onRemove?: () => void;
  children: ReactNode;
}

/** Wraps a SubBox with drag-and-drop support, passing a drag handle into the SubBox header. */
export function SortableSubBoxWrapper({ id, label, onRemove, children }: SortableSubBoxWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <SubBox label={label} onRemove={onRemove} dragHandleProps={{ ...attributes, ...listeners }}>
        {children}
      </SubBox>
    </div>
  );
}
