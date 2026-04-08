/**
 * Prisma Client Singleton
 * Khởi tạo và export một instance duy nhất của PrismaClient
 * để sử dụng xuyên suốt ứng dụng.
 *
 * Prisma 7 yêu cầu sử dụng Driver Adapter thay vì truyền URL trực tiếp.
 * Sử dụng @prisma/adapter-pg để kết nối PostgreSQL.
 *
 * LƯU Ý: Truyền connection params riêng lẻ để tránh lỗi
 * khi password chứa ký tự đặc biệt (ví dụ: #).
 */
import "dotenv/config";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

// Trích xuất thông tin kết nối từ DATABASE_URL
// Format: postgresql://user:password@host:port/database?schema=public
function parseConnectionString(url: string) {
  // Tách phần protocol
  const withoutProtocol = url.replace(/^postgresql:\/\//, "");
  // Tách user:password@host:port/database
  const [credentials, rest] = withoutProtocol.split("@") as [string, string];
  const [user, ...passwordParts] = credentials.split(":") as [string, ...string[]];
  const password = decodeURIComponent(passwordParts.join(":")); // Password có thể chứa ':' và cần decode
  const [hostPort, dbAndParams] = rest.split("/") as [string, string];
  const [host, portStr] = hostPort.split(":") as [string, string];
  const [database] = dbAndParams.split("?") as [string];

  return {
    user,
    password,
    host,
    port: parseInt(portStr, 10),
    database,
  };
}

const dbUrl = process.env["DATABASE_URL"];
if (!dbUrl) {
  throw new Error("DATABASE_URL chưa được cấu hình trong file .env");
}

// Thêm timezone vào DATABASE_URL để database sử dụng múi giờ Việt Nam (UTC+7)
const dbUrlWithTimezone = dbUrl.includes("?")
  ? `${dbUrl}&timezone=UTC%2B07%3A00`
  : `${dbUrl}?timezone=UTC%2B07%3A00`;

const connectionParams = parseConnectionString(dbUrlWithTimezone);

// Tạo connection pool PostgreSQL với params riêng lẻ
const pool = new pg.Pool(connectionParams);

// Tạo Prisma adapter từ pool
// @ts-expect-error type mismatch between pg and adapter-pg
const adapter = new PrismaPg(pool);

// Khởi tạo PrismaClient với driver adapter
const prisma = new PrismaClient({ adapter });

export default prisma;
