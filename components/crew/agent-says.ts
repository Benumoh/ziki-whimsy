import { agentTaskVerb } from "@/components/agent-graphic";
import type { AgentStatus } from "@/lib/dashboard-overview";

/**
 * What a robot says when you hover, focus or poke it: its real state in its
 * own voice. A working agent names its job and the issue ("Fixing #12 CSV
 * export…"), using the activity the server already worded.
 */
export function agentSays({
  status,
  level,
  activity,
}: {
  status: AgentStatus;
  level?: string | null;
  activity: string;
}): string {
  switch (status) {
    case "working": {
      const task = activity.replace(/^Working on\s+/, "");
      return task === activity ? `${agentTaskVerb(level)}…` : `${agentTaskVerb(level)} ${task}`;
    }
    case "waiting":
      return "I've got a question for you!";
    case "idle":
      return "Standing by. Got anything for me?";
    default:
      return "Zzz… napping. Wake me with some work.";
  }
}
