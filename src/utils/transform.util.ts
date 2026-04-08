/**
 * Transform Utility
 * Các hàm helper để transform dữ liệu trả về từ database
 */

/**
 * Format Date thành chuỗi HH:mm
 */
export function formatTime(date: Date | null | undefined): string | null {
  if (!date) return null;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Transform shift object: format startTime và endTime
 */
export function transformShift(shift: any): any {
  if (!shift) return shift;
  return {
    ...shift,
    startTime: formatTime(shift.startTime),
    endTime: formatTime(shift.endTime),
  };
}

/**
 * Transform mảng shift objects
 */
export function transformShifts(shifts: any[]): any[] {
  if (!Array.isArray(shifts)) return shifts;
  return shifts.map(transformShift);
}

/**
 * Transform đệ quy shift data trong object bất kỳ
 * Dùng cho các response có include: { shift: true }
 */
export function transformEmbeddedShifts(data: any): any {
  if (!data) return data;

  // Nếu là mảng, transform từng phần tử
  if (Array.isArray(data)) {
    return data.map(transformEmbeddedShifts);
  }

  // Nếu là object, kiểm tra và transform
  if (typeof data === 'object' && data !== null) {
    const transformed: any = {};

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];

        // Nếu key là 'shift' và object có startTime/endTime, transform nó
        if (key === 'shift' && value && typeof value === 'object') {
          transformed[key] = transformShift(value);
        } else {
          // Đệ quy transform các object lồng nhau khác
          transformed[key] = transformEmbeddedShifts(value);
        }
      }
    }

    return transformed;
  }

  // Các kiểu dữ liệu khác (string, number, boolean) giữ nguyên
  return data;
}
