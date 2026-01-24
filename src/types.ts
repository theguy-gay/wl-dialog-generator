export interface Camera {
    name: string,
    keepPossessed: boolean // Determines if the camera should stay possessed after the dialog.
}

export interface HidableGroup {
    name: string,
    rehide: boolean // Determines if the group should hide at the completion of the dialog.
}

export interface NPCLine {
    text?: string, // Creates a subtitle. If left out the subtitle will be omitted.
    duration: number, // Duration of the dialog before running the response, also used by properties like the camera and animation if these cause a sandbox object to be created.
    media?: string | string[], // File path of a media file(s). Will create a MediaPlayer that plays the file once on trigger. If omitted only no sound will be played. If an array is provided, one will be chosen at random to be played.
    animation?: string | CharacterAnimation, // Name of an AnimationSequence to be played during this dialog. If one is in the scene with the same name, it is used and left unchanged. If one does not exist, one will be created with the name and run un-looped for the duration.
    camera?: Camera, // Name of a Camera to be possessed during this dialog. If one is in the scene with the same name, it is used and left unchanged. If one does not exist, one will be created with the name.
    hidableGroup?: HidableGroup, // Group that will be unhidden during the dialog. If one is in the scene with the same name, it is used and left unchanged. If one does not exist, one will be created with the name.
    triggers?: string, // Label of another NPCLine or PlayerChoice that should be played upon completion of this NPC line. If empty, ends the dialog.
}

export interface PlayerChoice {
    text: string,
    triggers: string // Label of an NPC line that should be played upon this response being selected.
}

export interface Dialogs {
    start: string; // Label of the PlayerLine or NPCLine to start off this dialog.
    replace?: boolean;
    npcLines: { [npcLineLabel: string]: NPCLine },
    playerChoices: { [playerLineLabel: string]: PlayerChoice[] }
}

export interface NPCLineEvent {
    name: string,
    param?: string
}

export interface NPCLineEventPopulator {
    (onStartEvents: NPCLineEvent[], onEndEvents: NPCLineEvent[]): void;
}

export interface BodyAnimationStage {
    startAnimation: number,
    startTime: number,
    endAnimation: number,
    endTime: number,
    disableChestPhysics?: boolean,
    disableButtPhysics?: boolean,
}

export interface CharacterAnimation {
    name: string,
    posePropName: string,
    bodyAnimationStages?: BodyAnimationStage[],
    replaceBodyAnimations?: boolean
}
