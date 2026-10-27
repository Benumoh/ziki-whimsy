import Link from "next/link";
import { GROWTH_PATH, growthLabels, type Growth } from "@/lib/issue-garden";
import { IssuePlant } from "./issue-plant";

export type GardenCounts = Record<Growth, number> & { wilting: number };

/**
 * The dashboard's garden: how many of the workspace's issues sit at each
 * growth stage, seed to bloom, and how many are wilting from neglect.
 */
export function WorkspaceGarden({ counts }: { counts: GardenCounts }) {
  const total = GROWTH_PATH.reduce((sum, growth) => sum + counts[growth], 0);
  return (
    <section aria-labelledby="workspace-garden-heading" className="rounded-[20px] border border-zk-border bg-zk-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="workspace-garden-heading" className="text-lg font-bold text-zk-text">
          Workspace garden
        </h2>
        <p className="text-[13px] text-zk-muted">
          Every issue grows from seed to bloom as it moves forward.
        </p>
      </div>
      {total === 0 ? (
        <p className="mt-4 text-sm text-zk-muted">
          Nothing planted yet. <Link href="/issues/new" className="font-bold text-zk-accent hover:underline">Report an issue</Link> to sow the first seed.
        </p>
      ) : (
        <>
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {GROWTH_PATH.map((growth) => (
              <li key={growth} className="flex flex-col items-center gap-1 rounded-2xl bg-zk-bg px-2 py-3 text-center">
                <IssuePlant growth={growth} size={44} animate={counts[growth] > 0} />
                <span className="text-xl font-extrabold tabular-nums text-zk-text">{counts[growth]}</span>
                <span className="text-xs font-semibold text-zk-text2">{growthLabels[growth]}</span>
              </li>
            ))}
          </ul>
          {counts.wilting > 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-zk-warn-fg">
              <IssuePlant growth="sprout" wilting size={22} />
              {counts.wilting === 1 ? "1 issue is" : `${counts.wilting} issues are`} wilting: no activity for two weeks or more.
            </p>
          ) : (
            <p className="mt-3 text-sm text-zk-ok-fg">Everything is watered. No issue has gone two weeks without activity.</p>
          )}
        </>
      )}
    </section>
  );
}
