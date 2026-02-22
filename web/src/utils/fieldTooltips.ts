// Tooltip descriptions sourced from the comments in src/types.ts.
export const tooltips = {
  // NPCLine
  text: 'Creates a subtitle. If left out the subtitle will be omitted.',
  duration: 'Duration of the dialog before running the response, also used by properties like the camera and animation if these cause a sandbox object to be created.',
  media: 'File path of a media file(s). Will create a MediaPlayer that plays the file once on trigger. If omitted, no sound will be played. If an array is provided, one will be chosen at random.',
  animation: 'Name of an AnimationSequence to be played during this dialog. If one is in the scene with the same name, it is used and left unchanged. If one does not exist, one will be created and run un-looped for the duration.',
  camera: 'Name of a Camera to be possessed during this dialog. If one is in the scene with the same name, it is used and left unchanged. If one does not exist, one will be created with the name.',
  hidableGroup: 'Group that will be unhidden during the dialog. If one is in the scene with the same name, it is used and left unchanged. If one does not exist, one will be created with the name.',
  triggers: 'Label of another NPCLine or PlayerChoice that should be played upon completion of this NPC line. If empty, ends the dialog.',

  // Camera
  keepPossessed: 'Determines if the camera should stay possessed after the dialog.',

  // HidableGroup
  rehide: 'Determines if the group should hide at the completion of the dialog.',
};
