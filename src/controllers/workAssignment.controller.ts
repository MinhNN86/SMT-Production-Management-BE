/**
 * WorkAssignment Controller
 * Tầng Controller: Xử lý request/response cho phân công nhân sự.
 *
 * ⚠️ LƯU Ý: Endpoint POST sẽ trả về warning nếu số worker
 * trong 1 khâu/1 ca/1 ngày ít hơn 3 người.
 */
import type { Request, Response } from "express";
import * as workAssignmentService from "../services/workAssignment.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { transformEmbeddedShifts } from "../utils/transform.util.js";

function isValidWorkerIds(workerIds: unknown): workerIds is string[] {
  return (
    Array.isArray(workerIds)
    && workerIds.length > 0
    && workerIds.every((id) => typeof id === "string" && id.length > 0)
  );
}

// ==========================================
// TẠO PHÂN CÔNG NHÂN SỰ MỚI
// ==========================================
export async function create(req: Request, res: Response) {
  try {
    const { productionOrderId, stageId, shiftId, workerIds, workDate } = req.body as {
      productionOrderId: number;
      stageId: number;
      shiftId: number;
      workerIds: string[];
      workDate: string;
    };

    // Kiểm tra dữ liệu đầu vào
    if (!productionOrderId || !stageId || !shiftId || !workDate || !isValidWorkerIds(workerIds)) {
      sendError(res, 400, "Thiếu thông tin: productionOrderId, stageId, shiftId, workerIds[], workDate là bắt buộc.");
      return;
    }

    const result = await workAssignmentService.createWorkAssignments({
      productionOrderId,
      stageId,
      shiftId,
      workerIds,
      workDate,
    });

    // Trả về kết quả kèm cảnh báo nếu có
    const responseData = {
      assignments: transformEmbeddedShifts(result.assignments),
      workerCount: result.workerCount,
      ...(result.warning && { warning: result.warning }),
    };
    sendSuccess(res, 201, "Phân công nhân sự thành công.", responseData);
  } catch (error: any) {
    // Worker đã được phân công ca này rồi (unique constraint)
    if (error.code === "P2002") {
      sendError(res, 409, "Worker này đã được phân công vào ca này trong ngày.");
      return;
    }
    // FK không tồn tại (order, stage, shift, worker không hợp lệ)
    if (error.code === "P2003") {
      sendError(res, 400, "Dữ liệu tham chiếu không hợp lệ (order/stage/shift/worker không tồn tại).");
      return;
    }
    if (error.code === "WORKER_CONFLICT") {
      const conflictWorkerIds = (error.workerIds as string[] | undefined) ?? [];
      sendError(
        res,
        409,
        `Worker đã được phân công ca này ở khâu khác hoặc dữ liệu xung đột. workerIds lỗi: [${conflictWorkerIds.join(", ")}]`
      );
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT DANH SÁCH PHÂN CÔNG THEO MẢNG WORKER IDS
// ==========================================
export async function update(req: Request, res: Response) {
  try {
    const { productionOrderId, stageId, shiftId, workerIds, workDate } = req.body as {
      productionOrderId: number;
      stageId: number;
      shiftId: number;
      workerIds: string[];
      workDate: string;
    };

    if (!productionOrderId || !stageId || !shiftId || !workDate || !Array.isArray(workerIds) || !workerIds.every((id) => typeof id === "string" && id.length > 0)) {
      sendError(res, 400, "Thiếu thông tin: productionOrderId, stageId, shiftId, workerIds[], workDate là bắt buộc.");
      return;
    }

    const result = await workAssignmentService.replaceWorkAssignments({
      productionOrderId,
      stageId,
      shiftId,
      workerIds,
      workDate,
    });

    const responseData = {
      assignments: transformEmbeddedShifts(result.assignments),
      workerCount: result.workerCount,
      ...(result.warning && { warning: result.warning }),
    };
    sendSuccess(res, 200, "Cập nhật phân công nhân sự thành công.", responseData);
  } catch (error: any) {
    if (error.code === "P2003") {
      sendError(res, 400, "Dữ liệu tham chiếu không hợp lệ (order/stage/shift/worker không tồn tại).");
      return;
    }
    if (error.code === "WORKER_CONFLICT") {
      const conflictWorkerIds = (error.workerIds as string[] | undefined) ?? [];
      sendError(
        res,
        409,
        `Worker đã được phân công ca này ở khâu khác hoặc dữ liệu xung đột. workerIds lỗi: [${conflictWorkerIds.join(", ")}]`
      );
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH PHÂN CÔNG (hỗ trợ lọc)
// Query params: productionOrderId, stageId, shiftId, workDate
// Trả về dữ liệu được gộp theo ngày làm việc và ca làm việc
// ==========================================
export async function getAll(req: Request, res: Response) {
  try {
    const filters = {
      productionOrderId: req.query["productionOrderId"]
        ? parseInt(req.query["productionOrderId"] as string, 10)
        : undefined,
      stageId: req.query["stageId"]
        ? parseInt(req.query["stageId"] as string, 10)
        : undefined,
      shiftId: req.query["shiftId"]
        ? parseInt(req.query["shiftId"] as string, 10)
        : undefined,
      workDate: req.query["workDate"] as string | undefined,
    };

    const assignments = await workAssignmentService.getWorkAssignments(filters);
    sendSuccess(res, 200, "Lấy danh sách phân công nhân sự thành công.", assignments);
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA PHÂN CÔNG NHÂN SỰ THEO BỘ LỌC
// Body: { productionOrderId, stageId, shiftId, workDate }
// ==========================================
export async function remove(req: Request, res: Response) {
  try {
    const { productionOrderId, stageId, shiftId, workDate } = req.body as {
      productionOrderId: number;
      stageId: number;
      shiftId: number;
      workDate: string;
    };

    if (!productionOrderId || !stageId || !shiftId || !workDate) {
      sendError(res, 400, "Thiếu thông tin: productionOrderId, stageId, shiftId, workDate là bắt buộc.");
      return;
    }

    const result = await workAssignmentService.deleteWorkAssignmentsByFilters({
      productionOrderId,
      stageId,
      shiftId,
      workDate,
    });

    sendSuccess(res, 200, `Xóa thành công ${result.totalDeleted} bản ghi (${result.workAssignmentsDeleted} phân công nhân sự và ${result.productionLogsDeleted} nhật ký sản xuất).`, {
      workAssignmentsDeleted: result.workAssignmentsDeleted,
      productionLogsDeleted: result.productionLogsDeleted,
      totalDeleted: result.totalDeleted,
    });
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}
