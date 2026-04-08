/**
 * DeviceType Service
 * Tầng Business Logic: CRUD cho bảng device_types.
 */
import prisma from "../config/prisma.js";

export async function createDeviceType(data: {
  name: string;
  description?: string;
}) {
  return prisma.deviceType.create({ data });
}

export async function getAllDeviceTypes() {
  return prisma.deviceType.findMany({ orderBy: { id: "asc" } });
}

export async function getDeviceTypeById(id: number) {
  return prisma.deviceType.findUnique({ where: { id } });
}

export async function updateDeviceType(
  id: number,
  data: {
    name?: string;
    description?: string;
  }
) {
  return prisma.deviceType.update({ where: { id }, data });
}

export async function deleteDeviceType(id: number) {
  return prisma.deviceType.delete({ where: { id } });
}
