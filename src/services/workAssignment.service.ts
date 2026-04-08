/**
 * WorkAssignment Service
 * Tầng Business Logic: Xử lý phân công nhân sự vào khâu làm việc.
 *
 * ⚠️ LOGIC QUAN TRỌNG:
 * Sau khi tạo phân công, hệ thống đếm tổng số worker đã gán
 * cho cùng (production_order_id, stage_id, shift_id, work_date).
 * Nếu tổng < 3 → trả về cảnh báo.
 */
import prisma from "../config/prisma.js";

// Ngưỡng tối thiểu worker cho 1 khâu trong 1 ca
const MIN_WORKERS_PER_STAGE_SHIFT = 3;

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).toISOString();
}

function normalizeWorkerIds(workerIds: string[]) {
  return [...new Set(workerIds)].filter((id) => id && id.length > 0);
}

// ==========================================
// TẠO PHÂN CÔNG NHÂN SỰ MỚI
// Trả về kết quả kèm cảnh báo nếu số worker < 3
// ==========================================
export async function createWorkAssignments(data: {
  productionOrderId: number;
  stageId: number;
  shiftId: number;
  workerIds: string[];
  workDate: string; // Format: "YYYY-MM-DD"
}) {
  const normalizedWorkerIds = normalizeWorkerIds(data.workerIds);

  await prisma.workAssignment.createMany({
    data: normalizedWorkerIds.map((workerId) => ({
      productionOrderId: data.productionOrderId,
      stageId: data.stageId,
      shiftId: data.shiftId,
      workerId,
      workDate: new Date(data.workDate),
    })),
    skipDuplicates: true,
  });

  const assignments = await prisma.workAssignment.findMany({
    where: {
      productionOrderId: data.productionOrderId,
      stageId: data.stageId,
      shiftId: data.shiftId,
      workDate: new Date(data.workDate),
      workerId: { in: normalizedWorkerIds },
    },
    include: {
      productionOrder: true,
      stage: true,
      shift: true,
      worker: true,
    },
    orderBy: { id: "asc" },
  });

  const formattedAssignments = assignments.map((item: any) => ({
    ...item,
    workDate: formatDate(item.workDate),
  }));

  const assignedWorkerIds = new Set(assignments.map((item) => item.workerId));
  const missingWorkerIds = normalizedWorkerIds.filter((id) => !assignedWorkerIds.has(id));
  if (missingWorkerIds.length > 0) {
    const conflictError = new Error("Một số worker không thể phân công do đã có ca khác cùng ngày.");
    (conflictError as any).code = "WORKER_CONFLICT";
    (conflictError as any).workerIds = missingWorkerIds;
    throw conflictError;
  }

  // Đếm tổng worker hiện tại cho cùng (order, stage, shift, date)
  const workerCount = await countWorkersInStageShift(
    data.productionOrderId,
    data.stageId,
    data.shiftId,
    data.workDate
  );

  // Kiểm tra và tạo cảnh báo nếu chưa đủ tối thiểu
  let warning: string | null = null;
  const firstAssignment = assignments[0];
  if (workerCount < MIN_WORKERS_PER_STAGE_SHIFT && firstAssignment) {
    warning = `⚠️ Cảnh báo: Khâu "${firstAssignment.stage.name}" trong ca "${firstAssignment.shift.shiftName}" ngày ${data.workDate} hiện chỉ có ${workerCount} worker (yêu cầu tối thiểu ${MIN_WORKERS_PER_STAGE_SHIFT} người).`;
  }

  return { assignments: formattedAssignments, workerCount, warning };
}

// ==========================================
// CẬP NHẬT DANH SÁCH PHÂN CÔNG WORKER CHO 1 KHÂU / CA / NGÀY
// Worker trong DB sẽ được đồng bộ theo workerIds truyền lên
// ==========================================
export async function replaceWorkAssignments(data: {
  productionOrderId: number;
  stageId: number;
  shiftId: number;
  workerIds: string[];
  workDate: string;
}) {
  const normalizedWorkerIds = normalizeWorkerIds(data.workerIds);

  await prisma.$transaction(async (tx) => {
    if (normalizedWorkerIds.length === 0) {
      await tx.workAssignment.deleteMany({
        where: {
          productionOrderId: data.productionOrderId,
          stageId: data.stageId,
          shiftId: data.shiftId,
          workDate: new Date(data.workDate),
        },
      });
      return;
    }

    await tx.workAssignment.deleteMany({
      where: {
        productionOrderId: data.productionOrderId,
        stageId: data.stageId,
        shiftId: data.shiftId,
        workDate: new Date(data.workDate),
        workerId: { notIn: normalizedWorkerIds },
      },
    });

    await tx.workAssignment.createMany({
      data: normalizedWorkerIds.map((workerId) => ({
        productionOrderId: data.productionOrderId,
        stageId: data.stageId,
        shiftId: data.shiftId,
        workerId,
        workDate: new Date(data.workDate),
      })),
      skipDuplicates: true,
    });
  });

  const assignments = await prisma.workAssignment.findMany({
    where: {
      productionOrderId: data.productionOrderId,
      stageId: data.stageId,
      shiftId: data.shiftId,
      workDate: new Date(data.workDate),
    },
    include: {
      productionOrder: true,
      stage: true,
      shift: true,
      worker: true,
    },
    orderBy: { id: "asc" },
  });

  const formattedAssignments = assignments.map((item: any) => ({
    ...item,
    workDate: formatDate(item.workDate),
  }));

  const assignedWorkerIds = new Set(assignments.map((item) => item.workerId));
  const missingWorkerIds = normalizedWorkerIds.filter((id) => !assignedWorkerIds.has(id));
  if (missingWorkerIds.length > 0) {
    const conflictError = new Error("Một số worker không thể phân công do đã có ca khác cùng ngày.");
    (conflictError as any).code = "WORKER_CONFLICT";
    (conflictError as any).workerIds = missingWorkerIds;
    throw conflictError;
  }

  const workerCount = assignments.length;
  let warning: string | null = null;
  const firstAssignment = assignments[0];
  if (workerCount < MIN_WORKERS_PER_STAGE_SHIFT && firstAssignment) {
    warning = `⚠️ Cảnh báo: Khâu "${firstAssignment.stage.name}" trong ca "${firstAssignment.shift.shiftName}" ngày ${data.workDate} hiện chỉ có ${workerCount} worker (yêu cầu tối thiểu ${MIN_WORKERS_PER_STAGE_SHIFT} người).`;
  }

  return { assignments: formattedAssignments, workerCount, warning };
}

// ==========================================
// ĐẾM SỐ WORKER TRONG 1 KHÂU / 1 CA / 1 NGÀY
// Dùng để validate logic >= 3 worker
// ==========================================
export async function countWorkersInStageShift(
  productionOrderId: number,
  stageId: number,
  shiftId: number,
  workDate: string
) {
  return prisma.workAssignment.count({
    where: {
      productionOrderId,
      stageId,
      shiftId,
      workDate: new Date(workDate),
    },
  });
}

// ==========================================
// LẤY DANH SÁCH PHÂN CÔNG (có thể lọc theo order, stage, shift, date)
// Trả về dữ liệu được gộp theo ngày làm việc và ca làm việc
// ==========================================
export async function getWorkAssignments(filters: {
  productionOrderId?: number;
  stageId?: number;
  shiftId?: number;
  workDate?: string;
}) {
  const assignments = await prisma.workAssignment.findMany({
    where: {
      ...(filters.productionOrderId && { productionOrderId: filters.productionOrderId }),
      ...(filters.stageId && { stageId: filters.stageId }),
      ...(filters.shiftId && { shiftId: filters.shiftId }),
      ...(filters.workDate && { workDate: new Date(filters.workDate) }),
    },
    include: {
      productionOrder: true,
      stage: true,
      shift: true,
      worker: true,
    },
    orderBy: [{ workDate: "desc" }, { shiftId: "asc" }, { stageId: "asc" }],
  });

  const formattedAssignments = assignments.map((item: any) => ({
    ...item,
    workDate: formatDate(item.workDate),
  }));

  // Gộp dữ liệu theo workDate và shiftId
  const groupedMap = new Map<string, any>();

  formattedAssignments.forEach((assignment) => {
    const workDateStr = assignment.workDate.split('T')[0];
    const key = `${workDateStr}_${assignment.shiftId}`;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        workDate: workDateStr,
        shift: assignment.shift,
        productionOrder: assignment.productionOrder,
        stage: assignment.stage,
        workerIds: [],
      });
    }

    const group = groupedMap.get(key);
    group.workerIds.push(assignment.workerId);
  });

  return Array.from(groupedMap.values());
}

// ==========================================
// XÓA PHÂN CÔNG NHÂN SỰ THEO BỘ LỌC
// Xóa cả work_assignments và production_logs vì 2 bảng liên kết với nhau
// ==========================================
export async function deleteWorkAssignmentsByFilters(data: {
  productionOrderId: number;
  stageId: number;
  shiftId: number;
  workDate: string;
}) {
  // Sử dụng transaction để đảm bảo xóa cả 2 bảng cùng lúc
  const result = await prisma.$transaction(async (tx) => {
    // Xóa từ bảng production_logs trước
    const productionLogsResult = await tx.productionLog.deleteMany({
      where: {
        productionOrderId: data.productionOrderId,
        stageId: data.stageId,
        shiftId: data.shiftId,
        logDate: new Date(data.workDate),
      },
    });

    // Xóa từ bảng work_assignments
    const workAssignmentsResult = await tx.workAssignment.deleteMany({
      where: {
        productionOrderId: data.productionOrderId,
        stageId: data.stageId,
        shiftId: data.shiftId,
        workDate: new Date(data.workDate),
      },
    });

    return {
      workAssignmentsDeleted: workAssignmentsResult.count,
      productionLogsDeleted: productionLogsResult.count,
      totalDeleted: workAssignmentsResult.count + productionLogsResult.count,
    };
  });

  return result;
}
