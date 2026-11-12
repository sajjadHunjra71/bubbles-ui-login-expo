# Aura: interactive login (Expo React Native)

A recreation, in Expo React Native, of a Flutter "interactive login screen" concept by [zain_dev\_](https://www.instagram.com/zain_dev_/). It is part of my React Native animation portfolio. All code here is my own; the original reel is not included in this repository.

## What it does

- **Swipe-up handle:** dragging up fades the intro and shows a live, blurred preview of the screen behind it. Releasing early springs back with no overshoot.
- **Soap-bubble lens reveal:** past the threshold, an iridescent bubble swells over the screen and shrinks over about 0.9 s into the label bubble. Everything inside the bubble stays blurred and everything outside it is revealed.
- **3D bubble stream:** about 56 glass bubbles (faces, empty glass, sparkles) burst out of the label with perspective depth, thin-film rims and specular highlights. The nearest bubbles defocus and fade. Tap a bubble to pop it (film flash, torn rim, droplet spray); drag through them to push them away.
- **Cycling label:** SEND, RECEIVE, SWAP, with a crossfade and a small pop.
- **Glass sheet:** "Sign in" / "Sign up" slide a frosted "Create Your Aura" sheet up from the bottom over a dimmed backdrop, with a phone field. The bottom actions ride the keyboard, and it closes with the back button, a tap outside or a swipe down.

## How it is built

| Area            | Approach                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Bubble field    | A UI-thread particle sim (`Float32Array` pool stepped in `useFrameCallback`) drawn imperatively with `@shopify/react-native-skia` pictures |
| Depth           | Two Skia canvases (behind and in front of the UI), with each bubble's layer fixed at spawn                                                 |
| Lens            | One Skia picture per frame: the scene re-drawn into a blurred, circle-clipped layer, plus tint and a sweep-gradient rim at the same radius |
| Gestures        | react-native-gesture-handler 3 hook API (`usePanGesture`, `useManualGesture`)                                                              |
| Motion          | react-native-reanimated 4; every duration and curve in `src/features/aura-login/motion.ts` is measured from the reference frames           |
| Keyboard        | react-native-keyboard-controller                                                                                                           |
| Runs in Expo Go | Yes, no native build needed (iOS)                                                                                                          |

Stack: Expo SDK 58, React Native 0.88, React 19.3 with the React Compiler, TypeScript (strict).

## Run it

```bash
npm install
npm run ios     # Metro + iOS Simulator (Expo Go)
npm run check   # typecheck + lint + format check
```

In the iOS Simulator, press ⌘K to show the on-screen keypad on the phone field.

## Docs

- [`docs/implementation-plan.md`](docs/implementation-plan.md): the plan, as reviewed twice ([review](docs/plan-review.md), [audit](docs/plan-audit-2.md))
- [`docs/testing-handover.md`](docs/testing-handover.md): a manual test checklist

## Credits

- Font: Instrument Serif (SIL Open Font License) via `@expo-google-fonts/instrument-serif`.
- Scaffolded from my `expo-animation-starter`, which is based on Expo's template (MIT, see [LICENSE](LICENSE)).
