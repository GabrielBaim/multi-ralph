import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Opens a terminal in the given directory running `claude`.
 * Tries multiple terminal emulators in order of preference.
 * If ralphDir is provided, it's passed as context so the user knows
 * where to place prd.json for this specific loop.
 */
export function openTerminalWithClaude(projectDir: string, ralphDir?: string): boolean {
  const terminals = detectTerminals();
  if (terminals.length === 0) return false;

  const term = terminals[0];

  // Open terminal in ralphDir so user can create prd.json there
  // User will type 'claude' manually
  const targetDir = ralphDir || projectDir;

  try {
    let child;
    switch (term) {
      case "cosmic-term":
        child = spawn("cosmic-term", ["-e", "zsh"], {
          cwd: targetDir,
          stdio: "inherit",
        });
        break;
      case "gnome-terminal":
        child = spawn("gnome-terminal", [
          `--working-directory=${targetDir}`,
          "--",
          "zsh",
        ], {
          stdio: "inherit",
        });
        break;
      case "x-terminal-emulator":
        child = spawn("x-terminal-emulator", [
          "--working-directory",
          targetDir,
          "--",
          "zsh",
        ], {
          stdio: "inherit",
        });
        break;
      case "konsole":
        child = spawn("konsole", [
          "--workdir", targetDir,
          "-e", "zsh",
        ], {
          stdio: "inherit",
        });
        break;
      case "xfce4-terminal":
        child = spawn("xfce4-terminal", [
          `--working-directory=${targetDir}`,
          "-e", "zsh",
        ], {
          stdio: "inherit",
        });
        break;
      default:
        return false;
    }

    return true;
  } catch {
    return false;
  }
}

function detectTerminals(): string[] {
  const candidates = [
    "gnome-terminal",
    "cosmic-term",
    "konsole",
    "xfce4-terminal",
    "x-terminal-emulator",
  ];

  return candidates.filter((t) => {
    try {
      return existsSync(`/usr/bin/${t}`) || existsSync(`/usr/local/bin/${t}`);
    } catch {
      return false;
    }
  });
}
