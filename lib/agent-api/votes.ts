import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AgentContext } from "@/lib/agents/require-agent";
import { IssueApiError } from "@/lib/agent-api/issues";
import { publish } from "@/lib/agent-api/events";
import { reconcileVoteCount } from "@/lib/voting";

const id = z.string().trim().min(1).max(191);

/** Optional body. `projectId` may also arrive as a query parameter. */
export const voteSchema = z.object({ projectId: id.optional() }).strict();

type Tx = Prisma.TransactionClient;

export type AgentVoteResult = {
  voted: boolean;
  voteCount: number;
  /** True when this call changed the owner's vote. A repeat is false. */
  changed: boolean;
};

async function lockedIssue(tx: Tx, caller: AgentContext, projectId: string, bugId: string) {
  const locked = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "Bug"
    WHERE "id" = ${bugId}
      AND "tenantId" = ${caller.tenantId}
      AND "projectId" = ${projectId}
      AND "isDeleted" = false
    FOR NO KEY UPDATE
  `;
  if (!locked.length) throw new IssueApiError(404, "Issue not found in this project.");
}

async function recount(tx: Tx, bugId: string): Promise<number> {
  const groups = await tx.vote.groupBy({
    by: ["value"],
    where: { bugId },
    _count: { _all: true },
  });
  let likes = 0;
  let dislikes = 0;
  for (const group of groups) {
    if (group.value === 1) likes = group._count._all;
    if (group.value === -1) dislikes = group._count._all;
  }
  const voteCount = reconcileVoteCount(likes, dislikes);
  await tx.bug.update({ where: { id: bugId }, data: { voteCount } });
  return voteCount;
}

/**
 * Records the agent's owner as an upvote. One person, one vote: another agent
 * of the same owner does not add a second upvote. Repeating the call leaves
 * the count unchanged.
 */
export async function upvoteIssue(
  caller: AgentContext,
  projectId: string,
  bugId: string,
): Promise<AgentVoteResult> {
  return prisma.$transaction(async (tx) => {
    await lockedIssue(tx, caller, projectId, bugId);
    const existing = await tx.vote.findUnique({
      where: { userId_bugId: { userId: caller.ownerId, bugId } },
    });
    if (existing?.value === 1) {
      const issue = await tx.bug.findUnique({ where: { id: bugId }, select: { voteCount: true } });
      return { voted: true, voteCount: issue?.voteCount ?? 0, changed: false };
    }
    if (existing) {
      await tx.vote.update({ where: { id: existing.id }, data: { value: 1 } });
    } else {
      await tx.vote.create({ data: { userId: caller.ownerId, bugId, value: 1 } });
    }
    const voteCount = await recount(tx, bugId);
    await publish(tx, {
      tenantId: caller.tenantId,
      type: "issue.voted",
      actorAgentId: caller.agentId,
      bugId,
      payload: { issueId: bugId, projectId, userId: caller.ownerId, voteCount, voted: true },
    });
    return { voted: true, voteCount, changed: true };
  });
}

/** Removes the owner's upvote. Repeating the call when there is none is a no-op. */
export async function removeUpvote(
  caller: AgentContext,
  projectId: string,
  bugId: string,
): Promise<AgentVoteResult> {
  return prisma.$transaction(async (tx) => {
    await lockedIssue(tx, caller, projectId, bugId);
    const existing = await tx.vote.findUnique({
      where: { userId_bugId: { userId: caller.ownerId, bugId } },
    });
    if (!existing) {
      const issue = await tx.bug.findUnique({ where: { id: bugId }, select: { voteCount: true } });
      return { voted: false, voteCount: issue?.voteCount ?? 0, changed: false };
    }
    await tx.vote.delete({ where: { id: existing.id } });
    const voteCount = await recount(tx, bugId);
    await publish(tx, {
      tenantId: caller.tenantId,
      type: "issue.voted",
      actorAgentId: caller.agentId,
      bugId,
      payload: { issueId: bugId, projectId, userId: caller.ownerId, voteCount, voted: false },
    });
    return { voted: false, voteCount, changed: true };
  });
}
