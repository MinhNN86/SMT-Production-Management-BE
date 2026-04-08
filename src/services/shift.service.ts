/**
 * Shift Service
 * Tầng Business Logic: Xử lý CRUD cho bảng ca làm việc (shifts).
 */
import prisma from "../config/prisma.js";

// ==========================================
// TẠO CA LÀM VIỆC MỚI
// ==========================================
export async function createShift(data: {
  shiftName: string;
  startTime?: string; // Format: "HH:mm"
  endTime?: string;   // Format: "HH:mm"
}) {
  return prisma.shift.create({
    data: {
      shiftName: data.shiftName,
      // Chuyển đổi chuỗi giờ "HH:mm" sang Date cho kiểu Time của PostgreSQL
      startTime: data.startTime ? new Date(`1970-01-01T${data.startTime}:00`) : undefined,
      endTime: data.endTime ? new Date(`1970-01-01T${data.endTime}:00`) : undefined,
    },
  });
}

// ==========================================
// LẤY DANH SÁCH CA LÀM VIỆC
// ==========================================
export async function getAllShifts() {
  return prisma.shift.findMany({ orderBy: { id: "asc" } });
}

// ==========================================
// LẤY CHI TIẾT 1 CA LÀM VIỆC
// ==========================================
export async function getShiftById(id: number) {
  return prisma.shift.findUnique({ where: { id } });
}

// ==========================================
// CẬP NHẬT CA LÀM VIỆC
// ==========================================
export async function updateShift(
  id: number,
  data: {
    shiftName?: string;
    startTime?: string;
    endTime?: string;
  }
) {
  return prisma.shift.update({
    where: { id },
    data: {
      ...(data.shiftName && { shiftName: data.shiftName }),
      ...(data.startTime && { startTime: new Date(`1970-01-01T${data.startTime}:00`) }),
      ...(data.endTime && { endTime: new Date(`1970-01-01T${data.endTime}:00`) }),
    },
  });
}

// ==========================================
// XÓA CA LÀM VIỆC
// ==========================================
export async function deleteShift(id: number) {
  return prisma.shift.delete({ where: { id } });
}
