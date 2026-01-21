# Battlefield 6 Portal FX Showcase

An in-game FX browser for Battlefield 6 Portal: search and preview common `RuntimeSpawn` VFX/SFX at a fixed test position.

## Credits

This project is based on the Battlefield 6 Portal TypeScript template by Michael De Luca: https://github.com/deluca-mike/bf6-portal-scripting-template

## What is This?

This project enumerates the `RuntimeSpawn_Common` assets from `bf6-portal-mod-types` at build time, then provides an in-game UI to search/select and play/stop them.

## Prerequisites

Before you begin, make sure you have:

1. **Node.js** (version 23.0.0 or higher)
    - Download from [nodejs.org](https://nodejs.org/)
    - Verify installation: `node --version`

2. **npm** (comes with Node.js)
    - Verify installation: `npm --version`

3. **A Battlefield 6 Portal account**
    - Access to the Portal Experience Editor

4. **Basic familiarity with:**
    - JavaScript or TypeScript (helpful but not required)
    - Using a code editor (VS Code recommended)
    - Command line/terminal basics

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This downloads all the required packages and tools.

### 2. Build

```bash
npm run build
```

This creates two files in the `dist/` folder:

- `bundle.ts` - Your compiled TypeScript code
- `bundle.strings.json` - All text strings used in your experience

### 3. Upload to Portal

1. Open the Battlefield 6 Portal Experience Editor
2. Navigate to the Scripting section
3. Click the "Manage Scripts" button.
4. Upload `dist/bundle.ts` via the "Custom Script" section.
5. Upload `dist/bundle.strings.json` via the "Text Strings" section.
6. Click "Import Files".
7. Save and test your experience!

## Using the Showcase

- The UI is intended for the first/solo player (ObjId 0).
- Use the top buttons to open Search and to Play/Stop quickly.
- If your level includes an InteractPoint with ObjId `1000`, it toggles Play/Stop.
- FX are spawned at a fixed base position (see `FX_POSITION` in `src/index.ts`) with X-only offset controls in the UI.

## Development

- Regenerate the FX/SFX lists: `npm run generate-fx`
- Build: `npm run build`
- Lint/format: `npm run lint`, `npm run prettier`

