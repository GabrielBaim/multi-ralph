export interface RalphLoop {
  id: string;
  name: string;
  projectDir: string;
  ralphDir: string;
  tool: "amp" | "claude";
  maxIterations: number;
  status: "idle" | "running" | "completed" | "failed" | "stopped";
  pid: number | null;
  currentIteration: number;
  prd: NormalizedPrd | null;
  progressLog: string;
  startedAt: string | null;
  output: string[];
  // Notification hooks
  onComplete?: OnCompleteHook;
  // Metrics
  metrics: LoopMetrics;
  // Last error message (from failed start or process crash)
  lastError: string | null;
}

export interface OnCompleteHook {
  type: "webhook" | "shell";
  value: string; // URL or shell command
}

export interface LoopMetrics {
  iterationTimes: number[];        // ms per iteration
  storyAttempts: Record<string, number>; // storyId → attempt count
  tokensPerIteration: number[];    // tokens estimated per iteration
  totalTokens: number;
  estimatedCostUsd: number;
  // TDD & Agile metrics
  testCoverage?: number;           // percentage (0-100)
  testFirstCompliance?: number;    // percentage of stories where tests written first
  failureReasons: Record<string, number>; // category → count
  velocity: number;                // stories completed per iteration
  cumulativeFlowData: CumulativeFlowPoint[]; // for CFD visualization
  timePerStory: Record<string, number>; // storyId → ms spent
  rollbackCount: number;           // number of rollback/undo operations
  storiesCompleted: number;        // total stories marked as passing
  storiesInProgress: number;       // stories currently being worked on
}

export interface CumulativeFlowPoint {
  timestamp: string;               // ISO timestamp
  todo: number;                    // stories in todo
  inProgress: number;              // stories in progress
  done: number;                    // stories completed
  blocked: number;                 // stories blocked
}

export interface NormalizedPrd {
  project: string;
  branchName: string;
  description: string;
  stories: PrdStory[];
}

export interface PrdStory {
  id: string;
  title: string;
  passes: boolean;
  priority: number;
  dependsOn?: string[];
  verification?: StoryVerification;
}

export interface StoryVerification {
  command: string;
  expect?: string; // default "exit 0"
}

export interface LoopCreateInput {
  projectDir: string;
  name: string;
  tool: "amp" | "claude";
  maxIterations: number;
}

export type SSEEvent =
  | { type: "loop-update"; loopId: string }
  | { type: "board-update" }
  | { type: "log-update"; loopId: string };
