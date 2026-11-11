# Agent coordination: <project>

Statuses: `NOT STARTED` · `IN PROGRESS` · `BLOCKED` · `REVIEW REQUIRED` · `COMPLETED`

## How agents run here

- Agents are Claude Code subagents started by the Orchestrator (the main session). They run in the background and report back to the Orchestrator; they don't each get their own terminal.
- Long-running processes (Metro, simulator builds, installs) run in named Terminal tabs such as `04-metro <project>`.
- Only the Orchestrator installs packages, edits project-wide config, runs Git, and runs simulator builds.

## Agents

| Agent                    | Role                                   | Active? |
| ------------------------ | -------------------------------------- | ------- |
| 01-ORCHESTRATOR          | Coordination, integration, config, git | yes     |
| 02-UI-UX-ANALYST         | Frames, palette, typography, layout    |         |
| 03-ANIMATION-ENGINEER    | Timeline, curves, springs, gestures    |         |
| 04-REACT-NATIVE-ENGINEER | Screens, components, hooks             |         |
| 05-QA-PERFORMANCE        | Types, lint, perf, simulator QA        |         |
| 06-ARCHITECT-REVIEWER    | Independent plan and code review       |         |

## File ownership

| Path                                                                        | Owner           |
| --------------------------------------------------------------------------- | --------------- |
| package.json, app.json, tsconfig.json, eslint.config.js, babel/metro config | 01-ORCHESTRATOR |

## Tasks

| ID  | Task | Agent | Depends on | Status | Notes |
| --- | ---- | ----- | ---------- | ------ | ----- |

## Decisions log

## Outstanding issues

## Integration checklist

- [ ] typecheck · [ ] lint · [ ] format · [ ] simulator run · [ ] reference comparison · [ ] QA sign-off
