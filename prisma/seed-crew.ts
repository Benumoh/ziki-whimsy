// Showcase data for the agent-crew demo deploy only: gives the demo owner
// (Alice) a few agents so the robot moods show. Idempotent: only adds what
// is missing, and does nothing when the demo workspace isn't there.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const alice = await prisma.user.findUnique({ where: { email: "alice@zendor.dev" }, select: { id: true } });
  const tenant = await prisma.tenant.findUnique({ where: { slug: "zedu" }, select: { id: true } });
  if (!alice || !tenant) {
    console.log("Crew showcase skipped: demo owner or workspace missing.");
    return;
  }
  const project = await prisma.project.findFirst({ where: { tenantId: tenant.id }, select: { id: true } });
  const bug = await prisma.bug.findFirst({ where: { tenantId: tenant.id }, orderBy: { createdAt: "asc" }, select: { id: true } });

  // One agent per owner per project, so only Rex is tied to the project.
  const ensure = async (name: string, model: string, level: "contributor" | "reviewer" | "observer", defaultProjectId: string | null) =>
    (await prisma.agent.findFirst({ where: { ownerUserId: alice.id, name } })) ??
    prisma.agent.create({ data: { tenantId: tenant.id, ownerUserId: alice.id, name, model, level, defaultProjectId } });

  const rex = await ensure("Rex", "Claude", "contributor", project?.id ?? null);
  const pixel = await ensure("Pixel", "GPT", "reviewer", null);
  await ensure("Nova", "Gemini", "observer", null);

  // One escalation of each kind for the incident commander, and some answered
  // ones so its look back has history. Fixed ids, so a rebuild adds nothing twice.
  const bugs = await prisma.bug.findMany({
    where: { tenantId: tenant.id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { id: true, title: true },
  });
  const issue = (i: number) => bugs[i % Math.max(bugs.length, 1)] ?? null;
  const about = (i: number) => (issue(i) ? `"${issue(i)!.title}"` : "this issue");
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);
  const showcase = [
    { id: "showcase-esc-1", agentId: rex.id, bug: 1, minutes: 5, body: `Should I raise the session limit to 30 minutes or add a silent token refresh? I'd pick the silent token refresh: nobody gets logged out mid-form.` },
    { id: "showcase-esc-2", agentId: rex.id, bug: 2, minutes: 20, body: `[blocker] I'm stuck on ${about(2)}: reproducing it needs a Windows runner and CI doesn't have one.` },
    { id: "showcase-esc-3", agentId: rex.id, bug: null, minutes: 40, body: "Should I focus on search, filters or the export first?" },
    { id: "showcase-esc-4", agentId: pixel.id, bug: 3, minutes: 60, body: `[work_authorization] May I start work on ${about(3)}? It touches a shared script.` },
    { id: "showcase-esc-5", agentId: pixel.id, bug: 4, minutes: 120, body: `[scope_change] ${about(4)} would be nicer with a settings page too. Should I add that to this issue?` },
    { id: "showcase-esc-6", agentId: pixel.id, bug: 5, minutes: 180, body: `[human_approval] The fix for ${about(5)} is ready and tested. Please approve before I merge.` },
  ];
  const answered = [
    { id: "showcase-esc-past-1", minutes: 2 * 24 * 60, replyAfter: 8, body: "[question] Should the search box remember queries per project or globally?", answer: "Per project, please." },
    { id: "showcase-esc-past-2", minutes: 24 * 60, replyAfter: 25, body: "[work_authorization] May I tidy the notification styles?", answer: "Yes, go ahead. Keep it small." },
    { id: "showcase-esc-past-3", minutes: 6 * 60, replyAfter: 12, body: "[question] Toast or inline message for saved settings?", answer: "Inline. Toasts get missed." },
  ];
  await prisma.agentQuestion.createMany({
    skipDuplicates: true,
    data: [
      ...showcase.map((q) => ({
        id: q.id,
        agentId: q.agentId,
        ownerUserId: alice.id,
        bugId: q.bug === null ? null : (issue(q.bug)?.id ?? null),
        body: q.body,
        createdAt: ago(q.minutes),
      })),
      ...answered.map((q) => ({
        id: q.id,
        agentId: pixel.id,
        ownerUserId: alice.id,
        body: q.body,
        answer: q.answer,
        createdAt: ago(q.minutes),
        answeredAt: ago(q.minutes - q.replyAfter),
      })),
    ],
  });

  if ((await prisma.agentQuestion.count({ where: { agentId: rex.id } })) === 0) {
    await prisma.agentQuestion.create({
      data: {
        agentId: rex.id,
        ownerUserId: alice.id,
        bugId: bug?.id ?? null,
        body: "Should I start with the login timeout or the CSV export? I'd pick the timeout: more people hit it.",
      },
    });
  }
  console.log("Crew showcase: Rex, Pixel and Nova ready for Alice, with escalations for the incident commander.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
