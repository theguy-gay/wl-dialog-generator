---
name: repo-guide
description: Repo map, data model, conventions, and gotchas for wl-dialog-generator. Load this FIRST before exploring or editing any code in this repo — it replaces reading most files. Covers both the web editor (web/) and the Lua generator (src/).
---

# wl-dialog-generator — repo guide

Two independent halves sharing one JSON dialog format:

1. **Lua generator** (`src/`) — TypeScript compiled to Lua via tstl. Runs inside the WildLife game sandbox: reads dialog JSON as a call argument, spawns + event-wires sandbox objects (UIText subtitles, MediaPlayers, AnimationSequences, Cameras, Delays, EventFunctions) that play the dialog in-game.
2. **Web editor** (`web/`) — React 18 + `@xyflow/react` (React Flow v12) node editor that authors that JSON visually. Deployed to GitHub Pages (https://theguy-gay.github.io/wl-dialog-generator/) by `.github/workflows/deploy-pages.yml` on push to master.

Root `dialogs.json` is a sample dialog; App.tsx imports it as the editor's initial content.

## Commands

| command | what |
|---|---|
| `npm run dev:web` | Vite dev server |
| `npm run build:web` | Vite → `web/dist/` (base `/wl-dialog-generator/`) |
| `npm run test:web` | Jest (`web/jest.config.js`, tests in `web/src/__tests__/`, tsconfig `web/tsconfig.test.json`) |
| `npm run build` | tstl → `build/bundle.lua` (gitignored) |
| `cd web && npx tsc --noEmit -p tsconfig.json` | typecheck web |

`npm test` (no `:web`) is a stub that exits 1.

## Dialog JSON format (the shared contract)

```jsonc
{
  "start": "<label>",        // entry label (an npcLine or playerChoice key)
  "replace": true,           // optional: Lua deletes the previous GeneratedDialogGroup first
  "npcLines": {
    "<label>": {
      "duration": 3,                       // required, seconds
      "text": "subtitle",                  // optional — all others optional too
      "media": "path" /* or ["p1","p2"] — random pick */,
      "animation": "SeqName" /* or CharacterAnimation object: {name, posePropName, bodyAnimationStages?: [{startAnimation,startTime,endAnimation,endTime,disableChestPhysics?,disableButtPhysics?}], replaceBodyAnimations?} */,
      "camera": { "name": "", "keepPossessed": false },
      "hidableGroup": { "name": "", "rehide": false },
      "triggers": "next" /* or ["a","b"] — labels run on completion; absent = dialog ends */,
      "completionEvent": "EventName"
    }
  },
  "playerChoices": { "<label>": [{ "text": "…", "triggers": "npcLineLabel" }] },
  "_aiVoice": { "characters": [{id,name,voiceId,color}], "voiceAssignments": {"npcLineLabel": "charId"} } // editor-only, ignored by Lua
}
```

Types are **duplicated** in `src/types.ts` (Lua side, with doc comments) and `web/src/types.ts` (web side, + AiVoice types). `web/src/utils/fieldTooltips.ts` mirrors the `src/types.ts` comments as UI tooltips. **A format change must update all three.**

## Web editor (`web/src/`)

### Flow encoding conventions (most important knowledge for web edits)

- Node ids: `start`, `npcLine-<label>`, `playerChoice-<label>`. A `stripPrefix()` helper (duplicated in flowToDialog / validateFlow / exportZip) recovers the label.
- `node.data` always has `_type` (`'start' | 'npcLine' | 'playerChoice'`); dialog nodes also have `_label`. The rest of data is the NPCLine fields verbatim (`undefined` = field absent), or `choices: [{text}]` for playerChoice, `replace?` for start, `aiCharacterId?` in AI mode.
- **Never spread `node.data` into an exported object** — build field-by-field so `_label`/`_type`/`aiCharacterId` don't leak (see flowToDialog.ts).
- Connections are stored ONLY as edges — `triggers` is derived from out-edges on export; nodes not BFS-reachable from the start node are silently excluded from export/validation.
- Edges carry `data.color` from `pickEdgeColor(index)` (`utils/edgeColors.ts` 10-color palette). PlayerChoice out-edges use `sourceHandle: 'choice-<i>'` **and** `data.choiceIndex: i` — keep both in sync (`utils/fixChoiceEdges.ts` does this on choice remove/reorder). NPC multi-trigger order = trailing `-<i>` on the edge id.
- `DialogEditor.onConnect` replaces any existing edge from the same source+sourceHandle (one edge per handle).

### File map

- `App.tsx` (~520 ln) — all app state: nodes/edges (`useNodesState`), toolbar, add-node (findFreePosition ring search around viewport center), export JSON/ZIP, localStorage persistence, all AI-voice state/handlers.
- `components/DialogEditor.tsx` — ReactFlow wrapper; nodeTypes/edgeTypes maps; global SVG arrowhead markers per palette color; ViewportBridge exposes a screen-center getter to App.
- `components/NpcLineNode.tsx` (~465 ln, biggest) — renders every NPCLine field with add(+)/remove(×) affordances, animation string↔object radio toggle, dnd-kit sortable media list & bodyAnimationStages, AI voice section, character drag-drop target.
- `components/PlayerChoiceNode.tsx` — sortable choice rows, one source handle per choice.
- `components/StartNode.tsx` — replace checkbox + single source handle.
- `components/CustomEdge.tsx` — colored bezier; animated gradient stroke/marker when the target has multiple in-edges. `components/AnimatedHandle.tsx` — target handle cycles through in-edge colors.
- `components/SaveLoadMenu.tsx` — Save/Load dropdown (WIP + named workflows). `onSaveAs` returns boolean (false = user declined overwrite; menu stays open).
- Small shared UI: `SubBox` (labeled box w/ +/×/drag-handle header), `FieldLabel` (label + tooltip), `NodeInput` (holds local state while focused, commits onBlur — fixes cursor desync; use it for text inputs in nodes), `RenameableLabel` (click-to-edit header), `SortableArrayItem`/`SortableSubBoxWrapper` (dnd-kit rows), `ErrorPanel` (bottom-left export blockers).
- AI voice: `AiVoiceModal` (API-key entry), `AddCharacterModal`, `CharacterPanel` (drag source), `AiVoiceSection` (per-node generate/play), `context/AiVoiceContext.tsx` (context + CHARACTER_COLORS), `utils/elevenLabsApi.ts` (ElevenLabs TTS, model eleven_multilingual_v2, mp3).
- `hooks/useRenameNode.ts` — renames a node id + patches all edge endpoints; rejects duplicate labels.
- `utils/dialogToFlow.ts` — JSON→nodes/edges + `computeTreeLayout` (BFS level layout; also used by "Organize Nodes"). `utils/flowToDialog.ts` — nodes/edges→JSON. `utils/validateFlow.ts` — export blocker list (ErrorPanel; Export disabled while non-empty). `utils/exportZip.ts` — lazy-imported jszip; dialog.json + generated mp3s at each node's media path (default `sounds/dialog/<label>.mp3`).
- CSS: `App.css` (toolbar, menus, modals, panels — dark theme, hardcoded hex), `components/nodes.css` (node internals).

### State & persistence (all in App.tsx)

- localStorage `wl-dialog-wip` = `{version, nodes, edges, savedAt}` — manual save + 5-min autosave interval.
- localStorage `wl-dialog-workflows` = array of `{id, name, savedAt, nodes, edges}`; React state (`savedWorkflows`) keeps metadata only. Save As overwrites a same-name entry after `confirm()`.
- AI voice mode: `aiMode {apiKey}` (never persisted), `characters`, `voiceGenerations: Map<nodeId, ArrayBuffer>`, `node.data.aiCharacterId`. Assignments round-trip via `_aiVoice` in the JSON (loading a file with `_aiVoice` while AI mode is off prompts for an API key first — `pendingFileLoad`). Generating a voice sets the node's `duration` from decoded audio length and locks the duration input. Export becomes ZIP when any generations exist.

## Lua generator (`src/`)

- `index.ts` — top-level script (no exports/main). Input: `wl_get_call_argument_as_string()` → `decode()` from `lua_sources/json.lua` (typed by `json.d.ts`). Spawns everything under Group `GeneratedDialogGroup` (child of the Lua block's parent) + `GeneratedDialogUILayer`; `replace` deletes a prior group first.
- Event wiring: every label owns `<label>TriggerEvent` (`utils.getTriggerEventFromName`). An NPCLine = EventFunction (fires onStart events) + Delay(duration) (fires onEnd events: next triggers, completionEvent, subtitle hide, camera unpossess, group rehide). PlayerChoices = hidden UIVerticalBox of UIButtons + number-key Inputs (`utils.numberToKeyWord`, keys 1–9, 10→"Zero"). The dialog is started externally by dispatching **"DialogStartEvent"**.
- Named scene objects (animation / camera / hidableGroup): reuse existing `wl_get_object(name)` if present, else spawn one.
- `characterAnimation.ts` — writes body-animation keyframe tracks (A/B index + blend ping-pong, physics toggles) onto an AnimationSequence for the pose prop.
- The `wl_*` globals come from the `wl-typescript` package (`file:../wl-typescript` sibling-dir dep, wired via root tsconfig `types`).
- tstl config lives in root `tsconfig.json`: bundle entry `src/index.ts`, Lua 5.3, `include: ["src", "lua_sources"]` — deliberately excludes `web/` so tstl never compiles web files.

## Gotchas / current state

- **Stale tests**: `web/src/__tests__/roundtrip.test.ts` and `validate.test.ts` were written for an older API (`_isStart` node flag, 3-arg `flowToDialog(nodes, edges, startLabel)`, `.replace` on the result) before the dedicated Start node existed. They fail under jest (7/13) and tsc. Not regressions — rewrite them if you touch flowToDialog/validateFlow. `fixChoiceEdges.test.ts` passes.
- Destructive prompts use native `confirm()`/`alert()` — no custom modal for these.
- Dropdown menus (`.save-load-menu`, `.save-load-submenu` in App.css) are plain absolutely-positioned divs closed by an outside-mousedown listener; the submenu opens on hover and scrolls internally (`max-height` + `overflow-y`).
- GitHub Pages source must stay set to "GitHub Actions" in repo Settings → Pages (manual, user-owned setting).
