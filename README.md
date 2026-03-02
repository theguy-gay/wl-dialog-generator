# wl-dialog-generator

A visual dialog authoring tool and Lua code generator for the WildLife sandbox. Design interactive NPC dialog flows in a node-based web editor, export them as JSON, then run the generated Lua bundle inside a WildLife Lua block to spawn all the necessary dialog objects automatically.

**Web Editor:** https://theguy-gay.github.io/wl-dialog-generator/

---

## How It Works

1. **Design** your dialog flow in the web editor (or write the JSON by hand).
2. **Export** the dialog as JSON from the editor.
3. **Run** the Lua bundle inside a WildLife Lua block, passing the JSON as a call argument.

The bundle reads the JSON, then spawns and wires up all the WildLife objects needed to play the dialog: UI text subtitles, media players, animation sequences, cameras, hidable groups, delay timers, and the event chains that connect them.

---

## Web Editor

Open the editor at https://theguy-gay.github.io/wl-dialog-generator/.

### Node Types

| Node | Purpose |
|------|---------|
| **Start** | Marks the entry point of the dialog |
| **NPC Line** | A single line of NPC dialog with optional subtitle, audio, animation, camera, and group visibility |
| **Player Choice** | A set of choices presented to the player, each branching to a different NPC line |

### NPC Line Fields

| Field | Description |
|-------|-------------|
| `text` | Subtitle text displayed on screen |
| `duration` | How long (in seconds) the line plays before advancing |
| `media` | Audio file path, or multiple paths for random selection |
| `animation` | An AnimationSequence name, or a full AnimationSequence object with body animation stages |
| `camera` | Camera to possess during the line, with an option to keep it possessed afterward |
| `hidableGroup` | A group to show during the line, with an option to re-hide it afterward |

Connect nodes by dragging from a node's output handle to another node's input handle.

### Toolbar

- **+ Start / + NPC Line / + Player Choice** — add nodes to the canvas
- **Organize Nodes** — automatically arrange nodes into a readable tree layout
- **Save / Load** — save or restore your work-in-progress (also auto-saves every 5 minutes)
- **Export JSON** — download the dialog as JSON, ready to use with the Lua bundle (disabled if there are validation errors)

---

## Using the Bundle in WildLife

### Setup

Add the contents of `build/bundle.lua` to a Lua block in your WildLife sandbox.

## Dialog JSON Format

```jsonc
{
  "start": "greeting",          // Label of the first NPC line or player choice
  "replace": true,              // Optional: replace existing GeneratedDialogGroup on run

  "npcLines": {
    "greeting": {
      "duration": 4,
      "text": "Hello, traveler.",
      "media": "audio/greeting.wav",
      "animation": "Wave",
      "camera": { "name": "DialogCam", "keepPossessed": false },
      "hidableGroup": { "name": "SubtitleBox", "rehide": true },
      "triggers": "askQuestion"  // Label of next NPC line or player choice
                                 // Omit to end the dialog
    },
    "chooseYes": {
      "duration": 3,
      "text": "Great choice!"
    },
    "chooseNo": {
      "duration": 3,
      "text": "Maybe next time."
    }
  },

  "playerChoices": {
    "askQuestion": [
      { "text": "Yes, I'll help.",  "triggers": "chooseYes" },
      { "text": "No thanks.",       "triggers": "chooseNo" }
    ]
  }
}
```

### Multi-clip Random Audio

Provide an array of paths to have the line pick one at random each time it plays:

```jsonc
"media": ["audio/line_a.wav", "audio/line_b.wav", "audio/line_c.wav"]
```

### Full CharacterAnimation Object

Instead of an AnimationSequence name, you can provide a full animation definition:

```jsonc
"animation": {
  "body": [
    { "animation": "Idle", "duration": 2 },
    { "animation": "Talk", "duration": 2 }
  ]
}
```

---

## Building Locally

```bash
npm install

# Build the Lua bundle
npm run build          # → build/bundle.lua

# Run the web editor locally
npm run dev:web        # → http://localhost:5173
npm run build:web      # → web/dist/
```

Requires Node.js and `typescript-to-lua` (installed via `npm install`).
