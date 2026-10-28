"use client";

import { useEffect, useRef, useState } from "react";
import { AgentGraphic } from "@/components/agent-graphic";
import "@/components/crew/crew.css";

/**
 * The asking agent on its escalation: not idly waiting but drafting the
 * resolution (the incident commander below) until you respond, then, the
 * moment your answer lands (the page re-renders with it answered), it hops,
 * turns green and thanks you. Coming back to an already answered escalation
 * just shows it back at work.
 */
export function EscalationRobot({ name, level, answered }: { name: string; level: string | null; answered: boolean }) {
  const wasAnswered = useRef(answered);
  const [justAnswered, setJustAnswered] = useState(false);

  useEffect(() => {
    if (answered && !wasAnswered.current) {
      // Marked as seen only once the cheer starts, so an effect set up twice
      // (React's strict mode) still cheers.
      const cheer = window.setTimeout(() => {
        wasAnswered.current = true;
        setJustAnswered(true);
      }, 0);
      const settle = window.setTimeout(() => setJustAnswered(false), 4000);
      return () => {
        window.clearTimeout(cheer);
        window.clearTimeout(settle);
      };
    }
    wasAnswered.current = answered;
  }, [answered]);

  const says = justAnswered
    ? "Thanks! Back to it."
    : answered
      ? "Got your answer. On it."
      : "Not waiting around: I've drafted the fix below.";
  return (
    <div className="flex items-center gap-2.5" aria-live="polite">
      <span key={justAnswered ? "cheer" : "rest"} className={justAnswered ? "crew-hop" : "inline-flex"}>
        <AgentGraphic name={name} status="working" level={level} size={44} />
      </span>
      <span
        className={`rounded-xl rounded-bl-sm px-2.5 py-1 text-xs font-semibold ${
          answered ? "bg-zk-ok-bg text-zk-ok-fg" : "bg-zk-tint text-zk-accent"
        } ${justAnswered ? "crew-pop" : ""}`}
      >
        {says}
      </span>
    </div>
  );
}
