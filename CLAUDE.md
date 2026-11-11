# Project guide for Claude Code

@AGENTS.md

## Purpose

This project recreates a Flutter UI animation reel in Expo React Native for Sajjad's portfolio. Motion fidelity and smoothness come first. Never trade animation quality for speed.

## Per-reel workflow (do not skip gates)

1. **Reference:** `reference/original-video.mp4`, `reference/frames/`, and `reference/analysis.md` (from `docs/templates/analysis.md`). Never claim to have analysed a video you couldn't access. `reference/` is git-ignored: don't commit or redistribute the creator's video.
2. **Plan:** `docs/implementation-plan.md` (from the template).
3. **Independent review:** run the `architect-reviewer` subagent, then save its output in `docs/plan-review.md`. Update the plan from its findings.
4. **Approval gate:** present the plan to Sajjad. Do not write feature code before he approves.
5. **Implement**, then do QA: `npm run check`, run in the iOS Simulator, compare against the reference frames, and refine.
6. **Deliver:** GitHub repo and PR. Ask before making anything public.

## Agents

The subagents in `.claude/agents/` are ui-ux-analyst, animation-engineer, rn-engineer, qa-performance and architect-reviewer. The main session is the Orchestrator and the only integration owner. It alone edits package.json, app.json, tsconfig, eslint config and babel/metro config, and it alone runs installs, git and simulator builds. Track tasks and file ownership in `docs/agent-coordination.md`.

## Code conventions

- Strict TypeScript; no `any`. Use the `@/` path alias for `src/`.
- `src/app/` holds routes only. Each screen re-exports a screen from `src/features/<feature>/`.
- `src/features/<feature>/` holds a screen, its `components/`, and `motion.ts` (that reel's measured durations, curves and springs).
- `src/components/ui/` holds generic primitives only (Text, Screen, PressableScale, GlassCard, GradientBackground).
- `src/animations/` holds shared motion tokens (`config.ts`), layout-animation presets (`entrances.ts`) and UI-thread math (`worklets.ts`).
- `src/theme/` holds the colour, typography, spacing, radius and shadow tokens. Don't put raw hex values in components.
- Reanimated: the React Compiler is enabled, so read and write shared values with `.get()` and `.set()`, not `.value`, outside worklets. Keep per-frame work on the UI thread (shared values, `useAnimatedStyle`, `useAnimatedProps`, gesture worklets). Never drive per-frame animation with React state.
- Gesture Handler: wrap gestures in `GestureDetector`. The root is already wrapped in `GestureHandlerRootView`.
- Map Flutter `Curves.*` to `easings` in `src/animations/config.ts`. Derive timings from frame index ÷ fps, never from guessed numbers.
- Before adding a dependency, check whether Expo Go supports it. Anything that needs a dev build (`npx expo run:ios`) must be justified in the plan, because native builds on this Intel Mac are slow.

## Commands

```bash
npm start                 # Metro
npm run ios               # Metro + open in iOS Simulator (Expo Go)
npm run check             # typecheck + lint + prettier check
npm run doctor            # expo-doctor
```
