[Skip to content](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md) to refresh your session.Dismiss alert

{{ message }}

[steveyegge](https://github.com/steveyegge)/ **[beads](https://github.com/steveyegge/beads)** Public

- [Notifications](https://github.com/login?return_to=%2Fsteveyegge%2Fbeads) You must be signed in to change notification settings
- [Fork\\
1.1k](https://github.com/login?return_to=%2Fsteveyegge%2Fbeads)
- [Star\\
17.1k](https://github.com/login?return_to=%2Fsteveyegge%2Fbeads)


## Collapse file tree

## Files

main

Search this repository

/

# AGENT\_INSTRUCTIONS.md

Copy path

BlameMore file actions

BlameMore file actions

## Latest commit

![steveyegge](https://avatars.githubusercontent.com/u/613744?v=4&size=40)![claude](https://avatars.githubusercontent.com/u/81847?v=4&size=40)

[steveyegge](https://github.com/steveyegge/beads/commits?author=steveyegge)

and

[claude](https://github.com/steveyegge/beads/commits?author=claude)

[docs: remove stale JSONL references from ~73 markdown files (bd-9ni.4)](https://github.com/steveyegge/beads/commit/90da8f60288a1ccdb27b2f3293d25707b9bf363e)

Open commit detailsfailure

yesterdayFeb 23, 2026

[90da8f6](https://github.com/steveyegge/beads/commit/90da8f60288a1ccdb27b2f3293d25707b9bf363e) · yesterdayFeb 23, 2026

## History

[History](https://github.com/steveyegge/beads/commits/main/AGENT_INSTRUCTIONS.md)

Open commit details

[View commit history for this file.](https://github.com/steveyegge/beads/commits/main/AGENT_INSTRUCTIONS.md) History

392 lines (278 loc) · 13.1 KB

/

# AGENT\_INSTRUCTIONS.md

Top

## File metadata and controls

- Preview

- Code

- Blame


392 lines (278 loc) · 13.1 KB

[Raw](https://github.com/steveyegge/beads/raw/refs/heads/main/AGENT_INSTRUCTIONS.md)

Copy raw file

Download raw file

Outline

Edit and raw actions

# Detailed Agent Instructions for Beads Development

[Permalink: Detailed Agent Instructions for Beads Development](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#detailed-agent-instructions-for-beads-development)

**For project overview and quick start, see [AGENTS.md](https://github.com/steveyegge/beads/blob/main/AGENTS.md)**

This document contains detailed operational instructions for AI agents working on beads development, testing, and releases.

## Development Guidelines

[Permalink: Development Guidelines](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#development-guidelines)

### Code Standards

[Permalink: Code Standards](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#code-standards)

- **Go version**: 1.24+
- **Linting**: `golangci-lint run ./...` (baseline warnings documented in [docs/LINTING.md](https://github.com/steveyegge/beads/blob/main/docs/LINTING.md))
- **Testing**: All new features need tests (`make test` for local baseline, `make test-full-cgo` when validating full CGO paths)
- **Documentation**: Update relevant .md files

### File Organization

[Permalink: File Organization](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#file-organization)

```
beads/
├── cmd/bd/              # CLI commands
├── internal/
│   ├── types/           # Core data types
│   └── storage/         # Storage layer
│       └── dolt/        # Dolt implementation
├── examples/            # Integration examples
└── *.md                 # Documentation
```

### Testing Workflow

[Permalink: Testing Workflow](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#testing-workflow)

**IMPORTANT:** Never pollute the production database with test issues!

**For manual testing**, use the `BEADS_DB` environment variable to point to a temporary database:

```
# Create test issues in isolated database
BEADS_DB=/tmp/test.db ./bd init --quiet --prefix test
BEADS_DB=/tmp/test.db ./bd create "Test issue" -p 1

# Or for quick testing
BEADS_DB=/tmp/test.db ./bd create "Test feature" -p 1
```

**For automated tests**, use `t.TempDir()` in Go tests:

```
func TestMyFeature(t *testing.T) {
    tmpDir := t.TempDir()
    testDB := filepath.Join(tmpDir, ".beads", "beads.db")
    s := newTestStore(t, testDB)
    // ... test code
}
```

**Warning:** bd will warn you when creating issues with "Test" prefix in the production database. Always use `BEADS_DB` for manual testing.

### Before Committing

[Permalink: Before Committing](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#before-committing)

1. **Run tests**: `make test` (or `./scripts/test.sh`)

   - For full CGO validation: `make test-full-cgo`
2. **Run linter**: `golangci-lint run ./...` (ignore baseline warnings)
3. **Update docs**: If you changed behavior, update README.md or other docs
4. **Commit**: With git hooks installed (`bd hooks install`), Dolt changes are auto-committed

### Commit Message Convention

[Permalink: Commit Message Convention](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#commit-message-convention)

When committing work for an issue, include the issue ID in parentheses at the end:

```
git commit -m "Fix auth validation bug (bd-abc)"
git commit -m "Add retry logic for database locks (bd-xyz)"
```

This enables `bd doctor` to detect **orphaned issues** \- work that was committed but the issue wasn't closed. The doctor check cross-references open issues against git history to find these orphans.

### Git Workflow

[Permalink: Git Workflow](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#git-workflow)

bd uses **Dolt** as its primary database. Changes are committed to Dolt history automatically (one Dolt commit per write command).

**Install git hooks** for automatic sync:

```
bd hooks install
```

### Git Integration

[Permalink: Git Integration](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#git-integration)

**Dolt sync**: Dolt handles sync natively via `bd sync`. No JSONL export/import needed.

**Protected branches**: Use `bd init --branch beads-metadata` to commit to separate branch. See [docs/PROTECTED\_BRANCHES.md](https://github.com/steveyegge/beads/blob/main/docs/PROTECTED_BRANCHES.md).

**Git worktrees**: Work directly with Dolt — no special flags needed. See [docs/ADVANCED.md](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md).

**Merge conflicts**: Rare with hash IDs. Dolt uses cell-level 3-way merge for conflict resolution.

## Landing the Plane

[Permalink: Landing the Plane](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#landing-the-plane)

**When the user says "let's land the plane"**, you MUST complete ALL steps below. The plane is NOT landed until `git push` succeeds. NEVER stop before pushing. NEVER say "ready to push when you are!" - that is a FAILURE.

**MANDATORY WORKFLOW - COMPLETE ALL STEPS:**

1. **File beads issues for any remaining work** that needs follow-up

2. **Ensure all quality gates pass** (only if code changes were made):
   - Run `make lint` or `golangci-lint run ./...` (if pre-commit installed: `pre-commit run --all-files`)
   - Run `make test` (and `make test-full-cgo` when CGO-relevant code changed)
   - File P0 issues if quality gates are broken
3. **Update beads issues** \- close finished work, update status

4. **PUSH TO REMOTE - NON-NEGOTIABLE** \- This step is MANDATORY. Execute ALL commands below:



```
# Pull first to catch any remote changes
git pull --rebase

# MANDATORY: Push everything to remote
# DO NOT STOP BEFORE THIS COMMAND COMPLETES
git push

# MANDATORY: Verify push succeeded
git status  # MUST show "up to date with origin/main"
```







**CRITICAL RULES:**
   - The plane has NOT landed until `git push` completes successfully
   - NEVER stop before `git push` \- that leaves work stranded locally
   - NEVER say "ready to push when you are!" - YOU must push, not the user
   - If `git push` fails, resolve the issue and retry until it succeeds
   - The user is managing multiple agents - unpushed work breaks their coordination workflow
5. **Clean up git state** \- Clear old stashes and prune dead remote branches:



```
git stash clear                    # Remove old stashes
git remote prune origin            # Clean up deleted remote branches
```

6. **Verify clean state** \- Ensure all changes are committed AND PUSHED, no untracked files remain

7. **Choose a follow-up issue for next session**
   - Provide a prompt for the user to give to you in the next session
   - Format: "Continue work on bd-X: \[issue title\]. \[Brief context about what's been done and what's next\]"

**REMEMBER: Landing the plane means EVERYTHING is pushed to remote. No exceptions. No "ready when you are". PUSH IT.**

**Example "land the plane" session:**

```
# 1. File remaining work
bd create "Add integration tests for sync" -t task -p 2 --json

# 2. Run quality gates (only if code changes were made)
go test -short ./...
golangci-lint run ./...

# 3. Close finished issues
bd close bd-42 bd-43 --reason "Completed" --json

# 4. PUSH TO REMOTE - MANDATORY, NO STOPPING BEFORE THIS IS DONE
git pull --rebase
git push       # MANDATORY - THE PLANE IS STILL IN THE AIR UNTIL THIS SUCCEEDS
git status     # MUST verify "up to date with origin/main"

# 5. Clean up git state
git stash clear
git remote prune origin

# 6. Verify everything is clean and pushed
git status

# 7. Choose next work
bd ready --json
bd show bd-44 --json
```

**Then provide the user with:**

- Summary of what was completed this session
- What issues were filed for follow-up
- Status of quality gates (all passing / issues filed)
- Confirmation that ALL changes have been pushed to remote
- Recommended prompt for next session

**CRITICAL: Never end a "land the plane" session without successfully pushing. The user is coordinating multiple agents and unpushed work causes severe rebase conflicts.**

## Agent Session Workflow

[Permalink: Agent Session Workflow](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#agent-session-workflow)

**WARNING: DO NOT use `bd edit`** \- it opens an interactive editor ($EDITOR) which AI agents cannot use. Use `bd update` with flags instead:

```
bd update <id> --description "new description"
bd update <id> --title "new title"
bd update <id> --design "design notes"
bd update <id> --notes "additional notes"
bd update <id> --acceptance "acceptance criteria"
```

**Example agent session:**

```
# Make changes (each write auto-commits to Dolt)
bd create "Fix bug" -p 1
bd create "Add tests" -p 1
bd update bd-42 --status in_progress
bd close bd-40 --reason "Completed"

# Push Dolt data to remote if configured
bd dolt push

# Now safe to end session
```

This installs:

- **pre-commit** — Commits pending Dolt changes
- **post-merge** — Pulls remote Dolt changes after git merge

**Note:** Hooks are embedded in the bd binary and work for all bd users (not just source repo users).

## Common Development Tasks

[Permalink: Common Development Tasks](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#common-development-tasks)

### CLI Design Principles

[Permalink: CLI Design Principles](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#cli-design-principles)

**Minimize cognitive overload.** Every new command, flag, or option adds cognitive burden for users. Before adding anything:

1. **Recovery/fix operations → `bd doctor --fix`**: Don't create separate commands like `bd recover` or `bd repair`. Doctor already detects problems - let `--fix` handle remediation. This keeps all health-related operations in one discoverable place.

2. **Prefer flags on existing commands**: Before creating a new command, ask: "Can this be a flag on an existing command?" Example: `bd list --stale` instead of `bd stale`.

3. **Consolidate related operations**: Related operations should live together. Version control uses `bd vc {log,diff,commit}`, not separate top-level commands.

4. **Count the commands**: Run `bd --help` and count. If we're approaching 30+ commands, we have a discoverability problem. Consider subcommand grouping.

5. **New commands need strong justification**: A new command should represent a fundamentally different operation, not just a convenience wrapper.


### Adding a New Command

[Permalink: Adding a New Command](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#adding-a-new-command)

1. Create file in `cmd/bd/`
2. Add to root command in `cmd/bd/main.go`
3. Implement with Cobra framework
4. Add `--json` flag for agent use
5. Add tests in `cmd/bd/*_test.go`
6. Document in README.md

### Adding Storage Features

[Permalink: Adding Storage Features](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#adding-storage-features)

1. Add Dolt SQL schema changes in `internal/storage/dolt/`
2. Add migration if needed
3. Update `internal/types/types.go` if new types
4. Implement in `internal/storage/dolt/` (queries, issues, etc.)
5. Add tests
6. Update export/import in `cmd/bd/export.go` and `cmd/bd/import.go`

### Adding Examples

[Permalink: Adding Examples](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#adding-examples)

1. Create directory in `examples/`
2. Add README.md explaining the example
3. Include working code
4. Link from `examples/README.md`
5. Mention in main README.md

## Building and Testing

[Permalink: Building and Testing](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#building-and-testing)

```
# Build
go build -o bd ./cmd/bd

# Test (local baseline)
make test

# Test with full CGO-enabled suite (local/CI parity)
make test-full-cgo

# Coverage run
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run locally
./bd init --prefix test
./bd create "Test issue" -p 1
./bd ready
```

## Version Management

[Permalink: Version Management](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#version-management)

**IMPORTANT**: When the user asks to "bump the version" or mentions a new version number (e.g., "bump to 0.9.3"), use the version bump script:

```
# Preview changes (shows diff, doesn't commit)
./scripts/bump-version.sh 0.9.3

# Auto-commit the version bump
./scripts/bump-version.sh 0.9.3 --commit
git push origin main
```

**What it does:**

- Updates ALL version files (CLI, plugin, MCP server, docs) in one command
- Validates semantic versioning format
- Shows diff preview
- Verifies all versions match after update
- Creates standardized commit message

**User will typically say:**

- "Bump to 0.9.3"
- "Update version to 1.0.0"
- "Rev the project to 0.9.4"
- "Increment the version"

**You should:**

1. Run `./scripts/bump-version.sh <version> --commit`
2. Push to GitHub
3. Confirm all versions updated correctly

**Files updated automatically:**

- `cmd/bd/version.go` \- CLI version
- `claude-plugin/.claude-plugin/plugin.json` \- Plugin version
- `.claude-plugin/marketplace.json` \- Marketplace version
- `integrations/beads-mcp/pyproject.toml` \- MCP server version
- `README.md` \- Documentation version
- `PLUGIN.md` \- Version requirements

**Why this matters:** We had version mismatches (bd-66) when only `version.go` was updated. This script prevents that by updating all components atomically.

See `scripts/README.md` for more details.

## Release Process (Maintainers)

[Permalink: Release Process (Maintainers)](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#release-process-maintainers)

**Automated (Recommended):**

```
# One command to do everything (version bump, tests, tag, Homebrew update, local install)
./scripts/release.sh 0.9.3
```

This handles the entire release workflow automatically, including waiting ~5 minutes for GitHub Actions to build release artifacts. See [scripts/README.md](https://github.com/steveyegge/beads/blob/main/scripts/README.md) for details.

**Manual (Step-by-Step):**

1. Bump version: `./scripts/bump-version.sh <version> --commit`
2. Update CHANGELOG.md with release notes
3. Run tests: `make test` (and `make test-full-cgo` for CGO-related changes)
4. Push version bump: `git push origin main`
5. Tag release: `git tag v<version> && git push origin v<version>`
6. Update Homebrew: `./scripts/update-homebrew.sh <version>` (waits for GitHub Actions)
7. Verify: `brew update && brew upgrade beads && bd version`

See [docs/RELEASING.md](https://github.com/steveyegge/beads/blob/main/docs/RELEASING.md) for complete manual instructions.

## Checking GitHub Issues and PRs

[Permalink: Checking GitHub Issues and PRs](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#checking-github-issues-and-prs)

**IMPORTANT**: When asked to check GitHub issues or PRs, use command-line tools like `gh` instead of browser/playwright tools.

**Preferred approach:**

```
# List open issues with details
gh issue list --limit 30

# List open PRs
gh pr list --limit 30

# View specific issue
gh issue view 201
```

**Then provide an in-conversation summary** highlighting:

- Urgent/critical issues (regressions, bugs, broken builds)
- Common themes or patterns
- Feature requests with high engagement
- Items that need immediate attention

**Why this matters:**

- Browser tools consume more tokens and are slower
- CLI summaries are easier to scan and discuss
- Keeps the conversation focused and efficient
- Better for quick triage and prioritization

**Do NOT use:**`browser_navigate`, `browser_snapshot`, or other playwright tools for GitHub PR/issue reviews unless specifically requested by the user.

## Questions?

[Permalink: Questions?](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#questions)

- Check existing issues: `bd list`
- Look at recent commits: `git log --oneline -20`
- Read the docs: README.md, ADVANCED.md, EXTENDING.md
- Create an issue if unsure: `bd create "Question: ..." -t task -p 2`

## Important Files

[Permalink: Important Files](https://github.com/steveyegge/beads/blob/main/AGENT_INSTRUCTIONS.md#important-files)

- **README.md** \- Main documentation (keep this updated!)
- **EXTENDING.md** \- Database extension guide
- **ADVANCED.md** \- Advanced features (rename, merge, compaction)
- **CONTRIBUTING.md** \- Contribution guidelines
- **SECURITY.md** \- Security policy

You can’t perform that action at this time.