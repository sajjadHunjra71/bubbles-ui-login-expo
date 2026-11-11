# Implementation plan: project-01-interactive-login ("Aura")

Status: REVIEWED (revised after docs/plan-review.md, which approved it with changes; awaiting Sajjad's approval)

Source of truth for motion: `reference/analysis.md` (timeline items #1 to #13).

## 1. What will be built

A single-route Expo Router app that reproduces the reel end to end in Expo Go on the iOS Simulator:

1. **Intro (locked) state:** gradient + blue bottom glow + pulsing swipe handle.
2. **Interactive swipe-up:** live blurred preview of the welcome scene; cancel springs back; commit fires the soap-bubble lens reveal.
3. **Welcome scene:** headline, a continuous 3D soap-bubble stream with face photos and iridescent rims, a cycling SEND/RECEIVE/SWAP label bubble, Sign in / Sign up pills, and touch-reactive bubbles.
4. **Create Your Aura card:** a container-transform morph from the tapped pill into a frosted card with a real phone `TextInput` (phone pad), keyboard-follow, and reverse collapse.

Out of scope: real auth, the email flow, any network calls.

## 2. Architecture and folder structure

One feature, `src/features/aura-login/`. State is a single phase machine kept in shared values so every transition runs on the UI thread:

`phase: 'locked' | 'dragging' | 'revealing' | 'welcome' | 'sheetOpening' | 'sheet' | 'sheetClosing'`

React state changes only at phase boundaries (via `scheduleOnRN`) for things like mounting the TextInput and `pointerEvents`, never per frame.

```
src/app/index.tsx                          -> re-exports AuraLoginScreen
src/features/aura-login/
  aura-login-screen.tsx                    composition + phase machine
  motion.ts                                all measured durations/curves/thresholds (cites analysis.md #)
  bubbles/
    bubble-sim.ts                          worklet particle sim (spawn, integrate, project, recycle)
    bubble-canvas.tsx                      Skia <Canvas>; draws a depth slice of the sim (back or front)
    bubble-paint.tsx                       one bubble: photo clip + radial body + iridescent rim + highlight
    use-bubble-images.ts                   loads face images with Skia useImage
  components/
    background-gradient.tsx                Skia gradient (locked/welcome stops, crossfaded)
    intro-overlay.tsx                      bottom glow, handle, caption, swipe pan gesture
    reveal-lens.tsx                        reveal circle: clip + BackdropBlur + iridescent rim (inside the back canvas)
    welcome-header.tsx                     WELCOME TO / headline with mixed serif italic / subtitle
    label-bubble.tsx                       dark bubble + cycling text
    auth-buttons.tsx                       Sign in / Sign up pills; reports measured frames
    create-aura-card.tsx                   morphing frosted card + content + TextInput
    avatar-cluster.tsx, phone-field.tsx    card sub-parts
  assets/faces/*.jpg                       12-16 licensed portraits (256 px)
src/theme/colors.ts                        replace palette with the Aura tokens from analysis §3
src/theme/typography.ts                    add the serif italic family
```

Render layer order (bottom → top), revised per review findings 1, 3 and 16:

1. **Back canvas** (Skia): welcome gradient + back-layer bubbles
2. Welcome RN layer: header (with the back chevron), pills, terms
3. **Front canvas** (Skia, `pointerEvents="none"`): front-layer bubbles
4. **Preview blur** (`expo-blur` BlurView, full screen, plus a dim View; opacity follows p)
5. **Lens** (RN `Animated.View`, `overflow:hidden`, animated left/top/size/borderRadius, containing a BlurView) + **lens rim canvas** (small Skia canvas for the iridescent rim)
6. Label bubble (stays legible above the blur, as in the reference)
7. Intro overlay: intro gradient + blue glow + handle (opacity 1 − p)
8. Card morph layer

Shared values live in `state.ts` (`useAuraState()`, Orchestrator): phase, p, lens radius/centre, emitter centre, touch point/velocity, pill frames, frame tick. Components receive them as typed props.

## 3. Component breakdown

| Component       | File                                 | Responsibility                                                                                                                                                                                                                                                                                                                                                                                                                             | Owner              |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| AuraLoginScreen | `aura-login-screen.tsx`              | phase shared values, layer order, gesture composition                                                                                                                                                                                                                                                                                                                                                                                      | Orchestrator       |
| motion tokens   | `motion.ts`                          | every number from analysis §6/§7                                                                                                                                                                                                                                                                                                                                                                                                           | animation-engineer |
| Bubble sim      | `bubbles/bubble-sim.ts`              | fixed pool (N = 56) in one `Float32Array` shared value (stride: x,y,z,vx,vy,vz,phase,face,layer,age), mutated in place in `useFrameCallback`, followed by a bump of a `frame` tick shared value (never read from JS); the layer (front about 22% / back) is fixed at spawn; spawn at the emitter with random direction (bias up/outward), z from 1→0 (far→near), perspective scale = f/(f+z); wobble; touch repel; recycle when off-screen | animation-engineer |
| BubbleCanvas    | `bubbles/bubble-canvas.tsx`          | `useDerivedValue(() => createPicture(...))` keyed on `frame`, then `<Picture>`; loops over its layer sorted far→near; paints and shaders created once                                                                                                                                                                                                                                                                                      | animation-engineer |
| BubblePaint     | `bubbles/bubble-paint.ts`            | imperative worklet `drawBubble(canvas, …)`: face via `ImageShader` on `drawCircle` (or empty glass), inner radial shade, `SweepGradient` stroke rim rotated per bubble, white highlight arc                                                                                                                                                                                                                                                | animation-engineer |
| RevealLens      | `components/reveal-lens.tsx`         | RN circular-clip view containing a BlurView + rim canvas; centre lerps from the release dot to the emitter during the grow; at the end it crossfades into the label bubble (80 ms) and unmounts                                                                                                                                                                                                                                            | animation-engineer |
| Background      | `components/background-gradient.tsx` | welcome gradient (drawn in the back canvas)                                                                                                                                                                                                                                                                                                                                                                                                | animation-engineer |
| Swipe gesture   | `components/use-swipe-reveal.ts`     | pan hook, p, thresholds, commit/cancel                                                                                                                                                                                                                                                                                                                                                                                                     | animation-engineer |
| Card morph math | `components/card-morph.ts`           | rect/radius lerp worklets                                                                                                                                                                                                                                                                                                                                                                                                                  | animation-engineer |
| State           | `state.ts`                           | typed shared-value contract                                                                                                                                                                                                                                                                                                                                                                                                                | Orchestrator       |
| IntroOverlay    | `components/intro-overlay.tsx`       | intro gradient, glow, pulsing handle, caption; uses `use-swipe-reveal`                                                                                                                                                                                                                                                                                                                                                                     | rn-engineer        |
| WelcomeHeader   | `components/welcome-header.tsx`      | nested `Text` with serif italic spans, opacity tied to reveal                                                                                                                                                                                                                                                                                                                                                                              | rn-engineer        |
| LabelBubble     | `components/label-bubble.tsx`        | cycles labels every 2.5 s plus tap-to-advance; text crossfade + 0.9→1 pop                                                                                                                                                                                                                                                                                                                                                                  | rn-engineer        |
| AuthButtons     | `components/auth-buttons.tsx`        | pills with press scale; measure the frame on press (`measure` in a worklet)                                                                                                                                                                                                                                                                                                                                                                | rn-engineer        |
| CreateAuraCard  | `components/create-aura-card.tsx`    | uses `card-morph.ts`; hides the source pill during the morph; content laid out at the final size and only faded/scaled; TextInput always mounted, `ref.focus()` at morph end; keyboard follow; dismiss                                                                                                                                                                                                                                     | rn-engineer        |
| Theme           | `src/theme/*`                        | Aura palette and typography tokens                                                                                                                                                                                                                                                                                                                                                                                                         | ui-ux-analyst      |

## 4. Animation strategy

| Analysis #      | Technique                                                                                                                                                                                                                                                                                                    | Config (from `motion.ts`)                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1 handle pulse  | `withRepeat(withTiming)` on scale and opacity                                                                                                                                                                                                                                                                | 1600 ms, `easings.standard`, reverse                   |
| 2 drag preview  | `usePanGesture` (RNGH 3 hook API) writes p = clamp(−dy / (0.45·H), 0, 1). The live welcome scene (the stream is already running) sits under a full-screen expo-blur BlurView + dim; the intro layer opacity = 1 − p; handle → dot via `interpolate`. Commit: p > 0.35 or vy < −800 pt/s, plus a light haptic | 1:1 with the finger                                    |
| 3 cancel        | `withSpring(0)`                                                                                                                                                                                                                                                                                              | damping 24, stiffness 180 (no overshoot)               |
| 4 bubble grow   | lens radius `withTiming` from the dot radius to the screen diagonal, while the lens centre lerps from the release point to the emitter; the preview BlurView hands off to the lens BlurView                                                                                                                  | 100 ms (6 frames @60), `easings.decelerate`            |
| 5 lens shrink   | `withSequence` after #4: radius → 32 pt at the emitter; everything inside the lens (RN text and both canvases) is truly blurred; the end crossfades into the label bubble (80 ms, label 0.96→1 settle)                                                                                                       | 550 ms (33 frames), `easings.emphasized`               |
| 6 UI appear     | falls out of #5: content outside the shrinking lens is sharp. No extra fade is needed                                                                                                                                                                                                                        | n/a                                                    |
| 7 bubble stream | `useFrameCallback` integrates the sim each frame (dt-based); pre-warmed with about 3 s of simulated time at mount, so the field is already full in the drag preview and inside the lens (review finding 2)                                                                                                   | N = 56, lifetime 3 to 5 s, quality tier in `motion.ts` |
| 8 label swap    | `setInterval` (2.5 s) only while the phase is `welcome`; two stacked Animated Text layers crossfade with a 0.9→1 pop; a tap gesture on the bubble advances the label                                                                                                                                         | 200 ms                                                 |
| 9 wobble        | in the sim: x += sin(t·ω + φ)·amp; rim rotation += ω_r·dt                                                                                                                                                                                                                                                    | ω about 2π/2.5 s                                       |
| 10 press        | existing `use-press-scale` hook                                                                                                                                                                                                                                                                              | `springs.snappy`, 0.97                                 |
| 11 morph open   | one progress value `withTiming(1)`; rect = lerp(pillFrame, cardFrame); radius 22→28; BlurView intensity 0→40 (`animatedProps`); content opacity from p 0.5→1, scale 0.96→1                                                                                                                                   | 250 ms (15 frames), `easings.fastOutSlowIn`            |
| 12 keyboard     | `TextInput autoFocus` once the morph ends + `useAnimatedKeyboard` translateY on the card's bottom block                                                                                                                                                                                                      | system curve                                           |
| 13 morph close  | `Keyboard.dismiss()` + progress `withTiming(0)`; content fades over the first 40%                                                                                                                                                                                                                            | 300 ms (18 frames), `easings.fastOutSlowIn`            |

Bubble touch: a `useManualGesture` that never activates (it only reads touches down/move), so it never steals touches from the pills, writes the touch point and velocity to shared values. The sim applies a radial impulse to bubbles within 90 pt, which decays. This is behind `motion.bubbleTouch.enabled`, because the reference is ambiguous (analysis §7).

Iridescence quality ladder (stop when it looks right):

1. `SweepGradient` stroke, 1.5 pt, 6 colour stops, rotated per bubble.
2. Add a second offset stroke with `BlendMode.Screen` and blur 1 for the soft film.
3. Optional SkSL `RuntimeEffect` thin-film shader, only if 1 and 2 look flat.

## 5. Dependencies

| Package                                                                                                  | Why                                                                        | Expo Go compatible?                 |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| `@shopify/react-native-skia` 2.14.0 (`npx expo install`)                                                 | single-canvas rendering of 56 glass bubbles, gradients, backdrop/lens blur | Yes, bundled in Expo Go for SDK 58  |
| `@expo-google-fonts/instrument-serif`                                                                    | serif italic headline                                                      | Yes (JS + font files via expo-font) |
| Already present: reanimated 4.7, worklets 0.13, gesture-handler 3.3, expo-blur, expo-haptics, expo-image | n/a                                                                        | Yes                                 |

No dev build is needed.

## 6. Screen-by-screen steps

0. **Spike (half a day):** 56 ImageShader bubbles through `createPicture` in two canvases, plus an animated-radius `overflow:hidden` BlurView over RN text, measured on the simulator. Go/no-go before the rest.
1. **Theme and assets:** add the Aura tokens alongside the existing ones and delete `src/features/showcase` when `index.tsx` switches to Aura (review finding 15); typography tokens, font loading in `_layout`, bundle and credit the face photos.
2. **Static welcome layout** matching `hero-3.6s.png` (header, label bubble, pills, terms) over the gradient. Side-by-side screenshot check.
3. **Bubble sim + canvas** (back slice only), then the front slice; then tune spawn, speed and scale against `sheet-bubbles-4s-5fps.png`.
4. **Bubble look:** photo clip, glass body, rim, highlight. Compare with the 3.0 s and 3.6 s crops.
5. **Intro overlay + swipe gesture** with cancel/commit (reference 0 to 2.5 s).
6. **Lens reveal** (#4 to #6). Frame-step it against `dense-reveal/r_*`.
7. **Label cycling** and bubble touch.
8. **Card morph** open/close + TextInput + keyboard. Frame-step against `dense-sheet/s_*` and `d_*`.
9. Polish: haptics (commit = light, press = selection), reduced-motion fallback (no stream, a simple fade reveal), and the safe-area/notch check on iPhone SE and 16 Pro Max sims.

## 7. Agents, tasks and file ownership

Single owner for package.json, app.json and all config files: the Orchestrator. The Orchestrator also owns `aura-login-screen.tsx` and does all installs, git and simulator runs.

| Agent              | Files                                                                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ui-ux-analyst      | `src/theme/*`, `assets/faces/*` + credits                                                                                                          |
| Orchestrator       | `aura-login-screen.tsx`, `state.ts`, `src/app/*`, all config/package files                                                                         |
| animation-engineer | `motion.ts`, `bubbles/*`, `reveal-lens.tsx`, `background-gradient.tsx`, `use-swipe-reveal.ts`, `card-morph.ts`                                     |
| rn-engineer        | `intro-overlay.tsx`, `welcome-header.tsx`, `label-bubble.tsx`, `auth-buttons.tsx`, `create-aura-card.tsx`, `avatar-cluster.tsx`, `phone-field.tsx` |
| qa-performance     | read-only; reports in `docs/qa-report.md`                                                                                                          |

No two agents write the same file. `docs/agent-coordination.md` tracks this.

## 8. Testing strategy

- `npm run check` (tsc + eslint + prettier) after every step.
- Gesture matrix includes: dismiss mid-open, reset via the back chevron (welcome → locked, for demo replay).
- Run on the iOS Simulator in Expo Go (iPhone 17 Pro). Record a screen capture with `xcrun simctl io booted recordVideo` and extract frames at the same timestamps as the reference, then compare side by side (`reference/frames` vs `qa/frames`).
- Performance: the Reanimated/Perf monitor overlay. The Intel simulator renders Metal in software, so its frame time is a regression signal, not a 60 fps pass/fail. Report N = 56 and N = 40, and confirm final smoothness on a physical iPhone through Expo Go if one is available. Pause spawning while the card covers the field.
- Manual gesture matrix: slow drag/cancel, fast flick commit, drag back down mid-way, tap during reveal, double-tap Sign in, dismiss during the opening morph.

## 9. Performance risks

1. **56 clipped image draws + gradient strokes per frame, twice (two canvases):** keep each bubble to 1 image + 2 strokes. Pre-make one `SkImage` per face at 2x the max on-screen size, and reuse paints. Fallback: lower N or drop the blur on the rim.
2. **Live BlurView over an animating field (preview and lens):** this is expensive on the simulator. The spike in step 0 measures it. The fallback is a lower stream N during `dragging`/`revealing`.
3. **Sim data in a shared value:** mutate a pre-allocated array in place inside the frame callback, and avoid allocating per frame.
4. **BlurView animated intensity:** if `animatedProps` on BlurView stutters, animate the opacity of a fixed-intensity BlurView instead.

## 10. Known limitations

- The reference is filmed footage of a phone, so colours and sizes are estimates (±10%).
- Whether bubbles react to touch is not provable from the video. It is implemented as an optional, tunable behaviour.
- The face photos will differ from the creator's (licensed stand-ins).
- `useAnimatedKeyboard` is deprecated in Reanimated 4.7 but works in Expo Go. keyboard-controller would likely need a dev build.
- The system keyboard look comes from iOS and is not custom.

## 11. Complexity estimate

High. The bubble renderer and the lens reveal carry most of the risk. Rough effort: spike 0.5 day, theme/layout 0.5 day, bubble sim + look 1.5 to 2 days, swipe + reveal 1 day, card morph 0.5 day, QA/polish 1 day. Total about 5 to 6 days of agent work.
