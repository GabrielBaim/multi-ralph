#!/bin/zsh
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [--tool amp|claude] [max_iterations]

set -e

# Parse arguments
TOOL="amp"  # Default to amp for backwards compatibility
MAX_ITERATIONS=30

while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    *)
      # Assume it's max_iterations if it's a number
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# Validate tool choice
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'."
  exit 1
fi
# RALPH_LOOP_DIR is set by the orchestrator; fallback to zsh path resolution for manual runs
SCRIPT_DIR="${RALPH_LOOP_DIR:-${0:A:h}}"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"
CONTEXT_FILE="$SCRIPT_DIR/context.md"
LAST_FAILURE_FILE="$SCRIPT_DIR/last-failure.md"
RETRY_COUNT_FILE="$SCRIPT_DIR/.retry-counts"
METRICS_FILE="$SCRIPT_DIR/metrics.json"
MAX_RETRIES_PER_STORY=3

# Archive previous run if branch changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_BRANCH_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_BRANCH" ] && [ -n "$LAST_BRANCH" ] && [ "$CURRENT_BRANCH" != "$LAST_BRANCH" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    # Strip "ralph/" prefix from branch name for folder
    FOLDER_NAME=$(echo "$LAST_BRANCH" | sed 's|^ralph/||')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [ -f "$PRD_FILE" ]; then
  CURRENT_BRANCH=$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_BRANCH" ]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

# Initialize retry counts file
if [ ! -f "$RETRY_COUNT_FILE" ]; then
  echo "{}" > "$RETRY_COUNT_FILE"
fi

# Initialize metrics file
if [ ! -f "$METRICS_FILE" ]; then
  echo '{"iterationTimes":[],"storyAttempts":{},"tokensPerIteration":[],"totalTokens":0,"estimatedCostUsd":0}' > "$METRICS_FILE"
fi

# --- Helper Functions ---

# Run quality gates before accepting story completion
run_gates() {
  local story_id="$1"

  # Default gates if not defined in PRD
  local typecheck_cmd=$(jq -r '.gates.typecheck.command // "npm run typecheck"' "$PRD_FILE" 2>/dev/null)
  local lint_cmd=$(jq -r '.gates.lint.command // "npm run lint"' "$PRD_FILE" 2>/dev/null)
  local test_cmd=$(jq -r '.gates.test.command // "npm test"' "$PRD_FILE" 2>/dev/null)

  # Check if gates are disabled
  local gates_disabled=$(jq -r '.gates.disabled // false' "$PRD_FILE" 2>/dev/null)
  if [ "$gates_disabled" = "true" ]; then
    echo "  Gates disabled in PRD, skipping"
    return 0
  fi

  # Run typecheck gate (required)
  echo "  Running gate: typecheck"
  if ! eval "$typecheck_cmd" 2>&1; then
    echo "  GATE FAILED: typecheck"
    return 1
  fi

  # Run lint gate (required)
  echo "  Running gate: lint"
  if ! eval "$lint_cmd" 2>&1; then
    echo "  GATE FAILED: lint"
    return 1
  fi

  # Run test gate (required for TDD)
  echo "  Running gate: test"
  if ! eval "$test_cmd" 2>&1; then
    echo "  GATE FAILED: test"
    return 1
  fi

  echo "  All gates passed"
  return 0
}

# Revert a story's passes status to false
revert_story() {
  local story_id="$1"
  local reason="$2"
  local tmp
  tmp=$(mktemp)
  jq --arg id "$story_id" '
    (.userStories // .stories // []) |= map(
      if .id == $id then .passes = false else . end
    )
  ' "$PRD_FILE" > "$tmp" && mv "$tmp" "$PRD_FILE"
  echo "  Reverted $story_id: $reason"
}

# Detect if multiple stories were marked as passing (violation of single-story rule)
detect_multiple_passes() {
  local target_id="$1"
  local before_state="$2"

  # Count stories that pass AFTER the iteration
  local after_passing
  after_passing=$(jq -r '(.userStories // .stories // []) | map(select(.passes == true)) | length' "$PRD_FILE" 2>/dev/null || echo "0")

  # Count stories that passed BEFORE the iteration
  local before_passing
  before_passing=$(echo "$before_state" | jq -r '(.userStories // .stories // []) | map(select(.passes == true)) | length' 2>/dev/null || echo "0")

  # Calculate newly passed stories
  local newly_passed=$((after_passing - before_passing))

  if [ "$newly_passed" -gt 1 ]; then
    echo "  VIOLATION: Agent marked $newly_passed stories as passing in one iteration!"
    echo "  Reverting all except target story: $target_id"

    # Revert all stories except the target to passes:false
    local tmp
    tmp=$(mktemp)
    jq --arg target "$target_id" '
      (.userStories // .stories // []) |= map(
        if .id != $target and .passes == true then .passes = false else . end
      )
    ' "$PRD_FILE" > "$tmp" && mv "$tmp" "$PRD_FILE"

    return 1
  fi

  return 0
}

# Build context.md from recent progress, codebase patterns, and git state
build_context() {
  local ctx="$CONTEXT_FILE"
  echo "# Iteration Context (auto-generated)" > "$ctx"
  echo "" >> "$ctx"

  # Extract Codebase Patterns from progress.txt
  if [ -f "$PROGRESS_FILE" ]; then
    local patterns
    patterns=$(sed -n '/^## Codebase Patterns/,/^## /{ /^## Codebase Patterns/d; /^## [^C]/d; p; }' "$PROGRESS_FILE" 2>/dev/null || echo "")
    if [ -n "$patterns" ]; then
      echo "## Codebase Patterns (from previous iterations)" >> "$ctx"
      echo "$patterns" >> "$ctx"
      echo "" >> "$ctx"
    fi
  fi

  # Last 3 progress entries (not the full log)
  if [ -f "$PROGRESS_FILE" ]; then
    local recent
    recent=$(awk '/^## \[/{count++} count>=1{print} count>=3{exit}' "$PROGRESS_FILE" 2>/dev/null | tail -60 || echo "")
    if [ -n "$recent" ]; then
      echo "## Recent Progress (last 3 iterations)" >> "$ctx"
      echo "$recent" >> "$ctx"
      echo "" >> "$ctx"
    fi
  fi

  # Recent git changes (last 3 commits by ralph)
  local git_log
  git_log=$(git log --oneline -5 2>/dev/null || echo "")
  if [ -n "$git_log" ]; then
    echo "## Recent Commits" >> "$ctx"
    echo '```' >> "$ctx"
    echo "$git_log" >> "$ctx"
    echo '```' >> "$ctx"
    echo "" >> "$ctx"
  fi

  # Files changed in last commit
  local changed_files
  changed_files=$(git diff --name-only HEAD~1 2>/dev/null | head -20 || echo "")
  if [ -n "$changed_files" ]; then
    echo "## Files Changed in Last Commit" >> "$ctx"
    echo '```' >> "$ctx"
    echo "$changed_files" >> "$ctx"
    echo '```' >> "$ctx"
    echo "" >> "$ctx"
  fi

  # Include failure diagnosis if exists
  if [ -f "$LAST_FAILURE_FILE" ]; then
    echo "## Previous Iteration Failure" >> "$ctx"
    echo "**The previous iteration failed. Review the diagnosis below and avoid repeating the same mistakes.**" >> "$ctx"
    echo "" >> "$ctx"
    cat "$LAST_FAILURE_FILE" >> "$ctx"
    echo "" >> "$ctx"
  fi

  # Include project-context.md if exists (warm cache of CLAUDE.md files)
  if [ -f "$SCRIPT_DIR/project-context.md" ]; then
    echo "## Project Context (from CLAUDE.md files)" >> "$ctx"
    cat "$SCRIPT_DIR/project-context.md" >> "$ctx"
    echo "" >> "$ctx"
  fi
}

# Get the current target story ID from prd.json (highest priority with passes:false and deps met)
get_target_story() {
  if [ ! -f "$PRD_FILE" ]; then
    echo ""
    return
  fi

  # Get story that: passes==false, all dependsOn have passes==true, lowest priority number
  # Also skip stories that exceeded max retries
  local retry_counts
  retry_counts=$(cat "$RETRY_COUNT_FILE" 2>/dev/null || echo "{}")

  jq -r --argjson retries "$retry_counts" --argjson maxRetries "$MAX_RETRIES_PER_STORY" '
    .userStories // .stories // [] |
    # Build a map of which stories pass
    (map({(.id // "unknown"): .passes}) | add // {}) as $passMap |
    # Filter to eligible stories
    map(select(
      (.passes != true) and
      ((.dependsOn // []) | all(. as $dep | $passMap[$dep] == true)) and
      (($retries[.id // "unknown"] // 0) < $maxRetries)
    )) |
    sort_by(.priority // 999) |
    first |
    .id // ""
  ' "$PRD_FILE" 2>/dev/null || echo ""
}

# Increment retry count for a story
increment_retry() {
  local story_id="$1"
  local counts
  counts=$(cat "$RETRY_COUNT_FILE" 2>/dev/null || echo "{}")
  echo "$counts" | jq --arg id "$story_id" '.[$id] = ((.[$id] // 0) + 1)' > "$RETRY_COUNT_FILE"
}

# Check if a story was just completed (passes changed to true)
check_story_passed() {
  local story_id="$1"
  if [ ! -f "$PRD_FILE" ] || [ -z "$story_id" ]; then
    return 1
  fi
  jq -r --arg id "$story_id" '
    (.userStories // .stories // []) | map(select(.id == $id)) | first | .passes == true
  ' "$PRD_FILE" 2>/dev/null | grep -q "true"
}

# Run verification command for a story if defined
verify_story() {
  local story_id="$1"
  if [ ! -f "$PRD_FILE" ] || [ -z "$story_id" ]; then
    return 0
  fi

  local verification_cmd
  verification_cmd=$(jq -r --arg id "$story_id" '
    (.userStories // .stories // []) | map(select(.id == $id)) | first | .verification.command // ""
  ' "$PRD_FILE" 2>/dev/null || echo "")

  if [ -z "$verification_cmd" ]; then
    return 0  # No verification defined, pass by default
  fi

  echo "  Running verification for $story_id: $verification_cmd"
  local verify_output
  verify_output=$(eval "$verification_cmd" 2>&1) || {
    echo "  VERIFICATION FAILED for $story_id"
    echo "$verify_output" | tail -20

    # Revert passes to false
    local tmp_prd
    tmp_prd=$(mktemp)
    jq --arg id "$story_id" '
      (.userStories // .stories // []) |= map(
        if .id == $id then .passes = false else . end
      )
    ' "$PRD_FILE" > "$tmp_prd" && mv "$tmp_prd" "$PRD_FILE"

    # Write failure diagnosis
    echo "## Verification Failed: $story_id" > "$LAST_FAILURE_FILE"
    echo "Command: \`$verification_cmd\`" >> "$LAST_FAILURE_FILE"
    echo '```' >> "$LAST_FAILURE_FILE"
    echo "$verify_output" | tail -40 >> "$LAST_FAILURE_FILE"
    echo '```' >> "$LAST_FAILURE_FILE"

    return 1
  }

  echo "  Verification PASSED for $story_id"
  return 0
}

# Estimate tokens from Claude output (rough: ~4 chars per token)
estimate_tokens() {
  local output="$1"
  local chars=${#output}
  echo $(( chars / 4 ))
}

# Update metrics file
update_metrics() {
  local iteration_time_ms="$1"
  local tokens="$2"
  local story_id="$3"

  if [ ! -f "$METRICS_FILE" ]; then
    echo '{"iterationTimes":[],"storyAttempts":{},"tokensPerIteration":[],"totalTokens":0,"estimatedCostUsd":0}' > "$METRICS_FILE"
  fi

  local tmp_metrics
  tmp_metrics=$(mktemp)
  jq --argjson time "$iteration_time_ms" \
     --argjson tokens "$tokens" \
     --arg story "$story_id" '
    .iterationTimes += [$time] |
    .tokensPerIteration += [$tokens] |
    .totalTokens += $tokens |
    .estimatedCostUsd = ((.totalTokens + $tokens) * 0.000015) |
    if $story != "" then
      .storyAttempts[$story] = ((.storyAttempts[$story] // 0) + 1)
    else . end
  ' "$METRICS_FILE" > "$tmp_metrics" && mv "$tmp_metrics" "$METRICS_FILE"
}

# --- Main Loop ---

echo "Starting Ralph - Tool: $TOOL - Max iterations: $MAX_ITERATIONS"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  # Identify the target story before iteration
  TARGET_STORY=$(get_target_story)

  if [ -z "$TARGET_STORY" ]; then
    # Check if all stories pass
    ALL_PASS=$(jq '(.userStories // .stories // []) | all(.passes == true)' "$PRD_FILE" 2>/dev/null || echo "false")
    if [ "$ALL_PASS" = "true" ]; then
      echo ""
      echo "All stories completed!"
      echo "<promise>COMPLETE</promise>"
      exit 0
    fi

    echo "No eligible stories found (all may have exceeded max retries: $MAX_RETRIES_PER_STORY)."
    echo "Check retry counts in $RETRY_COUNT_FILE"
    exit 1
  fi

  echo "  Target story: $TARGET_STORY"

  # Build context for this iteration
  build_context

  # Capture PRD state BEFORE iteration (for violation detection)
  BEFORE_STATE=$(cat "$PRD_FILE" 2>/dev/null || echo "{}")

  ITER_START=$(date +%s%N)

  # Compose the full prompt: CLAUDE.md + context.md
  FULL_PROMPT=$(mktemp)
  cat "$SCRIPT_DIR/CLAUDE.md" > "$FULL_PROMPT"
  echo "" >> "$FULL_PROMPT"
  echo "---" >> "$FULL_PROMPT"
  echo "" >> "$FULL_PROMPT"
  cat "$CONTEXT_FILE" >> "$FULL_PROMPT"

  # Run the selected tool with the composed prompt
  # Note: we capture output to variable AND print to stderr for orchestrator logging
  if [[ "$TOOL" == "amp" ]]; then
    OUTPUT=$(cat "$FULL_PROMPT" | amp --dangerously-allow-all 2>&1) || true
    print -r -- "$OUTPUT" >&2
  else
    # Claude Code: use --dangerously-skip-permissions for autonomous operation, --print for output
    OUTPUT=$(claude --dangerously-skip-permissions --print < "$FULL_PROMPT" 2>&1) || true
    print -r -- "$OUTPUT" >&2
  fi

  rm -f "$FULL_PROMPT"

  ITER_END=$(date +%s%N)
  ITER_TIME_MS=$(( (ITER_END - ITER_START) / 1000000 ))
  TOKENS=$(estimate_tokens "$OUTPUT")

  # Update metrics
  update_metrics "$ITER_TIME_MS" "$TOKENS" "$TARGET_STORY"

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    rm -f "$LAST_FAILURE_FILE"
    exit 0
  fi

  # Check if the target story now passes
  if check_story_passed "$TARGET_STORY"; then
    echo "  Story $TARGET_STORY marked as passed."

    # Check for single-story violation (agent marked multiple stories)
    if ! detect_multiple_passes "$TARGET_STORY" "$BEFORE_STATE"; then
      echo "  Single-story violation detected and corrected."
      increment_retry "$TARGET_STORY"
      # Continue to next iteration without running gates
    else
      # Run quality gates (typecheck, lint, test)
      if ! run_gates "$TARGET_STORY"; then
        echo "  Gates failed — reverting story to passes:false."
        revert_story "$TARGET_STORY" "gate failure"
        increment_retry "$TARGET_STORY"

        # Write failure diagnosis
        echo "## Gates Failed: $TARGET_STORY" > "$LAST_FAILURE_FILE"
        echo "One or more quality gates failed (typecheck/lint/test)." >> "$LAST_FAILURE_FILE"
        echo "Fix the issues and the next iteration will retry." >> "$LAST_FAILURE_FILE"
      else
        # Run verification if defined
        if ! verify_story "$TARGET_STORY"; then
          echo "  Verification failed — story reverted to passes:false."
          increment_retry "$TARGET_STORY"
        else
          # Success — clear failure file
          rm -f "$LAST_FAILURE_FILE"
        fi
      fi
    fi
  else
    echo "  Story $TARGET_STORY NOT marked as passed after iteration."
    increment_retry "$TARGET_STORY"

    # Save failure context for next iteration
    echo "## Iteration $i Failed: $TARGET_STORY" > "$LAST_FAILURE_FILE"
    echo "The agent attempted story $TARGET_STORY but did not mark it as passed." >> "$LAST_FAILURE_FILE"
    echo "" >> "$LAST_FAILURE_FILE"
    echo "### Agent Output (last 40 lines):" >> "$LAST_FAILURE_FILE"
    echo '```' >> "$LAST_FAILURE_FILE"
    echo "$OUTPUT" | tail -40 >> "$LAST_FAILURE_FILE"
    echo '```' >> "$LAST_FAILURE_FILE"
  fi

  echo "  Iteration $i complete (${ITER_TIME_MS}ms, ~${TOKENS} tokens). Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
exit 1
