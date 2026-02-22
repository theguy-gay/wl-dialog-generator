import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { Camera, HidableGroup } from '../types';

export function NpcLineNode({ id, data }: NodeProps) {
  const { updateNodeData } = useReactFlow();

  const camera = data.camera as Camera | undefined;
  const hidableGroup = data.hidableGroup as HidableGroup | undefined;

  function onCameraNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    updateNodeData(id, {
      camera: name ? { name, keepPossessed: camera?.keepPossessed ?? false } : undefined,
    });
  }

  function onCameraKeepPossessedChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!camera) return;
    updateNodeData(id, { camera: { name: camera.name, keepPossessed: e.target.checked } });
  }

  function onHidableGroupNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    updateNodeData(id, {
      hidableGroup: name ? { name, rehide: hidableGroup?.rehide ?? false } : undefined,
    });
  }

  function onHidableGroupRehideChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!hidableGroup) return;
    updateNodeData(id, { hidableGroup: { name: hidableGroup.name, rehide: e.target.checked } });
  }

  return (
    <div className="dialog-node">
      <Handle type="target" position={Position.Left} />

      <div className="node-header node-header-npc">{data._label as string}</div>

      <div className="node-fields">
        <div className="node-field">
          <label>Text</label>
          <input
            className="nodrag"
            type="text"
            value={(data.text as string) ?? ''}
            onChange={e => updateNodeData(id, { text: e.target.value || undefined })}
          />
        </div>

        <div className="node-field">
          <label>Duration</label>
          <input
            className="nodrag"
            type="number"
            value={(data.duration as number) ?? 0}
            onChange={e => updateNodeData(id, { duration: Number(e.target.value) })}
          />
        </div>

        <div className="node-field">
          <label>Media</label>
          <input
            className="nodrag"
            type="text"
            value={(data.media as string) ?? ''}
            onChange={e => updateNodeData(id, { media: e.target.value || undefined })}
          />
        </div>

        <div className="node-field">
          <label>Animation</label>
          <input
            className="nodrag"
            type="text"
            value={typeof data.animation === 'string' ? data.animation : ''}
            onChange={e => updateNodeData(id, { animation: e.target.value || undefined })}
          />
        </div>

        <hr className="node-section-divider" />

        <div className="node-field">
          <label>Camera</label>
          <input
            className="nodrag"
            type="text"
            placeholder="name"
            value={camera?.name ?? ''}
            onChange={onCameraNameChange}
          />
        </div>

        {camera && (
          <div className="node-field">
            <label>Keep possessed</label>
            <input
              className="nodrag"
              type="checkbox"
              checked={camera.keepPossessed}
              onChange={onCameraKeepPossessedChange}
            />
          </div>
        )}

        <div className="node-field">
          <label>Hidable group</label>
          <input
            className="nodrag"
            type="text"
            placeholder="name"
            value={hidableGroup?.name ?? ''}
            onChange={onHidableGroupNameChange}
          />
        </div>

        {hidableGroup && (
          <div className="node-field">
            <label>Rehide</label>
            <input
              className="nodrag"
              type="checkbox"
              checked={hidableGroup.rehide}
              onChange={onHidableGroupRehideChange}
            />
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
