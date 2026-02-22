import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { Camera, HidableGroup, CharacterAnimation, BodyAnimationStage } from '../types';
import { RenameableLabel } from './RenameableLabel';
import { useRenameNode } from '../hooks/useRenameNode';
import { SubBox } from './SubBox';
import { FieldLabel } from './FieldLabel';
import { tooltips } from '../utils/fieldTooltips';

export function NpcLineNode({ id, data }: NodeProps) {
  const { updateNodeData, deleteElements, setEdges } = useReactFlow();
  const rename = useRenameNode(id, 'npcLine');

  const camera = data.camera as Camera | undefined;
  const hidableGroup = data.hidableGroup as HidableGroup | undefined;

  // Coerce media to string[] for UI
  const mediaArr: string[] = Array.isArray(data.media)
    ? (data.media as string[])
    : data.media ? [data.media as string] : [];
  const [mediaOpen, setMediaOpen] = useState(mediaArr.length > 0);

  const [triggersOpen, setTriggersOpen] = useState(data.triggers !== undefined);

  // Animation mode toggle
  const animIsObject = typeof data.animation === 'object' && data.animation !== null;
  const [animMode, setAnimMode] = useState<'string' | 'object'>(animIsObject ? 'object' : 'string');
  const anim = animIsObject ? (data.animation as CharacterAnimation) : null;
  const stages: BodyAnimationStage[] = anim?.bodyAnimationStages ?? [];

  function switchAnimMode(mode: 'string' | 'object') {
    setAnimMode(mode);
    if (mode === 'object') {
      updateNodeData(id, {
        animation: { name: '', posePropName: '', bodyAnimationStages: [] },
      });
    } else {
      updateNodeData(id, { animation: undefined });
    }
  }

  function updateAnim(patch: Partial<CharacterAnimation>) {
    updateNodeData(id, { animation: { ...anim!, ...patch } });
  }

  function addStage() {
    const newStage: BodyAnimationStage = {
      startAnimation: 0, startTime: 0, endAnimation: 0, endTime: 1,
    };
    updateAnim({ bodyAnimationStages: [...stages, newStage] });
  }

  function removeStage(i: number) {
    updateAnim({ bodyAnimationStages: stages.filter((_, idx) => idx !== i) });
  }

  function updateStage(i: number, patch: Partial<BodyAnimationStage>) {
    updateAnim({
      bodyAnimationStages: stages.map((s, idx) => idx === i ? { ...s, ...patch } : s),
    });
  }

  return (
    <div className="dialog-node">
      <Handle type="target" position={Position.Left} style={{ top: 14 }} />

      <div className="node-header node-header-npc">
        <RenameableLabel label={data._label as string} onRename={rename} />
        <button
          className="node-delete-btn nodrag"
          onClick={() => deleteElements({ nodes: [{ id }] })}
          title="Delete node"
        >×</button>
      </div>

      <div className="node-fields">
        {/* Text — optional */}
        {data.text !== undefined ? (
          <div className="node-field">
            <FieldLabel tooltip={tooltips.text}>Text</FieldLabel>
            <input
              className="nodrag"
              type="text"
              value={data.text as string}
              onChange={e => updateNodeData(id, { text: e.target.value || undefined })}
            />
            <button
              className="node-icon-btn nodrag"
              onClick={() => updateNodeData(id, { text: undefined })}
            >×</button>
          </div>
        ) : (
          <button
            className="node-add-btn nodrag"
            data-tooltip={tooltips.text}
            onClick={() => updateNodeData(id, { text: '' })}
          >+ Text</button>
        )}

        {/* Duration — required */}
        <div className="node-field">
          <FieldLabel tooltip={tooltips.duration}>Duration</FieldLabel>
          <input
            className="nodrag"
            type="number"
            value={(data.duration as number) ?? 0}
            onChange={e => updateNodeData(id, { duration: Number(e.target.value) })}
          />
        </div>

        {/* Media — optional, string | string[] */}
        {mediaOpen ? (
          <SubBox
            label="Media"
            tooltip={tooltips.media}
            onAdd={() => updateNodeData(id, { media: [...mediaArr, ''] })}
            onRemove={() => { setMediaOpen(false); updateNodeData(id, { media: undefined }); }}
          >
            {mediaArr.map((v, i) => (
              <div className="node-array-entry" key={i}>
                <input
                  className="nodrag"
                  type="text"
                  value={v}
                  onChange={e => {
                    const next = mediaArr.map((m, idx) => idx === i ? e.target.value : m);
                    updateNodeData(id, { media: next.length ? next : undefined });
                  }}
                />
                <button
                  className="node-icon-btn nodrag"
                  onClick={() => {
                    const next = mediaArr.filter((_, idx) => idx !== i);
                    updateNodeData(id, { media: next.length ? next : undefined });
                  }}
                >×</button>
              </div>
            ))}
          </SubBox>
        ) : (
          <button
            className="node-add-btn nodrag"
            data-tooltip={tooltips.media}
            onClick={() => setMediaOpen(true)}
          >+ Media</button>
        )}

        {/* Animation — optional, string | CharacterAnimation */}
        {data.animation !== undefined ? (
          <>
            <div className="node-toggle-row">
              <FieldLabel tooltip={tooltips.animation}>Animation</FieldLabel>
              <label>
                <input
                  className="nodrag"
                  type="radio"
                  checked={animMode === 'string'}
                  onChange={() => switchAnimMode('string')}
                />
                String
              </label>
              <label>
                <input
                  className="nodrag"
                  type="radio"
                  checked={animMode === 'object'}
                  onChange={() => switchAnimMode('object')}
                />
                Object
              </label>
              <button
                className="node-icon-btn nodrag"
                onClick={() => { updateNodeData(id, { animation: undefined }); setAnimMode('string'); }}
              >×</button>
            </div>

            {animMode === 'string' && (
              <div className="node-field">
                <label></label>
                <input
                  className="nodrag"
                  type="text"
                  placeholder="animation name"
                  value={typeof data.animation === 'string' ? data.animation : ''}
                  onChange={e => updateNodeData(id, { animation: e.target.value || undefined })}
                />
              </div>
            )}

            {animMode === 'object' && anim !== null && (
              <SubBox label="Character Animation">
                <div className="node-field">
                  <label>Name</label>
                  <input
                    className="nodrag"
                    type="text"
                    value={anim.name}
                    onChange={e => updateAnim({ name: e.target.value })}
                  />
                </div>
                <div className="node-field">
                  <label>Pose Prop Name</label>
                  <input
                    className="nodrag"
                    type="text"
                    value={anim.posePropName}
                    onChange={e => updateAnim({ posePropName: e.target.value })}
                  />
                </div>
                <div className="node-field">
                  <label>Replace Body Animations</label>
                  <input
                    className="nodrag"
                    type="checkbox"
                    checked={anim.replaceBodyAnimations ?? false}
                    onChange={e => updateAnim({ replaceBodyAnimations: e.target.checked || undefined })}
                  />
                </div>
                <SubBox label="Body Animation Stages" onAdd={addStage}>
                  {stages.map((stage, i) => (
                    <SubBox key={i} label={`Stage ${i + 1}`} onRemove={() => removeStage(i)}>
                      <div className="node-field">
                        <label>Start Animation</label>
                        <input className="nodrag" type="number" value={stage.startAnimation}
                          onChange={e => updateStage(i, { startAnimation: Number(e.target.value) })} />
                      </div>
                      <div className="node-field">
                        <label>Start Time</label>
                        <input className="nodrag" type="number" value={stage.startTime}
                          onChange={e => updateStage(i, { startTime: Number(e.target.value) })} />
                      </div>
                      <div className="node-field">
                        <label>End Animation</label>
                        <input className="nodrag" type="number" value={stage.endAnimation}
                          onChange={e => updateStage(i, { endAnimation: Number(e.target.value) })} />
                      </div>
                      <div className="node-field">
                        <label>End Time</label>
                        <input className="nodrag" type="number" value={stage.endTime}
                          onChange={e => updateStage(i, { endTime: Number(e.target.value) })} />
                      </div>
                      <div className="node-field">
                        <label>Disable Chest Physics</label>
                        <input className="nodrag" type="checkbox"
                          checked={stage.disableChestPhysics ?? false}
                          onChange={e => updateStage(i, { disableChestPhysics: e.target.checked || undefined })} />
                      </div>
                      <div className="node-field">
                        <label>Disable Butt Physics</label>
                        <input className="nodrag" type="checkbox"
                          checked={stage.disableButtPhysics ?? false}
                          onChange={e => updateStage(i, { disableButtPhysics: e.target.checked || undefined })} />
                      </div>
                    </SubBox>
                  ))}
                </SubBox>
              </SubBox>
            )}
          </>
        ) : (
          <button
            className="node-add-btn nodrag"
            data-tooltip={tooltips.animation}
            onClick={() => updateNodeData(id, { animation: '' })}
          >+ Animation</button>
        )}

        {/* Camera — optional object */}
        {camera ? (
          <SubBox label="Camera" tooltip={tooltips.camera} onRemove={() => updateNodeData(id, { camera: undefined })}>
            <div className="node-field">
              <label>Name</label>
              <input
                className="nodrag"
                type="text"
                value={camera.name}
                onChange={e => updateNodeData(id, {
                  camera: { name: e.target.value, keepPossessed: camera.keepPossessed },
                })}
              />
            </div>
            <div className="node-field">
              <FieldLabel tooltip={tooltips.keepPossessed}>Keep Possessed</FieldLabel>
              <input
                className="nodrag"
                type="checkbox"
                checked={camera.keepPossessed}
                onChange={e => updateNodeData(id, {
                  camera: { name: camera.name, keepPossessed: e.target.checked },
                })}
              />
            </div>
          </SubBox>
        ) : (
          <button
            className="node-add-btn nodrag"
            data-tooltip={tooltips.camera}
            onClick={() => updateNodeData(id, { camera: { name: '', keepPossessed: false } })}
          >+ Camera</button>
        )}

        {/* HidableGroup — optional object */}
        {hidableGroup ? (
          <SubBox label="Hidable Group" tooltip={tooltips.hidableGroup} onRemove={() => updateNodeData(id, { hidableGroup: undefined })}>
            <div className="node-field">
              <label>Name</label>
              <input
                className="nodrag"
                type="text"
                value={hidableGroup.name}
                onChange={e => updateNodeData(id, {
                  hidableGroup: { name: e.target.value, rehide: hidableGroup.rehide },
                })}
              />
            </div>
            <div className="node-field">
              <FieldLabel tooltip={tooltips.rehide}>Rehide</FieldLabel>
              <input
                className="nodrag"
                type="checkbox"
                checked={hidableGroup.rehide}
                onChange={e => updateNodeData(id, {
                  hidableGroup: { name: hidableGroup.name, rehide: e.target.checked },
                })}
              />
            </div>
          </SubBox>
        ) : (
          <button
            className="node-add-btn nodrag"
            data-tooltip={tooltips.hidableGroup}
            onClick={() => updateNodeData(id, { hidableGroup: { name: '', rehide: false } })}
          >+ Hidable Group</button>
        )}

        {/* Triggers — optional */}
        {triggersOpen ? (
          <div className="node-field node-choice-row">
            <label>Triggers</label>
            <button
              className="node-icon-btn nodrag"
              onClick={() => {
                setTriggersOpen(false);
                updateNodeData(id, { triggers: undefined });
                setEdges(edges => edges.filter(e => e.source !== id));
              }}
            >×</button>
            <Handle type="source" position={Position.Right} id="triggers" />
          </div>
        ) : (
          <button
            className="node-add-btn nodrag"
            data-tooltip={tooltips.triggers}
            onClick={() => setTriggersOpen(true)}
          >+ Triggers</button>
        )}
      </div>

    </div>
  );
}
