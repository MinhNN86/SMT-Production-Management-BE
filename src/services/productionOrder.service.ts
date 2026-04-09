/**
 * ProductionOrder Service
 * Tầng Business Logic: Xử lý CRUD cho bảng lệnh sản xuất (production_orders).
 */
import prisma from "../config/prisma.js";
import type { ProductionOrderStatus } from "../../generated/prisma/client.js";

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

function formatProductionOrderDates(order: any) {
  return {
    ...order,
    orderSignedDate: formatDate(order.orderSignedDate),
    productionStartDate: formatDate(order.productionStartDate),
    completedDate: formatDate(order.completedDate),
    deadlineDate: formatDate(order.deadlineDate),
    createdAt: formatDate(order.createdAt),
  };
}

function formatProductionLogDates(log: any) {
  return {
    ...log,
    logDate: formatDate(log.logDate),
    createdAt: formatDate(log.createdAt),
  };
}

// ==========================================
// TẠO LỆNH SẢN XUẤT MỚI
// ==========================================
export async function createProductionOrder(data: {
  orderCode: string;
  totalQuantity: number;
  orderSignedDate?: Date;
  productionStartDate?: Date;
  completedDate?: Date;
  deadlineDate: Date;
  deviceTypeId: number;
}) {
  const result = await prisma.productionOrder.create({
    data,
    include: {
      deviceType: {
        select: { id: true, name: true },
      },
    },
  });
  return formatProductionOrderDates(result);
}

// ==========================================
// LẤY DANH SÁCH LỆNH SẢN XUẤT
// ==========================================
export async function getAllProductionOrders() {
  const orders = await prisma.productionOrder.findMany({
    include: {
      deviceType: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" }, // Sắp xếp theo ngày tạo mới nhất
  });
  return orders.map(formatProductionOrderDates);
}

// ==========================================
// LẤY CHI TIẾT 1 LỆNH SẢN XUẤT THEO ID
// ==========================================
export async function getProductionOrderById(id: number) {
  const order = await prisma.productionOrder.findUnique({
    where: { id },
    include: {
      deviceType: {
        select: { id: true, name: true },
      },
    },
  });
  return order ? formatProductionOrderDates(order) : null;
}

// ==========================================
// CẬP NHẬT LỆNH SẢN XUẤT
// ==========================================
export async function updateProductionOrder(
  id: number,
  data: {
    orderCode?: string;
    totalQuantity?: number;
    orderSignedDate?: Date;
    productionStartDate?: Date;
    completedDate?: Date;
    deadlineDate?: Date;
    deviceTypeId?: number | null;
    status?: ProductionOrderStatus;
  }
) {
  const result = await prisma.productionOrder.update({
    where: { id },
    data,
    include: {
      deviceType: {
        select: { id: true, name: true },
      },
    },
  });
  return formatProductionOrderDates(result);
}

// ==========================================
// XÓA LỆNH SẢN XUẤT
// ==========================================
export async function deleteProductionOrder(id: number) {
  return prisma.productionOrder.delete({ where: { id } });
}

// ==========================================
// LẤY DANH SÁCH NHẬT KÝ SẢN XUẤT THEO LỆNH SẢN XUẤT
// ==========================================
export async function getProductionLogsByOrderId(productionOrderId: number) {
  const logs = await prisma.productionLog.findMany({
    where: { productionOrderId },
    include: {
      stage: true,
      shift: true,
    },
    orderBy: [
      { logDate: "desc" },
      { shiftId: "asc" },
      { stageId: "asc" },
    ],
  });
  return logs.map(formatProductionLogDates);
}

// ==========================================
// LỌC NHẬT KÝ SẢN XUẤT CÓ CÁC TIÊU CHÍ
// ==========================================
export async function getProductionLogsWithFilters(filters: {
  productionOrderId?: number;
  logDate?: Date | { gte?: Date; lte?: Date };
  shiftId?: number | { in?: number[] };
}) {
  const where: any = {};

  if (filters.productionOrderId) {
    where.productionOrderId = filters.productionOrderId;
  }

  if (filters.logDate) {
    where.logDate = filters.logDate;
  }

  if (filters.shiftId) {
    where.shiftId = filters.shiftId;
  }

  const logs = await prisma.productionLog.findMany({
    where,
    include: {
      stage: true,
      shift: true,
    },
    orderBy: [
      { logDate: "desc" },
      { shiftId: "asc" },
      { stageId: "asc" },
    ],
  });
  return logs.map(formatProductionLogDates);
}
