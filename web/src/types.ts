export interface Camera {
  name: string;
  keepPossessed: boolean;
}

export interface HidableGroup {
  name: string;
  rehide: boolean;
}

export interface BodyAnimationStage {
  startAnimation: number;
  startTime: number;
  endAnimation: number;
  endTime: number;
  disableChestPhysics?: boolean;
  disableButtPhysics?: boolean;
}

export interface CharacterAnimation {
  name: string;
  posePropName: string;
  bodyAnimationStages?: BodyAnimationStage[];
  replaceBodyAnimations?: boolean;
}

export interface NPCLine {
  text?: string;
  duration: number;
  media?: string | string[];
  animation?: string | CharacterAnimation;
  camera?: Camera;
  hidableGroup?: HidableGroup;
  triggers?: string | string[];
}

export interface PlayerChoice {
  text: string;
  triggers: string;
}

export interface Dialogs {
  start: string;
  replace?: boolean;
  npcLines: { [label: string]: NPCLine };
  playerChoices: { [label: string]: PlayerChoice[] };
}
