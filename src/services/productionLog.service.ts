/**
 * ProductionLog Service
 * Tầng Business Logic: Xử lý nhập báo cáo sản lượng (production_logs).
 *
 * Sử dụng UPSERT: Nếu đã có record cho (order, stage, shift, date)
 * thì cập nhật, nếu chưa thì tạo mới.
 */
import prisma from "../config/prisma.js";
import * as stageService from "./stage.service.js";

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

function formatProductionLogDates(log: any) {
  return {
    ...log,
    logDate: formatDate(log.logDate),
    createdAt: formatDate(log.createdAt),
  };
}

// ==========================================
// UPSERT BÁO CÁO SẢN LƯỢNG
// Tạo mới hoặc cập nhật nếu đã tồn tại
// ==========================================
export async function upsertProductionLog(data: {
  productionOrderId: number;
  stageId: number;
  shiftId: number;
  logDate: string; // Format: "YYYY-MM-DD"
  actualQuantity: number;
  defectiveQuantity?: number;
  note?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const productionOrder = await tx.productionOrder.findUnique({
      where: { id: data.productionOrderId },
    });

    if (!productionOrder) {
      throw new Error("ProductionOrder not found");
    }

    const existingLogs = await tx.productionLog.findMany({
      where: {
        productionOrderId: data.productionOrderId,
        stageId: data.stageId,
        NOT: {
          stageId: data.stageId,
          shiftId: data.shiftId,
          logDate: new Date(data.logDate),
        },
      },
    });

    const totalExistingQuantity = existingLogs.reduce((sum, log) => sum + log.actualQuantity, 0);
    const newTotalQuantity = totalExistingQuantity + data.actualQuantity;

    if (newTotalQuantity > productionOrder.totalQuantity) {
      throw new Error(`Tổng số lượng báo cáo của khâu (${newTotalQuantity}) vượt quá số lượng kế hoạch (${productionOrder.totalQuantity})`);
    }

    const upsertResult = await tx.productionLog.upsert({
      where: {
        productionOrderId_stageId_shiftId_logDate: {
          productionOrderId: data.productionOrderId,
          stageId: data.stageId,
          shiftId: data.shiftId,
          logDate: new Date(data.logDate),
        },
      },
      update: {
        actualQuantity: data.actualQuantity,
        defectiveQuantity: data.defectiveQuantity ?? 0,
        note: data.note,
      },
      create: {
        productionOrderId: data.productionOrderId,
        stageId: data.stageId,
        shiftId: data.shiftId,
        logDate: new Date(data.logDate),
        actualQuantity: data.actualQuantity,
        defectiveQuantity: data.defectiveQuantity ?? 0,
        note: data.note,
      },
      include: {
        productionOrder: true,
        stage: true,
        shift: true,
      },
    });

    return upsertResult;
  });

  return formatProductionLogDates(result);
}

// ==========================================
// LẤY DANH SÁCH BÁO CÁO (hỗ trợ lọc)
// ==========================================
export async function getProductionLogs(filters: {
  productionOrderId?: number;
  stageId?: number;
  shiftId?: number;
  logDate?: string;
}) {
  const logs = await prisma.productionLog.findMany({
    where: {
      ...(filters.productionOrderId && { productionOrderId: filters.productionOrderId }),
      ...(filters.stageId && { stageId: filters.stageId }),
      ...(filters.shiftId && { shiftId: filters.shiftId }),
      ...(filters.logDate && { logDate: new Date(filters.logDate) }),
    },
    include: {
      productionOrder: true,
      stage: true,
      shift: true,
    },
    orderBy: [{ logDate: "desc" }, { shiftId: "asc" }, { stageId: "asc" }],
  });
  return logs.map(formatProductionLogDates);
}

// ==========================================
// XÓA BÁO CÁO SẢN LƯỢNG THEO ID
// Xóa cả production_logs và work_assignments vì 2 bảng liên kết với nhau
// ==========================================
export async function deleteProductionLogById(id: number) {
  // Sử dụng transaction để đảm bảo xóa cả 2 bảng cùng lúc
  const result = await prisma.$transaction(async (tx) => {
    // Tìm production log để lấy thông tin cần thiết
    const productionLog = await tx.productionLog.findUnique({
      where: { id },
    });

    if (!productionLog) {
      throw new Error("Production log not found");
    }

    // Xóa từ bảng work_assignments trước
    const workAssignmentsResult = await tx.workAssignment.deleteMany({
      where: {
        productionOrderId: productionLog.productionOrderId,
        stageId: productionLog.stageId,
        shiftId: productionLog.shiftId,
        workDate: productionLog.logDate,
      },
    });

    // Xóa từ bảng production_logs
    await tx.productionLog.delete({
      where: { id },
    });

    return {
      workAssignmentsDeleted: workAssignmentsResult.count,
      productionLogDeleted: 1,
      totalDeleted: workAssignmentsResult.count + 1,
    };
  });

  return result;
}

// ==========================================
// CẬP NHẬT BÁO CÁO SẢN LƯỢNG THEO ID
// Không cho phép cập nhật productionOrderId
// ==========================================
export async function updateProductionLog(id: number, data: {
  stageId?: number;
  shiftId?: number;
  logDate?: string;
  actualQuantity?: number;
  defectiveQuantity?: number;
  note?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const existingLog = await tx.productionLog.findUnique({
      where: { id },
      include: { productionOrder: true },
    });

    if (!existingLog) {
      throw new Error("ProductionLog not found");
    }

    const productionOrder = existingLog.productionOrder;

    if (data.actualQuantity !== undefined) {
      const otherLogs = await tx.productionLog.findMany({
        where: {
          productionOrderId: productionOrder.id,
          stageId: existingLog.stageId,
          NOT: { id },
        },
      });

      const totalOtherQuantity = otherLogs.reduce((sum, log) => sum + log.actualQuantity, 0);
      const newTotalQuantity = totalOtherQuantity + data.actualQuantity;

      if (newTotalQuantity > productionOrder.totalQuantity) {
        throw new Error(`Tổng số lượng báo cáo của khâu (${newTotalQuantity}) vượt quá số lượng kế hoạch (${productionOrder.totalQuantity})`);
      }
    }

    const updateResult = await tx.productionLog.update({
      where: { id },
      data: {
        stageId: data.stageId,
        shiftId: data.shiftId,
        logDate: data.logDate ? new Date(data.logDate) : undefined,
        actualQuantity: data.actualQuantity,
        defectiveQuantity: data.defectiveQuantity,
        note: data.note,
      },
      include: {
        productionOrder: true,
        stage: true,
        shift: true,
      },
    });

    return updateResult;
  });

  return formatProductionLogDates(result);
}

// ==========================================
// BULK UPSERT BÁO CÁO SẢN LƯỢNG
// Nhập hàng loạt production logs cho các khâu con của một khâu cha
// ==========================================
export async function bulkUpsertProductionLogs(data: {
  productionOrderId: number;
  parentStageId: number;
  logDate: string;
  logs: Array<{
    stageId: number;
    shiftId: number;
    actualQuantity: number;
    defectiveQuantity?: number;
    note?: string;
  }>;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const productionOrder = await tx.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      select: { id: true, totalQuantity: true, orderCode: true },
    });

    if (!productionOrder) {
      throw new Error("ProductionOrder not found");
    }

    const parentStage = await tx.stage.findUnique({
      where: { id: data.parentStageId },
      select: { id: true, name: true },
    });

    if (!parentStage) {
      throw new Error("ParentStage not found");
    }

    const childStageIds = await stageService.getChildStages(data.parentStageId);

    for (const log of data.logs) {
      if (!childStageIds.includes(log.stageId)) {
        const stage = await tx.stage.findUnique({
          where: { id: log.stageId },
          select: { name: true },
        });
        const stageName = stage?.name || `ID ${log.stageId}`;
        throw new Error(`Khâu "${stageName}" không phải là con trực tiếp của khâu "${parentStage.name}"`);
      }

      await tx.shift.findUniqueOrThrow({
        where: { id: log.shiftId },
      });
    }

    const stageQuantities = new Map<number, number>();
    for (const log of data.logs) {
      const currentQty = stageQuantities.get(log.stageId) || 0;
      stageQuantities.set(log.stageId, currentQty + log.actualQuantity);
    }

    for (const [stageId, newQuantity] of stageQuantities.entries()) {
      const existingLogs = await tx.productionLog.findMany({
        where: {
          productionOrderId: data.productionOrderId,
          stageId: stageId,
          NOT: {
            stageId: stageId,
            shiftId: data.logs.find((l) => l.stageId === stageId)?.shiftId,
            logDate: new Date(data.logDate),
          },
        },
      });

      const existingQuantity = existingLogs.reduce((sum, log) => sum + log.actualQuantity, 0);
      const totalQuantity = existingQuantity + newQuantity;

      if (totalQuantity > productionOrder.totalQuantity) {
        const stage = await tx.stage.findUnique({
          where: { id: stageId },
          select: { name: true },
        });
        const stageName = stage?.name || `ID ${stageId}`;
        throw new Error(`Tổng số lượng báo cáo của khâu "${stageName}" (${totalQuantity}) vượt quá số lượng kế hoạch (${productionOrder.totalQuantity})`);
      }
    }

    const createdLogs: any[] = [];
    const updatedLogs: any[] = [];

    for (const log of data.logs) {
      const existingLog = await tx.productionLog.findUnique({
        where: {
          productionOrderId_stageId_shiftId_logDate: {
            productionOrderId: data.productionOrderId,
            stageId: log.stageId,
            shiftId: log.shiftId,
            logDate: new Date(data.logDate),
          },
        },
        select: { id: true },
      });

      const upsertResult = await tx.productionLog.upsert({
        where: {
          productionOrderId_stageId_shiftId_logDate: {
            productionOrderId: data.productionOrderId,
            stageId: log.stageId,
            shiftId: log.shiftId,
            logDate: new Date(data.logDate),
          },
        },
        update: {
          actualQuantity: log.actualQuantity,
          defectiveQuantity: log.defectiveQuantity ?? 0,
          note: log.note,
        },
        create: {
          productionOrderId: data.productionOrderId,
          stageId: log.stageId,
          shiftId: log.shiftId,
          logDate: new Date(data.logDate),
          actualQuantity: log.actualQuantity,
          defectiveQuantity: log.defectiveQuantity ?? 0,
          note: log.note,
        },
        include: {
          productionOrder: true,
          stage: true,
          shift: true,
        },
      });

      if (existingLog) {
        updatedLogs.push(formatProductionLogDates(upsertResult));
      } else {
        createdLogs.push(formatProductionLogDates(upsertResult));
      }
    }

    return {
      created: createdLogs,
      updated: updatedLogs,
      totalProcessed: createdLogs.length + updatedLogs.length,
    };
  });

  return result;
}
