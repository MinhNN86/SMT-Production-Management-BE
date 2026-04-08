/**
 * TeamMember Service
 * Tầng Business Logic: Quản lý thành viên team (team_members).
 */
import prisma from "../config/prisma.js";

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

function normalizeWorkerIds(workerIds: string[]) {
  return [...new Set(workerIds)].filter((id) => id && id.length > 0);
}

export async function addMembersToTeam(teamId: number, workerIds: string[]) {
  const normalizedWorkerIds = normalizeWorkerIds(workerIds);

  await prisma.teamMember.createMany({
    data: normalizedWorkerIds.map((workerId) => ({ teamId, workerId })),
    skipDuplicates: true,
  });

  return listMembersByTeam(teamId);
}

export async function replaceTeamMembers(teamId: number, workerIds: string[]) {
  const normalizedWorkerIds = normalizeWorkerIds(workerIds);

  await prisma.$transaction(async (tx) => {
    if (normalizedWorkerIds.length === 0) {
      await tx.teamMember.deleteMany({ where: { teamId } });
      return;
    }

    await tx.teamMember.deleteMany({
      where: {
        teamId,
        workerId: { notIn: normalizedWorkerIds },
      },
    });

    await tx.teamMember.createMany({
      data: normalizedWorkerIds.map((workerId) => ({ teamId, workerId })),
      skipDuplicates: true,
    });
  });

  return listMembersByTeam(teamId);
}

export async function removeMemberFromTeam(teamId: number, workerId: string) {
  return prisma.teamMember.delete({
    where: {
      teamId_workerId: {
        teamId,
        workerId,
      },
    },
  });
}

export async function listMembersByTeam(teamId: number) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    orderBy: { id: "asc" },
    include: {
      worker: {
        select: {
          id: true,
          workerCode: true,
          fullName: true,
          type: true,
          email: true,
          role: true,
        },
      },
    },
  });
  return members.map((item: any) => ({
    ...item,
    joinedAt: formatDate(item.joinedAt),
  }));
}
