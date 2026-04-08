/**
 * Statistics Controller
 * Tầng Controller: Xử lý request/response cho thống kê sản lượng.
 */
import type { Request, Response } from "express";
import * as statisticsService from "../services/statistics.service.js";
import { sendError, sendSuccess } from "../utils/response.util.js";

// ==========================================
// THỐNG KÊ SẢN LƯỢNG THEO ORDER VÀ NGÀY
// Query params: productionOrderId (bắt buộc), date (bắt buộc, format: YYYY-MM-DD)
// ==========================================
export async function getStatistics(req: Request, res: Response) {
  try {
    const productionOrderId = req.query["productionOrderId"]
      ? parseInt(req.query["productionOrderId"] as string, 10)
      : undefined;
    const date = req.query["date"] as string | undefined;

    // Kiểm tra dữ liệu đầu vào
    if (!productionOrderId || !date) {
      sendError(res, 400, "Thiếu thông tin: productionOrderId và date là bắt buộc.");
      return;
    }

    const statistics = await statisticsService.getStatistics(productionOrderId, date);
    sendSuccess(res, 200, "Lấy thống kê sản lượng thành công.", statistics);
  } catch (error: any) {
    // Xử lý lỗi nghiệp vụ (không tìm thấy order, không có stage)
    if (error.message.includes("Không tìm thấy") || error.message.includes("Chưa có")) {
      sendError(res, 404, error.message);
      return;
    }
    sendError(res, 500, "Lỗi server.");
  }
}
