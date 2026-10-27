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
  await ensure("Pixel", "GPT", "reviewer", null);
  await ensure("Nova", "Gemini", "observer", null);

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
  console.log("Crew showcase: Rex, Pixel and Nova ready for Alice.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
