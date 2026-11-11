# Expo Animation Starter

This is the base template for Sajjad's React Native animation portfolio. Each portfolio project recreates a polished Flutter UI animation in Expo React Native, and every project is generated from this starter.

## Stack

| Area       | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Expo SDK 58 · React Native 0.88 · React 19.3 · React Compiler |
| Language   | TypeScript 6 (strict)                                         |
| Navigation | Expo Router (`src/app`)                                       |
| Motion     | react-native-reanimated 4 + react-native-worklets             |
| Gestures   | react-native-gesture-handler 3                                |
| Graphics   | react-native-svg · expo-linear-gradient · expo-blur           |
| Feedback   | expo-haptics                                                  |
| Quality    | ESLint (eslint-config-expo) · Prettier                        |

Every dependency runs in **Expo Go**, so no native build is needed. Lottie and Skia are intentionally left out; add them only when a reel needs them.

## Structure

```text
src/
├── app/                 # routes only (Expo Router)
├── features/<feature>/  # screen, components/, motion.ts
├── components/ui/       # Text, Screen, PressableScale, GlassCard, GradientBackground
├── animations/          # motion tokens (Flutter curve equivalents, springs), entrances, worklet math
├── hooks/               # usePressScale, useHaptics
├── theme/               # colors, gradients, typography, spacing, radii, shadows
├── constants/ types/ utils/ assets/
docs/templates/          # analysis, implementation plan, plan review, agent coordination
.claude/agents/          # ui-ux-analyst, animation-engineer, rn-engineer, qa-performance, architect-reviewer
scripts/new-project.sh   # scaffolds a new reel project
```

## Commands

```bash
npm install
npm run ios          # Metro + iOS Simulator (Expo Go)
npm run check        # typecheck + lint + format check
npm run new-project -- project-01 "Reel title"
```

`new-project` copies this starter into `../project-01`, renames it, scaffolds `reference/` and `docs/`, installs dependencies, and makes the first commit.

## Reference material

`reference/` holds each reel's original video and extracted frames. It is git-ignored: those files are a personal study reference and are never redistributed.
