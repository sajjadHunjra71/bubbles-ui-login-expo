# Testing handover: Aura interactive login

Build: commit `1407401` on `main` (local only, no remote yet).

## Run it

1. In a terminal: `cd ~/Sajjad/portfolio-projects/project-01-interactive-login && yes y | npx expo start --ios`
   (it picks port 8082 if the starter's Metro is still on 8081).
2. It opens in Expo Go on the iPhone 17 Pro simulator. To restart from scratch, close Expo Go and open the project again.
3. **Keyboard:** the simulator hides the on-screen keyboard while the Mac keyboard is connected. Press **⌘K** (I/O → Keyboard → Toggle Software Keyboard) to see the phone pad.

## What to check (in order)

| #   | Do this                                                          | You should see (reference time)                                                                                                                                                                    |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Open the app                                                     | Orange-to-plum gradient, blue glow at the bottom, pulsing white handle, "Swipe up to get started" (0.0 s)                                                                                          |
| 2   | Drag the handle up a little, then back down and let go           | The intro fades, a blurred bubble field and "SEND" show through, the white dot follows your finger; on release it springs back with no bounce (0.6 to 2.2 s)                                       |
| 3   | Swipe up past about a third of the screen (or flick up)          | A huge iridescent bubble swells over the screen, then shrinks over about 0.9 s into the dark "SEND" bubble. Inside the bubble is blurred, outside is sharp. Light haptic on release (2.5 to 3.5 s) |
| 4   | Watch for 10 s                                                   | Face bubbles stream outward and grow as they "approach" you; the nearest go soft and fade. The label goes SEND → RECEIVE (about 0.6 s after release) → SWAP → SEND every 2.6 s                     |
| 5   | Drag a finger through the bubbles                                | Bubbles near your finger get pushed away (optional effect; it's off-switchable in `motion.ts` → `bubbleTouch.enabled`)                                                                             |
| 6   | Tap the label bubble                                             | It advances to the next word                                                                                                                                                                       |
| 7   | Tap **Sign in**                                                  | The pill grows into the frosted brown "Create Your Aura" card in about 0.25 s, the phone field gets focus, and the phone pad comes up with "Use email" / "Continue" riding above it (9.3 to 9.8 s) |
| 8   | Tap the card's back chevron, or swipe the card down              | The card collapses back into the pill in about 0.3 s, and the bubble field behind it is still full                                                                                                 |
| 9   | Repeat 7 to 8 with **Sign up**, and three times in a row         | Same morph from the Sign up pill; the pill reappears every time                                                                                                                                    |
| 10  | Tap the small back chevron at the top-left of the welcome screen | It resets to the intro so you can replay the swipe                                                                                                                                                 |

## Known gaps / things I could not verify

- **Simulator only.** I couldn't test on a physical iPhone. The Intel simulator renders in software, so smoothness there is not representative. Please also try it on a phone through Expo Go if you can.
- **Rim vs. blur during the shrink:** on the simulator, mid-shrink, the rainbow rim is sometimes drawn slightly outside the blurred disc (the two are rendered by different systems and one lags a frame or two). It lines up again once the bubble settles. This needs checking on a device.
- The colours and sizes come from a filmed phone, so they are approximate (±10%).
- Whether bubbles react to touch can't be told from the reel, so it's an optional behaviour.
- iOS only (Android would need a different blur setup).
