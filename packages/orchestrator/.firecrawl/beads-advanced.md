[Skip to content](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md) to refresh your session.Dismiss alert

{{ message }}

[steveyegge](https://github.com/steveyegge)/ **[beads](https://github.com/steveyegge/beads)** Public

- [Notifications](https://github.com/login?return_to=%2Fsteveyegge%2Fbeads) You must be signed in to change notification settings
- [Fork\\
1.1k](https://github.com/login?return_to=%2Fsteveyegge%2Fbeads)
- [Star\\
17.3k](https://github.com/login?return_to=%2Fsteveyegge%2Fbeads)


## Collapse file tree

## Files

main

Search this repository

/

# ADVANCED.md

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

3 days agoFeb 23, 2026

[90da8f6](https://github.com/steveyegge/beads/commit/90da8f60288a1ccdb27b2f3293d25707b9bf363e) · 3 days agoFeb 23, 2026

## History

[History](https://github.com/steveyegge/beads/commits/main/docs/ADVANCED.md)

Open commit details

[View commit history for this file.](https://github.com/steveyegge/beads/commits/main/docs/ADVANCED.md) History

338 lines (244 loc) · 10.8 KB

/

# ADVANCED.md

Top

## File metadata and controls

- Preview

- Code

- Blame


338 lines (244 loc) · 10.8 KB

[Raw](https://github.com/steveyegge/beads/raw/refs/heads/main/docs/ADVANCED.md)

Copy raw file

Download raw file

Outline

Edit and raw actions

# Advanced bd Features

[Permalink: Advanced bd Features](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#advanced-bd-features)

This guide covers advanced features for power users and specific use cases.

## Table of Contents

[Permalink: Table of Contents](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#table-of-contents)

- [Renaming Prefix](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#renaming-prefix)
- [Merging Duplicate Issues](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#merging-duplicate-issues)
- [Git Worktrees](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#git-worktrees)
- [Database Redirects](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#database-redirects)
- [Handling Import Collisions](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#handling-import-collisions)
- [Custom Git Hooks](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#custom-git-hooks)
- [Extensible Database](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#extensible-database)
- [Architecture: Storage, RPC, and MCP](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#architecture-storage-rpc-and-mcp)

## Renaming Prefix

[Permalink: Renaming Prefix](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#renaming-prefix)

Change the issue prefix for all issues in your database. This is useful if your prefix is too long or you want to standardize naming.

```
# Preview changes without applying
bd rename-prefix kw- --dry-run

# Rename from current prefix to new prefix
bd rename-prefix kw-

# JSON output
bd rename-prefix kw- --json
```

The rename operation:

- Updates all issue IDs (e.g., `knowledge-work-1` → `kw-1`)
- Updates all text references in titles, descriptions, design notes, etc.
- Updates dependencies and labels
- Updates the counter table and config

**Prefix validation rules:**

- Max length: 8 characters
- Allowed characters: lowercase letters, numbers, hyphens
- Must start with a letter
- Must end with a hyphen (or will be trimmed to add one)
- Cannot be empty or just a hyphen

Example workflow:

```
# You have issues like knowledge-work-1, knowledge-work-2, etc.
bd list  # Shows knowledge-work-* issues

# Preview the rename
bd rename-prefix kw- --dry-run

# Apply the rename
bd rename-prefix kw-

# Now you have kw-1, kw-2, etc.
bd list  # Shows kw-* issues
```

## Duplicate Detection

[Permalink: Duplicate Detection](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#duplicate-detection)

Find issues with identical content using automated duplicate detection:

```
# Find all content duplicates in the database
bd duplicates

# Show duplicates in JSON format
bd duplicates --json

# Automatically merge all duplicates
bd duplicates --auto-merge

# Preview what would be merged
bd duplicates --dry-run

# Detect duplicates during import
bd import -i issues.jsonl --dedupe-after
```

**How it works:**

- Groups issues by content hash (title, description, design, acceptance criteria)
- Only groups issues with matching status (open with open, closed with closed)
- Chooses merge target by reference count (most referenced) or smallest ID
- Reports duplicate groups with suggested merge commands

**Example output:**

```
🔍 Found 3 duplicate group(s):

━━ Group 1: Fix authentication bug
→ bd-10 (open, P1, 5 references)
  bd-42 (open, P1, 0 references)
  Suggested: bd merge bd-42 --into bd-10

💡 Run with --auto-merge to execute all suggested merges
```

**AI Agent Workflow:**

1. **Periodic scans**: Run `bd duplicates` to check for duplicates
2. **During import**: Use `--dedupe-after` to detect duplicates after collision resolution
3. **Auto-merge**: Use `--auto-merge` to automatically consolidate duplicates
4. **Manual review**: Use `--dry-run` to preview merges before executing

## Merging Duplicate Issues

[Permalink: Merging Duplicate Issues](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#merging-duplicate-issues)

Consolidate duplicate issues into a single issue while preserving dependencies and references:

```
# Merge bd-42 and bd-43 into bd-41
bd merge bd-42 bd-43 --into bd-41

# Merge multiple duplicates at once
bd merge bd-10 bd-11 bd-12 --into bd-10

# Preview merge without making changes
bd merge bd-42 bd-43 --into bd-41 --dry-run

# JSON output
bd merge bd-42 bd-43 --into bd-41 --json
```

**What the merge command does:**

1. **Validates** all issues exist and prevents self-merge
2. **Closes** source issues with reason `Merged into bd-X`
3. **Migrates** all dependencies from source issues to target
4. **Updates** text references across all issue descriptions, notes, design, and acceptance criteria

**Example workflow:**

```
# You discover bd-42 and bd-43 are duplicates of bd-41
bd show bd-41 bd-42 bd-43

# Preview the merge
bd merge bd-42 bd-43 --into bd-41 --dry-run

# Execute the merge
bd merge bd-42 bd-43 --into bd-41
# ✓ Merged 2 issue(s) into bd-41

# Verify the result
bd show bd-41  # Now has dependencies from bd-42 and bd-43
bd dep tree bd-41  # Shows unified dependency tree
```

**Important notes:**

- Source issues are permanently closed (status: `closed`)
- All dependencies pointing to source issues are redirected to target
- Text references like "see bd-42" are automatically rewritten to "see bd-41"
- Operation cannot be undone (but git history preserves the original state)
**AI Agent Workflow:**

When agents discover duplicate issues, they should:

1. Search for similar issues: `bd list --json | grep "similar text"`
2. Compare issue details: `bd show bd-41 bd-42 --json`
3. Merge duplicates: `bd merge bd-42 --into bd-41`
4. File a discovered-from issue if needed: `bd create "Found duplicates during bd-X" --deps discovered-from:bd-X`

## Git Worktrees

[Permalink: Git Worktrees](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#git-worktrees)

Git worktrees work with bd. Each worktree can have its own `.beads` directory, or worktrees can share a database via redirects (see [Database Redirects](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#database-redirects)).

**With Dolt backend:** Each worktree operates directly on the database — no special coordination needed. Use `bd dolt push` to sync with Dolt remotes when ready.

**With Dolt server mode:** Multiple worktrees can connect to the same Dolt server for concurrent access without conflicts.

## Database Redirects

[Permalink: Database Redirects](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#database-redirects)

Multiple git clones can share a single beads database using redirect files. This is useful for:

- Multi-agent setups where several clones work on the same issues
- Development environments with multiple checkout directories
- Avoiding duplicate databases across clones

### Setting Up a Redirect

[Permalink: Setting Up a Redirect](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#setting-up-a-redirect)

Create a `.beads/redirect` file pointing to the shared database location:

```
# In your secondary clone
mkdir -p .beads
echo "../main-clone/.beads" > .beads/redirect

# Or use an absolute path
echo "/path/to/shared/.beads" > .beads/redirect
```

The redirect file should contain a single path (relative or absolute) to the target `.beads` directory.

**Example setup:**

```
repo/
├── main-clone/
│   └── .beads/
│       └── beads.db      ← Actual database
├── agent-1/
│   └── .beads/
│       └── redirect      ← Points to ../main-clone/.beads
└── agent-2/
    └── .beads/
        └── redirect      ← Points to ../main-clone/.beads
```

### Checking Active Location

[Permalink: Checking Active Location](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#checking-active-location)

Use `bd where` to see which database is actually being used:

```
bd where
# /path/to/main-clone/.beads
#   (via redirect from /path/to/agent-1/.beads)
#   prefix: bd
#   database: /path/to/main-clone/.beads/beads.db

bd where --json
# {"path": "...", "redirected_from": "...", "prefix": "bd", "database_path": "..."}
```

### Limitations

[Permalink: Limitations](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#limitations)

- **Single-level redirects only**: Redirect chains are not followed (A → B → C won't work)
- **Target must exist**: The redirect target directory must exist and contain a valid database

### When to Use Redirects

[Permalink: When to Use Redirects](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#when-to-use-redirects)

**Good use cases:**

- Multiple AI agents working on the same project
- Parallel development clones (feature work, bug fixes)
- Testing clones that should see production issues

**Not recommended for:**

- Separate projects (use separate databases)
- Long-lived forks (they should have their own issues)
- Git worktrees (each should have its own `.beads` directory)

## Handling Merge Conflicts

[Permalink: Handling Merge Conflicts](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#handling-merge-conflicts)

**With hash-based IDs (v0.20.1+), ID collisions are eliminated.** Different issues get different hash IDs, so concurrent creation doesn't cause conflicts.

### Dolt Native Merge (Default)

[Permalink: Dolt Native Merge (Default)](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#dolt-native-merge-default)

Dolt handles merge conflicts natively with cell-level merge. When concurrent changes affect the same issue field, Dolt detects and resolves conflicts automatically where possible:

```
# Pull with automatic merge
bd dolt pull

# Check for unresolved conflicts
bd vc conflicts

# Resolve if needed
bd vc resolve
```

### Understanding Same-ID Scenarios

[Permalink: Understanding Same-ID Scenarios](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#understanding-same-id-scenarios)

When you encounter the same ID during import, it's an **update operation**, not a collision:

- Hash IDs are content-based and remain stable across updates
- Same ID + different fields = normal update to existing issue
- bd automatically applies updates when importing

**Preview changes before importing:**

```
# Preview an import
bd import -i data.jsonl --dry-run

# Output shows:
# Exact matches (idempotent): 15
# New issues: 5
# Updates: 3
#
# Issues to be updated:
#   bd-a3f2: Fix authentication (changed: priority, status)
#   bd-b8e1: Add feature (changed: description)
```

## Custom Git Hooks

[Permalink: Custom Git Hooks](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#custom-git-hooks)

Git hooks can be used to integrate beads with your git workflow:

### Using the Installer (Recommended)

[Permalink: Using the Installer (Recommended)](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#using-the-installer-recommended)

```
bd hooks install
```

This installs hooks for beads data consistency checks during git operations.

See [DOLT.md](https://github.com/steveyegge/beads/blob/main/docs/DOLT.md) for details on how the Dolt backend handles sync natively.

## Extensible Database

[Permalink: Extensible Database](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#extensible-database)

> **Note:** Custom table extensions via `UnderlyingDB()` are a **SQLite-only** pattern.
> With the Dolt backend, build standalone integration tools using bd's CLI with `--json`
> flags, or use `bd query` for direct SQL access. See [EXTENDING.md](https://github.com/steveyegge/beads/blob/main/docs/EXTENDING.md) for details.

For SQLite-backend users, you can extend bd with your own tables and queries:

- Add custom metadata to issues
- Build integrations with other tools
- Implement custom workflows
- Create reports and analytics

**See [EXTENDING.md](https://github.com/steveyegge/beads/blob/main/docs/EXTENDING.md) for complete documentation.**

## Architecture: Storage, RPC, and MCP

[Permalink: Architecture: Storage, RPC, and MCP](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#architecture-storage-rpc-and-mcp)

Understanding the role of each component:

### Beads (Core)

[Permalink: Beads (Core)](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#beads-core)

- **Dolt database** (primary) — Version-controlled SQL, the source of truth for all issues, dependencies, labels
- **SQLite database** (legacy) — Still supported for simple single-user setups
- **Storage layer** — Interface-based CRUD operations, dependency resolution, collision detection
- **Business logic** — Ready work calculation, merge operations, import/export
- **CLI commands** — Direct database access via `bd` command

### RPC Layer (Server Mode)

[Permalink: RPC Layer (Server Mode)](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#rpc-layer-server-mode)

- **Multi-writer access** — Connects to a running Dolt server (`bd dolt start`) for concurrent clients
- **Used in multi-agent setups** — Gas Town and similar environments where multiple agents write simultaneously
- **Not needed for single-user** — embedded mode handles all local operations

### MCP Server (Optional)

[Permalink: MCP Server (Optional)](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#mcp-server-optional)

- **Protocol adapter** — Translates MCP calls to direct CLI invocations
- **Workspace routing** — Finds correct `.beads` directory based on working directory
- **Stateless** — Doesn't cache or store any issue data itself
- **Editor integration** — Makes bd available to Claude, Cursor, and other MCP clients

**Key principle**: All heavy lifting (dependency graphs, collision resolution, merge logic) happens in the core bd storage layer. The RPC and MCP layers are thin adapters.

## Next Steps

[Permalink: Next Steps](https://github.com/steveyegge/beads/blob/main/docs/ADVANCED.md#next-steps)

- **[README.md](https://github.com/steveyegge/beads/blob/main/README.md)** \- Core features and quick start
- **[TROUBLESHOOTING.md](https://github.com/steveyegge/beads/blob/main/docs/TROUBLESHOOTING.md)** \- Common issues and solutions
- **[FAQ.md](https://github.com/steveyegge/beads/blob/main/docs/FAQ.md)** \- Frequently asked questions
- **[CONFIG.md](https://github.com/steveyegge/beads/blob/main/docs/CONFIG.md)** \- Configuration system guide
- **[EXTENDING.md](https://github.com/steveyegge/beads/blob/main/docs/EXTENDING.md)** \- Database extension patterns

You can’t perform that action at this time.