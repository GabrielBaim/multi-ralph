# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

**Loop isolation:** This CLAUDE.md, `prd.json`, and `progress.txt` all live in the same loop directory. Each loop has its own isolated copy of these files — do NOT read or write files from other loop directories.

## CRITICAL: TDD is MANDATORY

**Test-Driven Development is NOT optional.** You MUST follow the red-green-refactor cycle:

1. **RED:** Write a FAILING test BEFORE any implementation code
2. **GREEN:** Write the MINIMAL code to make the test pass
3. **REFACTOR:** Clean up the code while keeping tests green

### TDD Workflow Per Story

Before implementing ANY story:

1. **Identify testable behavior** from the acceptance criteria
2. **Write a failing test** that exercises that behavior
3. **Run the test** and confirm it FAILS (red)
4. **Implement** only enough code to make the test pass
5. **Run the test** and confirm it PASSES (green)
6. **Refactor** if needed, running tests after each change
7. **Run full test suite** to ensure no regressions

### Verification Commands

Every story with tests MUST include verification:

```json
{
  "verification": {
    "command": "npm test",
    "expect": "exit 0"
  }
}
```

The verification command runs AFTER marking `passes: true`. If tests fail, `passes` reverts to `false` and you must fix the issue.

### No Tests = No Implementation

If you cannot write a test for a story, you MUST:
- Document why TDD is not applicable (e.g., pure CSS styling)
- Provide alternative verification (e.g., visual testing, manual steps)
- Get explicit approval before proceeding without tests

**Stories without tests will be rejected.**

## CRITICAL: Single Story Rule

You MUST complete EXACTLY ONE story per iteration.

**BEFORE marking any story as passes:true:**
1. Identify the SINGLE target story (passes:false, deps met, lowest priority number)
2. Implement ONLY that story
3. Run verification for ONLY that story
4. Mark ONLY that story as passes:true

**You are FORBIDDEN from:**
- Marking multiple stories as passes:true in one iteration
- Working on stories out of dependency order
- Skipping verification steps

If you complete a story and there are more to do, STOP - the next iteration will pick up the next story automatically.

**VIOLATION DETECTION:** The system will detect if multiple stories are marked as passing and revert all but the target story.

## Your Task

1. Read the PRD at `prd.json` (in this directory — the same directory as this file)
2. Read the progress log at `progress.txt` in this directory (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where:
   - `passes: false`
   - All stories listed in `dependsOn` (if any) already have `passes: true`
5. **Write a failing test** for the story (TDD: RED phase)
6. **Implement** the story to make the test pass (TDD: GREEN phase)
7. Run quality checks:
   - `npm test` (or project test command) - MUST pass
   - `npm run typecheck` - MUST pass
   - `npm run lint` - MUST pass
8. Update CLAUDE.md files if you discover reusable patterns (see below)
9. If ALL checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
10. Update the PRD to set `passes: true` for the completed story
11. **Verification runs automatically**: If the story has a `verification` command, it will execute. If tests fail, `passes` reverts to `false`.
12. Append your progress to `progress.txt`

## Story Dependencies

Stories may have a `dependsOn` field listing other story IDs that must be completed first. **Never attempt a story whose dependencies haven't all passed.** If the highest-priority story has unmet dependencies, skip to the next eligible story.

## Progress Report Format

APPEND to progress.txt (never replace, always append):

```
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered (e.g., "this codebase uses X for Y")
  - Gotchas encountered (e.g., "don't forget to update Z when changing W")
  - Useful context (e.g., "the evaluation panel is in component X")
---
```

The learnings section is critical - it helps future iterations avoid repeating mistakes and understand the codebase better.

## Context Handoff Mechanism

Context flows between iterations through three mechanisms:

1. **progress.txt** — Contains `## Codebase Patterns` at the top with reusable learnings, plus iteration-by-iteration logs. READ THIS FIRST on every iteration.

2. **project-context.md** — Consolidated view of ALL CLAUDE.md files in the project (root and subdirectories). This gives you a warm cache of project knowledge without scanning the entire codebase.

3. **context.md** (optional) — If present alongside this file, it contains explicit handoff notes from the previous iteration. Check for a `## Previous Iteration Failure` section if present.

**On each iteration:**
- Read progress.txt Codebase Patterns section first
- Check for context.md if it exists
- Reference project-context.md for project-wide conventions
- Append new learnings to progress.txt

## Consolidate Patterns

If you discover a **reusable pattern** that future iterations should know, add it to the `## Codebase Patterns` section at the TOP of progress.txt (create it if it doesn't exist). This section should consolidate the most important learnings:

```
## Codebase Patterns
- Example: Use `sql<number>` template for aggregations
- Example: Always use `IF NOT EXISTS` for migrations
- Example: Export types from actions.ts for UI components
```

Only add patterns that are **general and reusable**, not story-specific details.

## Update CLAUDE.md Files

Before committing, check if any edited files have learnings worth preserving in nearby CLAUDE.md files:

1. **Identify directories with edited files** - Look at which directories you modified
2. **Check for existing CLAUDE.md** - Look for CLAUDE.md in those directories or parent directories
3. **Add valuable learnings** - If you discovered something future developers/agents should know:
   - API patterns or conventions specific to that module
   - Gotchas or non-obvious requirements
   - Dependencies between files
   - Testing approaches for that area
   - Configuration or environment requirements

**Examples of good CLAUDE.md additions:**

- "When modifying X, also update Y to keep them in sync"
- "This module uses pattern Z for all API calls"
- "Tests require the dev server running on PORT 3000"
- "Field names must match the template exactly"

**Do NOT add:**

- Story-specific implementation details
- Temporary debugging notes
- Information already in progress.txt

Only update CLAUDE.md if you have **genuinely reusable knowledge** that would help future work in that directory.

## Quality Requirements

- **TDD is MANDATORY**: You MUST write tests BEFORE implementation (red-green-refactor)
- **Tests MUST pass**: ALL commits must pass the full test suite
- ALL commits must pass your project's quality checks (typecheck, lint, test)
- Do NOT commit broken code or code without tests
- Keep changes focused and minimal
- Follow existing code patterns

### Quality Gate Order

1. Write failing test first
2. Implement to make test pass
3. Run `npm test` (or project test command) - MUST pass
4. Run `npm run typecheck` (or equivalent) - MUST pass
5. Run `npm run lint` (or equivalent) - MUST pass
6. Only then commit with message: `feat: [Story ID] - [Story Title]`

## Browser Testing (If Available)

For any story that changes UI, verify it works in the browser if you have browser testing tools configured (e.g., via MCP):

1. Navigate to the relevant page
2. Verify the UI changes work as expected
3. Take a screenshot if helpful for the progress log

If no browser tools are available, note in your progress report that manual browser verification is needed.

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
- If context.md exists alongside this file, read it for recent iteration context
- If a `## Previous Iteration Failure` section exists in the context, pay special attention — the last attempt failed and you should avoid repeating the same mistakes
