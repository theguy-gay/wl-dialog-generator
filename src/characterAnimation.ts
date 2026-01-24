import { CharacterAnimation, BodyAnimationStage } from "./types";

export const populateCharacterAnimation = (animation: WildLife.SandboxObject, characterAnimation: CharacterAnimation): void => {
    const poseProp = wl_get_object(characterAnimation.posePropName);
    if (!poseProp) {
        return;
    }
    const poseGUID = wl_get_object_guid(poseProp);
    const poseTrack = wl_animation_object_track_get(animation, poseGUID);

    characterAnimation.bodyAnimationStages && createBodyAnimationStages(animation, poseGUID, poseTrack, characterAnimation.bodyAnimationStages);
}

const createBodyAnimationStages = (animation: WildLife.SandboxObject, poseGUID: string, poseTrack: WildLife.ObjectTrack, bodyAnimationStages: BodyAnimationStage[]): void => {
        wl_animation_keyframe_track_add(animation, poseTrack.guid, "bodyAnimationAIndex", "Int");
        wl_animation_keyframe_track_add(animation, poseTrack.guid, "bodyAnimationBIndex", "Int");
        wl_animation_keyframe_track_add(animation, poseTrack.guid, "bodyAnimationBlend", "Float");

        let startA = true;

        bodyAnimationStages.forEach(bodyAnimationStage => {
            wl_animation_keyframe_add(animation, poseGUID, startA ? "bodyAnimationAIndex" : "bodyAnimationBIndex", bodyAnimationStage.startTime, bodyAnimationStage.startAnimation);
            wl_animation_keyframe_add(animation, poseGUID, startA ? "bodyAnimationBIndex" : "bodyAnimationAIndex", bodyAnimationStage.startTime, bodyAnimationStage.endAnimation);
            wl_animation_keyframe_add(animation, poseGUID, "bodyAnimationBlend", bodyAnimationStage.startTime, startA ? 0 : 1);
            wl_animation_keyframe_add(animation, poseGUID, "bodyAnimationBlend", bodyAnimationStage.endTime, startA ? 1 : 0);
            startA = !startA;
        });
}