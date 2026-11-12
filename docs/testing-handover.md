# Testing handover: Aura interactive login

Repo: https://github.com/sajjadHunjra71/bubbles-ui-login-expo (`main`).

## Run it

1. In a terminal: `cd ~/Sajjad/portfolio-projects/project-01-interactive-login && yes y | npx expo start --ios`
   (it picks port 8082 if the starter's Metro is still on 8081).
2. It opens in Expo Go on the booted simulator. Use the **iPhone 17 Pro** simulator: on the iPhone 17 Pro Max simulator the Skia layer stayed blank in my test (to be checked). To restart from scratch, close Expo Go and open the project again.
3. **Keyboard:** the simulator hides the on-screen keyboard while the Mac keyboard is connected. Press **⌘K** (I/O → Keyboard → Toggle Software Keyboard) to see the phone pad.

## What to check (in order)

| #   | Do this                                                                            | You should see (reference time)                                                                                                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Open the app                                                                       | Orange-to-plum gradient, blue glow at the bottom, pulsing white handle, "Swipe up to get started" (0.0 s)                                                                                                                                                                                |
| 2   | Drag the handle up a little, then back down and let go                             | The intro fades, a blurred bubble field and "SEND" show through, the white dot follows your finger; on release it springs back with no bounce (0.6 to 2.2 s)                                                                                                                             |
| 3   | Swipe up past about a third of the screen (or flick up)                            | A huge iridescent bubble swells over the screen, then shrinks smoothly over about 0.9 s into the dark glass "SEND" bubble. Inside the bubble is blurred (text and bubbles), outside is sharp, and the rainbow rim stays exactly on the blur edge. Light haptic on release (2.5 to 3.5 s) |
| 4   | Watch for 10 s                                                                     | Face bubbles stream outward and grow as they "approach" you; the nearest go soft and fade. The label goes SEND → RECEIVE (about 0.6 s after release) → SWAP → SEND every 2.6 s                                                                                                           |
| 5   | **Tap** a bubble                                                                   | It bursts like a soap bubble: a quick flash, the film vanishes, the rim tears into arcs that fly outward, droplets spray off, with a light haptic. **Dragging** a finger through the bubbles still pushes them away (`motion.ts` → `bubbleTouch.enabled`)                                |
| 6   | Tap the label bubble                                                               | It advances to the next word                                                                                                                                                                                                                                                             |
| 7   | Tap **Sign in**                                                                    | The screen dims and the frosted brown "Create Your Aura" glass sheet slides up from the bottom over about 0.5 s with a soft landing; the phone field gets focus and the phone pad comes up with "Use email" / "Continue" riding above it                                                 |
| 8   | Tap the back chevron, tap the dimmed area above the sheet, or swipe the sheet down | The sheet slides back down in about 0.4 s and the bubble field behind it is still full                                                                                                                                                                                                   |
| 9   | Repeat 7 to 8 with **Sign up**, and three times in a row                           | Same smooth slide every time                                                                                                                                                                                                                                                             |
| 10  | Tap the small back chevron at the top-left of the welcome screen                   | It resets to the intro so you can replay the swipe                                                                                                                                                                                                                                       |

## Known gaps / things I could not verify

- **Simulator only.** I couldn't test on a physical iPhone. The Intel simulator renders in software, so smoothness there is not representative. Please also try it on a phone through Expo Go if you can.
- The colours and sizes come from a filmed phone, so they are approximate (±10%).
- Whether bubbles react to touch can't be told from the reel, so it's an optional behaviour.
- iOS only (Android would need a different blur setup).
