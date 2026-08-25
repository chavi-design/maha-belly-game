# MAHA-BELLY: smooth movement build

This package contains the playable portrait Onam arcade game for Over Caffeinated Design.

## Important control change

Each input moves Mahabali exactly one tile:

- One tap on an on-screen arrow = one tile
- One arrow-key or WASD press = one tile
- One swipe = one tile

Keyboard auto-repeat is ignored. The enemies move turn-by-turn after Mahabali, rather than moving while the player is still.

## Run locally

Open Terminal in this folder and run:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Add Clash Display

The licensed font file is not bundled. Add it here using this exact filename:

```text
assets/fonts/ClashDisplay-Bold.woff2
```

The game automatically falls back to Arial Black until the font is added.

## Publish on Netlify

1. Unzip the package.
2. Drag the entire `maha-belly-game` folder into Netlify Drop.
3. Test the generated address on iPhone Safari and Android Chrome.
4. Connect a subdomain such as `onam.overcaffeinateddesign.com` after approval.

No build command is required.

## Included

- 1080 x 1920 canvas in a responsive 9:16 frame
- Five levels
- Detailed code-drawn Mahabali, Sadhya dishes, coffee and agency enemies
- OCD palette: #0600ff, #26ff00, #ffffff and #000000
- Fourteen-step Over Caffeinated Mode
- Score, local high score and three lives
- Pause and generated Web Audio sound effects
- Touch arrows, swipe, arrows and WASD
- Offline cache after first load
- Social preview, icons and approved concept reference
