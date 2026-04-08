/**
 * Team Service
 * Tầng Business Logic: CRUD cho bảng teams.
 */
import prisma from "../config/prisma.js";

export async function createTeam(data: {
  teamName: string;
  description?: string;
}) {
  return prisma.team.create({ data });
}

export async function getAllTeams() {
  return prisma.team.findMany({ orderBy: { id: "asc" } });
}

export async function getTeamById(id: number) {
  return prisma.team.findUnique({ where: { id } });
}

export async function updateTeam(
  id: number,
  data: {
    teamName?: string;
    description?: string;
  }
) {
  return prisma.team.update({ where: { id }, data });
}

export async function deleteTeam(id: number) {
  return prisma.team.delete({ where: { id } });
}
