import { GROWTH_PATH, growthLabels, growthMeanings, type Growth } from "@/lib/issue-garden";
import { IssuePlant } from "./issue-plant";

/**
 * The issue page's garden bed: the path from seed to bloom with this issue's
 * plant raised and the ones it has grown past shown small. A closed issue
 * shows its fallen leaf instead; a stale one wilts and says for how long.
 */
export function GardenBed({ growth, wiltingDays }: { growth: Growth; wiltingDays: number | null }) {
  const wilting = wiltingDays !== null;
  const reached = GROWTH_PATH.indexOf(growth);

  return (
    <section
      aria-label="Issue growth"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-zk-border bg-zk-surface px-3 py-2"
    >
      <ol className="flex items-end gap-1" aria-hidden="true">
        {growth === "fallen" ? (
          <li>
            <IssuePlant growth="fallen" size={40} />
          </li>
        ) : (
          GROWTH_PATH.map((step, index) => {
            const current = step === growth;
            return (
              <li key={step} className={current ? "garden-pop" : index > reached ? "opacity-25 grayscale" : "opacity-70"}>
                <IssuePlant growth={step} wilting={current && wilting} size={current ? 40 : 22} animate={current} />
              </li>
            );
          })
        )}
      </ol>
      <p className="min-w-0 text-sm">
        <span className="font-bold text-zk-text">{growthLabels[growth]}</span>
        <span className="text-zk-text2">: {growthMeanings[growth]}.</span>
        {wilting ? (
          <span className="block text-xs font-semibold text-zk-warn-fg">
            Wilting: no activity for {wiltingDays} days. A comment or an update waters it.
          </span>
        ) : null}
      </p>
    </section>
  );
}
