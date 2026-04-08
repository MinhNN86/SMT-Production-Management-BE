/**
 * ProductionLog Controller
 * Tầng Controller: Xử lý request/response cho nhập báo cáo sản lượng.
 */
import type { Request, Response } from "express";
import * as productionLogService from "../services/productionLog.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";
import { transformEmbeddedShifts } from "../utils/transform.util.js";

// ==========================================
// NHẬP / CẬP NHẬT BÁO CÁO SẢN LƯỢNG
// Upsert: tạo mới hoặc cập nhật nếu đã có
// ==========================================
export async function upsert(req: Request, res: Response) {
  try {
    const { productionOrderId, stageId, shiftId, logDate, actualQuantity, defectiveQuantity, note } =
      req.body as {
        productionOrderId: number;
        stageId: number;
        shiftId: number;
        logDate: string;
        actualQuantity: number;
        defectiveQuantity?: number;
        note?: string;
      };

    if (!productionOrderId || !stageId || !shiftId || !logDate || actualQuantity === undefined) {
      sendError(res, 400, "Thiếu thông tin: productionOrderId, stageId, shiftId, logDate, actualQuantity là bắt buộc.");
      return;
    }

    const log = await productionLogService.upsertProductionLog({
      productionOrderId,
      stageId,
      shiftId,
      logDate,
      actualQuantity,
      defectiveQuantity,
      note,
    });

    sendSuccess(res, 200, "Nhập báo cáo sản lượng thành công.", transformEmbeddedShifts(log));
  } catch (error: any) {
    if (error.message?.includes("vượt quá số lượng kế hoạch")) {
      sendError(res, 400, error.message);
      return;
    }
    if (error.code === "P2003") {
      sendError(res, 400, "Dữ liệu tham chiếu không hợp lệ (order/stage/shift không tồn tại).");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// LẤY DANH SÁCH BÁO CÁO SẢN LƯỢNG
// Query params: productionOrderId, stageId, shiftId, logDate
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
      logDate: req.query["logDate"] as string | undefined,
    };

    const logs = await productionLogService.getProductionLogs(filters);
    sendSuccess(res, 200, "Lấy danh sách báo cáo sản lượng thành công.", transformEmbeddedShifts(logs));
  } catch (error: any) {
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// XÓA BÁO CÁO SẢN LƯỢNG THEO ID
// Xóa cả production_logs và work_assignments vì 2 bảng liên kết với nhau
// ==========================================
export async function remove(req: Request, res: Response) {
  try {
    const idParam = req.params.id;

    if (!idParam) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    // Handle case where idParam might be an array
    const idString = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!idString) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const result = await productionLogService.deleteProductionLogById(id);

    sendSuccess(res, 200, `Xóa thành công ${result.totalDeleted} bản ghi (${result.workAssignmentsDeleted} phân công nhân sự và ${result.productionLogDeleted} nhật ký sản xuất).`, {
      workAssignmentsDeleted: result.workAssignmentsDeleted,
      productionLogDeleted: result.productionLogDeleted,
      totalDeleted: result.totalDeleted,
    });
  } catch (error: any) {
    if (error.message === "Production log not found") {
      sendError(res, 404, "Không tìm thấy nhật ký sản xuất.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// CẬP NHẬT BÁO CÁO SẢN LƯỢNG THEO ID
// ==========================================
export async function update(req: Request, res: Response) {
  try {
    const idParam = req.params.id;

    if (!idParam) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const idString = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!idString) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const id = parseInt(idString, 10);

    if (isNaN(id)) {
      sendError(res, 400, "ID không hợp lệ.");
      return;
    }

    const { stageId, shiftId, logDate, actualQuantity, defectiveQuantity, note } =
      req.body as {
        stageId?: number;
        shiftId?: number;
        logDate?: string;
        actualQuantity?: number;
        defectiveQuantity?: number;
        note?: string;
      };

    const log = await productionLogService.updateProductionLog(id, {
      stageId,
      shiftId,
      logDate,
      actualQuantity,
      defectiveQuantity,
      note,
    });

    sendSuccess(res, 200, "Cập nhật báo cáo sản lượng thành công.", transformEmbeddedShifts(log));
  } catch (error: any) {
    if (error.message?.includes("vượt quá số lượng kế hoạch")) {
      sendError(res, 400, error.message);
      return;
    }
    if (error.code === "P2025") {
      sendError(res, 404, "Không tìm thấy nhật ký sản xuất.");
      return;
    }
    if (error.code === "P2002") {
      sendError(res, 400, "Vi phạm ràng buộc duy nhất: đã có bản ghi với các giá trị này.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}

// ==========================================
// NHẬP HÀNG LOẠT BÁO CÁO SẢN LƯỢNG
// Nhập/sửa nhiều production logs cho các khâu con của một khâu cha
// ==========================================
export async function bulkUpsert(req: Request, res: Response) {
  try {
    const { productionOrderId, parentStageId, logDate, logs } =
      req.body as {
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
      };

    if (!productionOrderId || !parentStageId || !logDate || !logs) {
      sendError(res, 400, "Thiếu thông tin: productionOrderId, parentStageId, logDate, logs là bắt buộc.");
      return;
    }

    if (!Array.isArray(logs) || logs.length === 0) {
      sendError(res, 400, "logs phải là một mảng không rỗng.");
      return;
    }

    for (const log of logs) {
      if (!log.stageId || !log.shiftId || log.actualQuantity === undefined) {
        sendError(res, 400, "Mỗi log phải có: stageId, shiftId, actualQuantity.");
        return;
      }
    }

    const result = await productionLogService.bulkUpsertProductionLogs({
      productionOrderId,
      parentStageId,
      logDate,
      logs,
    });

    sendSuccess(res, 200, "Nhập báo cáo sản lượng hàng loạt thành công.", {
      created: transformEmbeddedShifts(result.created),
      updated: transformEmbeddedShifts(result.updated),
      totalProcessed: result.totalProcessed,
    });
  } catch (error: any) {
    if (error.message?.includes("vượt quá số lượng kế hoạch")) {
      sendError(res, 400, error.message);
      return;
    }
    if (error.message === "ProductionOrder not found") {
      sendError(res, 400, "Production order không tồn tại.");
      return;
    }
    if (error.message === "ParentStage not found") {
      sendError(res, 400, "Khâu cha không tồn tại.");
      return;
    }
    if (error.message?.includes("không phải là con trực tiếp của khâu")) {
      sendError(res, 400, error.message);
      return;
    }
    if (error.code === "P2025") {
      sendError(res, 400, "Dữ liệu tham chiếu không hợp lệ (stage hoặc shift không tồn tại).");
      return;
    }
    if (error.code === "P2002") {
      sendError(res, 400, "Vi phạm ràng buộc duy nhất: đã có bản ghi với các giá trị này.");
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
