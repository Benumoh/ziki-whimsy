"use client";

import { useEffect, useState } from "react";
import { AgentGraphic } from "@/components/agent-graphic";
import type { AgentStatus } from "@/lib/dashboard-overview";
import { agentSays } from "./agent-says";
import "./crew.css";

/** How long a poke keeps the robot talking. */
const POKE_MS = 2600;

/**
 * An agent's robot you can poke: hover or focus it and it says what it's up
 * to; click it and it spins and says it out loud for a moment. The words are
 * also its accessible name, so the robot reads the same to everyone.
 */
export function PokeableAgent({
  name,
  status,
  level,
  activity,
  size = 30,
}: {
  name: string;
  status: AgentStatus;
  level?: string | null;
  activity: string;
  size?: number;
}) {
  const [poked, setPoked] = useState(0);
  const says = agentSays({ status, level, activity });

  useEffect(() => {
    if (!poked) return;
    const done = window.setTimeout(() => setPoked(0), POKE_MS);
    return () => window.clearTimeout(done);
  }, [poked]);

  return (
    <button
      type="button"
      onClick={() => setPoked(Date.now())}
      aria-label={`${name}: ${says}`}
      className="group relative inline-flex shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zk-accent"
    >
      <span key={poked} className={poked ? "crew-spin" : "inline-flex"}>
        <AgentGraphic name={name} status={status} level={level} size={size} />
      </span>
      <SpeechBubble says={says} show={Boolean(poked)} />
    </button>
  );
}

/** The robot's words over its head: on hover or focus of the surrounding group, or while poked. */
export function SpeechBubble({ says, show }: { says: string; show: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`crew-say rounded-xl rounded-bl-sm bg-deep-ocean px-2.5 py-1.5 text-left text-xs font-semibold text-white shadow-[0_8px_20px_rgba(11,23,51,0.25)] ${
        show ? "block" : "hidden group-hover:block group-focus-visible:block"
      }`}
    >
      {says}
    </span>
  );
}
