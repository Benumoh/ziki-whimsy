// Showcase data for the issue-garden demo deploy only: spreads the demo
// workspace's issues across the growth stages, with one left wilting, so the
// garden has something of each to show. Runs once: the ready-to-merge issue
// it creates marks the work as done.
import { PrismaClient, type Status } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "zedu" }, select: { id: true } });
  if (!tenant) {
    console.log("Garden showcase skipped: demo workspace missing.");
    return;
  }
  if (await prisma.bug.count({ where: { tenantId: tenant.id, reviewStatus: "ready_to_merge" } })) {
    console.log("Garden showcase skipped: already planted.");
    return;
  }

  const bugs = await prisma.bug.findMany({
    where: { tenantId: tenant.id, isDeleted: false },
    orderBy: { number: "asc" },
    select: { id: true },
  });
  // The first issues stay as seeded (seeds and sprouts); the rest grow on.
  const plan: { status: Status; reviewStatus?: string; staleDays?: number }[] = [
    { status: "in_progress" },
    { status: "in_progress", reviewStatus: "ready_to_merge" },
    { status: "resolved" },
    { status: "closed" },
    { status: "open", staleDays: 20 },
  ];
  const growing = bugs.slice(Math.max(0, bugs.length - plan.length));
  for (const [index, bug] of growing.entries()) {
    const { status, reviewStatus, staleDays } = plan[index];
    await prisma.bug.update({ where: { id: bug.id }, data: { status, reviewStatus: reviewStatus ?? null } });
    if (staleDays) {
      await prisma.$executeRaw`UPDATE "Bug" SET "updatedAt" = now() - make_interval(days => ${staleDays}) WHERE id = ${bug.id}`;
    }
  }
  console.log(`Garden showcase: ${growing.length} issues grown on.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
