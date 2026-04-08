/**
 * Statistics Service
 * Tầng Business Logic: Xử lý thống kê sản lượng sản xuất.
 *
 * Trả về:
 * - Tổng số lượng yêu cầu của lệnh sản xuất
 * - Sản lượng hoàn thành của khâu cuối cùng (display_order lớn nhất)
 *   chia theo: từng ca, tổng ngày (2 ca), tổng ngày có tăng ca (3 ca)
 * - Sản lượng lũy kế (tất cả các ngày) của khâu cuối cùng
 * - Số lượng còn lại chưa làm
 */
import prisma from "../config/prisma.js";

// ==========================================
// THỐNG KÊ SẢN LƯỢNG THEO ORDER VÀ NGÀY
// ==========================================
export async function getStatistics(productionOrderId: number, date: string) {
  // 1. Lấy thông tin lệnh sản xuất
  const order = await prisma.productionOrder.findUnique({
    where: { id: productionOrderId },
  });

  if (!order) {
    throw new Error("Không tìm thấy lệnh sản xuất.");
  }

  // 2. Tìm khâu cuối cùng (display_order lớn nhất)
  const lastStage = await prisma.stage.findFirst({
    orderBy: { displayOrder: "desc" },
  });

  if (!lastStage) {
    throw new Error("Chưa có khâu sản xuất nào trong hệ thống.");
  }

  // 3. Lấy tất cả ca làm việc (sắp xếp theo id)
  const shifts = await prisma.shift.findMany({
    orderBy: { id: "asc" },
  });

  // 4. Lấy production logs của khâu cuối cùng trong ngày được chọn
  const logsForDate = await prisma.productionLog.findMany({
    where: {
      productionOrderId,
      stageId: lastStage.id,
      logDate: new Date(date),
    },
    include: { shift: true },
    orderBy: { shiftId: "asc" },
  });

  // 5. Tính sản lượng theo từng ca trong ngày
  // Tạo object chứa sản lượng theo từng ca
  const shiftQuantities: Record<string, number> = {};
  for (const shift of shifts) {
    // Tìm log tương ứng với ca này
    const log = logsForDate.find((l) => l.shiftId === shift.id);
    shiftQuantities[shift.shiftName] = log?.actualQuantity ?? 0;
  }

  // Tính tổng ngày (2 ca đầu = Ca 1 + Ca 2)
  const shiftValues = shifts.map((s) => {
    const log = logsForDate.find((l) => l.shiftId === s.id);
    return log?.actualQuantity ?? 0;
  });

  // Ca 1 + Ca 2 (2 ca chính)
  const totalDay2Shifts = shiftValues.slice(0, 2).reduce((sum, val) => sum + val, 0);
  // Ca 1 + Ca 2 + Ca 3 (có tăng ca)
  const totalDay3Shifts = shiftValues.reduce((sum, val) => sum + val, 0);

  // 6. Tính tổng sản lượng lũy kế của khâu cuối (tất cả các ngày)
  const cumulativeResult = await prisma.productionLog.aggregate({
    where: {
      productionOrderId,
      stageId: lastStage.id,
    },
    _sum: {
      actualQuantity: true,
    },
  });

  const cumulativeCompleted = cumulativeResult._sum.actualQuantity ?? 0;

  // 7. Tính số lượng còn lại chưa làm
  const remaining = order.totalQuantity - cumulativeCompleted;

  // 8. Trả kết quả
  return {
    productionOrderId: order.id,
    orderCode: order.orderCode,
    totalQuantity: order.totalQuantity,
    date,
    lastStage: {
      stageId: lastStage.id,
      stageName: lastStage.name,
    },
    completed: {
      ...shiftQuantities,                 // Sản lượng từng ca
      total_day_2_shifts: totalDay2Shifts, // Tổng 2 ca chính
      total_day_3_shifts: totalDay3Shifts, // Tổng khi có tăng ca
    },
    cumulativeCompleted, // Tổng lũy kế tất cả các ngày
    remaining,           // Số lượng còn lại chưa làm
  };
}
