import { populateCharacterAnimation } from "./characterAnimation";
import { Dialogs, NPCLineEventPopulator, CharacterAnimation, Camera, HidableGroup, NPCLineEvent, NPCLine, PlayerChoice } from "./types";
import { numberToKeyWord, forEachNamed, getTriggerEventFromName } from "./utils";
import { decode } from "../lua_sources/json";

const dialogs = decode(wl_get_call_argument_as_string()) as Dialogs;

const { start, npcLines, playerChoices } = dialogs;
if (!(start in npcLines || start in playerChoices)) {
    throw `No start provided for dialog`;
}

const spawnObjectUnderParent = (propType: string, name: string, parent: WildLife.SandboxObject): WildLife.SandboxObject => {
    const newProp = wl_editor_spawn_prop(propType, name);
    if (!newProp) {
        throw `Failed to make child prop ${name} of type ${propType}`
    }
    wl_set_object_parent(newProp, parent);
    return newProp;
}

const rootDialogGroup = wl_editor_spawn_prop("Group", "GeneratedDialogGroup");
if (!rootDialogGroup) {
    throw `Failed to create root group`
}
const uiLayer = spawnObjectUnderParent("UILayer", "GeneratedDialogUILayer", rootDialogGroup);

const generateNPCLineSubtitle = (lineName: string, text: string): NPCLineEventPopulator  => {
    const uiText = spawnObjectUnderParent("UIText", `${lineName}Text`, uiLayer);
    wl_set_object_visibility (uiText, false);
    const eventName = `${lineName}TextVisibilityEvent`;
    wl_add_event_to_receiver(uiText, "SetVisibility", eventName, "");
    wl_set_object_integer_option(uiText, "HorizontalAlignment", 1);
    wl_set_object_integer_option(uiText, "VerticalAlignment", 2);
    wl_set_object_float_option(uiText, "PaddingBottom", 100);
    wl_set_object_string_option(uiText, "Text", text);
    return (onStartEvents, onEndEvents) => {
        onStartEvents.push({
            name: eventName,
            param: "true"
        });
        onEndEvents.push({
            name: eventName,
            param: "false"
        });
    };
}

const generateNPCLineMediaPlayerOrRandomMediaPlayer = (lineName: string, parent: WildLife.SandboxObject, path: string | string[]): NPCLineEventPopulator  => {
    if (typeof path === "string") {
        return generateNPCLineMediaPlayer(lineName, parent, path);
    } else {
        const stringCombiner = spawnObjectUnderParent("StringCombiner", `${lineName}MediaStringCombiner`, parent);
        wl_set_object_string_option(stringCombiner, "StringB", `${lineName}PlayEvent`);
        wl_add_event_to_receiver(stringCombiner, "changeStringAAndCombine", `${lineName}NumberChosenMediaPlayEvent`, "");
        wl_add_event_to_dispatcher(stringCombiner, "onStringCombined", `${lineName}EventChosenMediaPlayEvent`, "");

        const eventExecuter = spawnObjectUnderParent("EventExecuter", `${lineName}RandomMediaEventExecuter`, parent);
        wl_add_event_to_receiver(eventExecuter, "executeEventWithName", `${lineName}EventChosenMediaPlayEvent`, "");

        const random = spawnObjectUnderParent("RandomNumber", `${lineName}RandomMediaPlayer`, parent);
        wl_set_object_bool_option(random, "OnlyWholeNumbers", true);
        let i = 0;
        wl_set_object_integer_option(random, "RangeMin", i);
        while (i < path.length) {
            generateNPCLineMediaPlayer(`${i}${lineName}`, parent, path[i]);
            i++;
        }
        wl_set_object_integer_option(random, "RangeMax", i);
        wl_add_event_to_receiver(random, "Run", `${lineName}PlayEvent`, "");
        wl_add_event_to_dispatcher(random, "onRandomNumberGenerated", `${lineName}NumberChosenMediaPlayEvent`, "");

        return (onStartEvents) => {
            onStartEvents.push({
                name: `${lineName}PlayEvent`,
            });
        };
    }
}

const generateNPCLineMediaPlayer = (lineName: string, parent: WildLife.SandboxObject, path: string): NPCLineEventPopulator => {
    const mediaPlayer = spawnObjectUnderParent("MediaPlayer", `${lineName}MediaPlayer`, parent);
    wl_set_object_bool_option(mediaPlayer, "PlayOnLoad", false);
    wl_set_object_bool_option(mediaPlayer, "EnableCollision", false);
    wl_set_object_bool_option(mediaPlayer, "Loop", false);
    wl_set_object_bool_option(mediaPlayer, "Enable3DSound", false);
    wl_set_object_string_option(mediaPlayer, "URL", path);
    wl_set_object_color_option(mediaPlayer, "ColorMultiplier", { a: 0, r: 1, g: 1, b: 1 });
    const playEvent = `${lineName}PlayEvent`;
    wl_add_event_to_receiver(mediaPlayer, "Play", playEvent, "");
    return (onStartEvents) => {
        onStartEvents.push({
            name: playEvent,
        });
    };
}

const generateNPCLineAnimationSequence = (lineName: string, parent: WildLife.SandboxObject, animation: string | CharacterAnimation, duration: number): NPCLineEventPopulator => {
    const animationName = typeof animation === "string" ? animation : animation.name;
    let animationSequence = wl_get_object(animationName);
    if (!animationSequence) {
        animationSequence = spawnObjectUnderParent("AnimationSequence", animationName, parent);
        wl_set_object_float_option(animationSequence, "animationLength", duration);
    }
    if (typeof animation !== "string") {
        populateCharacterAnimation(animationSequence, animation);
    }
    const animationEvent = `${lineName}AnimationEvent`;
    wl_add_event_to_receiver(animationSequence, "PlayFromStart", animationEvent, "");
    return (onStartEvents) => {
        onStartEvents.push({
            name: animationEvent,
        });
    };
}

const generateNPCLineCamera = (lineName: string, parent: WildLife.SandboxObject, camera: Camera): NPCLineEventPopulator => {
    let cameraObj = wl_get_object(camera.name);
    if (!cameraObj) {
        cameraObj = spawnObjectUnderParent("Camera", camera.name, parent);
    }
    const cameraPossessEvent = `${lineName}PossessEvent`;
    wl_add_event_to_receiver(cameraObj, "Possess", cameraPossessEvent, "");
    return (onStartEvents, onEndEvents) => {
        onStartEvents.push({
            name: cameraPossessEvent,
        });
        if (!camera.keepPossessed) {
            const cameraUnpoossessEvent = `${lineName}UnpossessEvent`;
            wl_add_event_to_receiver(cameraObj, "Unpossess", cameraUnpoossessEvent, "");
            onEndEvents.push({
                name: cameraUnpoossessEvent,
            });
        }
    };
}

const generateNPCLineHidableGroup = (lineName: string, parent: WildLife.SandboxObject, hidableGroup: HidableGroup): NPCLineEventPopulator => {
    let group = wl_get_object(hidableGroup.name);
    if (!group) {
        group = spawnObjectUnderParent("Group", hidableGroup.name, parent);
    }
    const visibilityEventName = `${lineName}HidableGroupVisibilityEvent`;
    wl_add_event_to_receiver(group, "SetVisibilityBelow", visibilityEventName, "");
    return (onStartEvents, onEndEvents) => {
        onStartEvents.push({
            name: visibilityEventName,
            param: "true"
        });
        if (hidableGroup.rehide) {
            onEndEvents.push({
                name: visibilityEventName,
                param: "false"
            });
        }
    };
}

const generateNPCLineDelay = (lineName: string, parent: WildLife.SandboxObject, duration: number, onEndEvents: NPCLineEvent[]): NPCLineEventPopulator => {
    const delay = spawnObjectUnderParent("Delay", `${lineName}NPCLineDelay`, parent);
    wl_set_object_float_option(delay, "DelaySeconds", duration);
    onEndEvents.forEach(event => {
        wl_add_event_to_dispatcher(delay, "OnTimerDone", event.name, event.param || "");
    });
    const runDelayEvent = `${lineName}DelayRunEvent`;
    wl_add_event_to_receiver(delay, "Run", runDelayEvent, "");
    return (onStartEvents) => {
        onStartEvents.push({
            name: runDelayEvent
        });
    };
}

const generateNPCLineEventFunction = (lineName: string, parent: WildLife.SandboxObject, onStartEvents: NPCLineEvent[]) => {
    const eventFunction = spawnObjectUnderParent("EventFunction", `${lineName}NPCLineEventFunction`, parent);
    wl_add_event_to_receiver(eventFunction, "Run", getTriggerEventFromName(lineName), "");
    onStartEvents.forEach(event => wl_add_event_to_dispatcher(eventFunction, "Events", event.name, event.param || ""));
}

const generateWLNPCLine = (lineName: string, npcLine: NPCLine) => {
    const npcLineGroup = spawnObjectUnderParent("Group", `${lineName}NPCLine`, rootDialogGroup);
    const onStartEvents: NPCLineEvent[] = [];
    const onEndEvents: NPCLineEvent[] = npcLine.triggers ?  [{ name: getTriggerEventFromName(npcLine.triggers) }] : [];
    npcLine.text && generateNPCLineSubtitle(lineName, npcLine.text)(onStartEvents, onEndEvents);
    npcLine.media && generateNPCLineMediaPlayerOrRandomMediaPlayer(lineName, npcLineGroup, npcLine.media)(onStartEvents, onEndEvents);
    npcLine.animation && generateNPCLineAnimationSequence(lineName, npcLineGroup, npcLine.animation, npcLine.duration)(onStartEvents, onEndEvents);
    npcLine.camera && generateNPCLineCamera(lineName, npcLineGroup, npcLine.camera)(onStartEvents, onEndEvents);
    npcLine.hidableGroup && generateNPCLineHidableGroup(lineName, npcLineGroup, npcLine.hidableGroup)(onStartEvents, onEndEvents);
    generateNPCLineDelay(lineName, npcLineGroup, npcLine.duration, onEndEvents)(onStartEvents, onEndEvents);
    generateNPCLineEventFunction(lineName, npcLineGroup, onStartEvents);
}

const generatePlayerChoiceEventExecuter = (choiceName: string, visibilityEventName: string) => {
    const eventExecuter = spawnObjectUnderParent("EventExecuter", `${choiceName}PlayerChoiceEventExecuter`, rootDialogGroup);
    wl_set_object_string_option(eventExecuter, "EventName", visibilityEventName);
    wl_set_object_string_option(eventExecuter, "eventValue", "true");
    wl_add_event_to_receiver(eventExecuter, "ExecuteEvent", getTriggerEventFromName(choiceName), "");
}

const generatePlayerChoiceButton = (choiceName: string, index: number, playerChoice: PlayerChoice, parent: WildLife.SandboxObject, visibilityEventName: string) => {
    const uiButton = spawnObjectUnderParent("UIButton", `${choiceName}${index}Button`, parent);
    wl_set_object_integer_option(uiButton, "HorizontalAlignment", 3);
    wl_set_object_integer_option(uiButton, "VerticalAlignment", 0);
    wl_add_event_to_dispatcher(uiButton, "OnButtonClicked", getTriggerEventFromName(playerChoice.triggers), "");
    wl_add_event_to_dispatcher(uiButton, "OnButtonClicked", visibilityEventName, "false");
    const input = spawnObjectUnderParent("Input", `${choiceName}${index}Input`, uiButton);
    wl_set_object_string_option(input, "Key", numberToKeyWord(index));
    wl_set_object_bool_option(input, "ConsumeInput", true);
    wl_add_event_to_dispatcher(input, "OnKeyPressed", getTriggerEventFromName(playerChoice.triggers), "");
    wl_add_event_to_dispatcher(input, "OnKeyPressed", visibilityEventName, "false");
    wl_add_event_to_receiver(input, "SetVisibility", visibilityEventName, "");
    wl_set_object_visibility (input, false);
    const uiText = spawnObjectUnderParent("UIText", `${choiceName}${index}Text`, uiButton);
    wl_set_object_integer_option(uiText, "HorizontalAlignment", 1);
    wl_set_object_integer_option(uiText, "VerticalAlignment", 0);
    wl_set_object_string_option(uiText, "Text", `${index}: ${playerChoice.text}`);
}

const generateWLPlayerChoices = (choiceName: string, playerChoice: PlayerChoice[]) => {
    const uiVerticalBox = spawnObjectUnderParent("UIVerticalBox", `${choiceName}PlayerChoiceVericalBox`, uiLayer);
    wl_set_object_visibility (uiVerticalBox, false);
    const visibilityEventName = `${choiceName}PlayerChoiceVisibilityEvent`;
    generatePlayerChoiceEventExecuter(choiceName, visibilityEventName);
    wl_add_event_to_receiver(uiVerticalBox, "SetVisibility", visibilityEventName, "");
    wl_set_object_integer_option(uiVerticalBox, "HorizontalAlignment", 2);
    wl_set_object_integer_option(uiVerticalBox, "VerticalAlignment", 1);
    playerChoice.forEach((playerChoice, index) => {
        generatePlayerChoiceButton(choiceName, index + 1, playerChoice, uiVerticalBox, visibilityEventName);
    });
}

forEachNamed(npcLines, generateWLNPCLine);
forEachNamed(playerChoices, generateWLPlayerChoices);

const eventExecuter = spawnObjectUnderParent("EventExecuter", `StartDialogEventExecuter`, rootDialogGroup);
wl_set_object_string_option(eventExecuter, "EventName", getTriggerEventFromName(dialogs.start));
wl_set_object_string_option(eventExecuter, "eventValue", "");
wl_add_event_to_receiver(eventExecuter, "ExecuteEvent", "DialogStartEvent", "");