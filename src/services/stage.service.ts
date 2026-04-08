/**
 * Stage Service
 * Tầng Business Logic: Xử lý CRUD cho khâu sản xuất với
 * quan hệ cha-con qua bảng stage_hierarchy và loại thiết bị qua stage_device_types.
 */
import prisma from "../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

type StageDeviceTypeSummary = {
  id: number;
  name: string;
};

type StageWithConfigs = {
  id: number;
  name: string;
  displayOrder: number;
  description: string | null;
  parentStageId: number | null;
  parent: {
    id: number;
    name: string;
  } | null;
  deviceTypeIds: number[];
  deviceTypes: StageDeviceTypeSummary[];
  workloadConfigs: Array<{
    id: number;
    stageId: number;
    numWorkers: number;
    targetQuantity: number;
    timeHours: number;
  }>;
};

type StageHierarchyNode = Omit<StageWithConfigs, 'parentStageId' | 'parent'> & {
  children: StageHierarchyNode[];
};

async function getStageRecords() {
  return prisma.stage.findMany({
    include: {
      parentLink: {
        include: {
          parentStage: {
            select: { id: true, name: true },
          },
        },
      },
      stageDeviceTypes: {
        include: {
          deviceType: {
            select: { id: true, name: true },
          },
        },
        orderBy: {
          deviceTypeId: "asc",
        },
      },
      workloadConfigs: {
        orderBy: [{ numWorkers: "asc" }, { timeHours: "asc" }, { id: "asc" }],
      },
    },
    orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
  });
}

type StageRecord = Awaited<ReturnType<typeof getStageRecords>>[number];

function createBusinessError(code: string, message: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

function normalizeDeviceTypeIds(deviceTypeIds: number[]) {
  return [...new Set(deviceTypeIds)].filter((id) => Number.isInteger(id) && id > 0);
}

function mapStageRecord(record: StageRecord): StageWithConfigs {
  const deviceTypes = record.stageDeviceTypes.map((item) => ({
    id: item.deviceType.id,
    name: item.deviceType.name,
  }));

  return {
    id: record.id,
    name: record.name,
    displayOrder: record.displayOrder,
    description: record.description,
    parentStageId: record.parentLink?.parentStageId ?? null,
    parent: record.parentLink?.parentStage
      ? {
          id: record.parentLink.parentStage.id,
          name: record.parentLink.parentStage.name,
        }
      : null,
    deviceTypeIds: deviceTypes.map((item) => item.id),
    deviceTypes,
    workloadConfigs: record.workloadConfigs,
  };
}

async function getStagesForHierarchy(): Promise<StageWithConfigs[]> {
  const records = await getStageRecords();

  return records.map(mapStageRecord);
}

function buildHierarchyTree(stages: StageWithConfigs[]) {
  const byParent = new Map<number | null, StageWithConfigs[]>();

  for (const stage of stages) {
    const siblings = byParent.get(stage.parentStageId);
    if (siblings) {
      siblings.push(stage);
    } else {
      byParent.set(stage.parentStageId, [stage]);
    }
  }

  const mapNode = (stage: StageWithConfigs): StageHierarchyNode => {
    const children = (byParent.get(stage.id) ?? []).map(mapNode);
    const { parentStageId, parent, ...rest } = stage;
    return {
      ...rest,
      children,
    };
  };

  return (byParent.get(null) ?? []).map(mapNode);
}

async function assertNoHierarchyCycle(stageId: number, newParentStageId: number) {
  let cursor: number | null = newParentStageId;

  while (cursor !== null) {
    if (cursor === stageId) {
      throw createBusinessError("STAGE_HIERARCHY_CYCLE", "Không thể gán stage cha vì tạo vòng lặp trong cây stage.");
    }

    const currentParentLink: { parentStageId: number } | null = await prisma.stageHierarchy.findUnique({
      where: { childStageId: cursor },
      select: { parentStageId: true },
    });

    cursor = currentParentLink?.parentStageId ?? null;
  }
}

async function updateStageRelations(
  tx: Prisma.TransactionClient,
  stageId: number,
  parentStageId?: number | null,
  deviceTypeIds?: number[]
) {
  if (parentStageId !== undefined) {
    await tx.stageHierarchy.deleteMany({ where: { childStageId: stageId } });

    if (parentStageId !== null) {
      await tx.stageHierarchy.create({
        data: {
          childStageId: stageId,
          parentStageId,
        },
      });
    }
  }

  if (deviceTypeIds !== undefined) {
    await tx.stageDeviceType.deleteMany({ where: { stageId } });

    if (deviceTypeIds.length > 0) {
      await tx.stageDeviceType.createMany({
        data: deviceTypeIds.map((deviceTypeId) => ({
          stageId,
          deviceTypeId,
        })),
      });
    }
  }
}

// ==========================================
// TẠO KHÂU SẢN XUẤT MỚI
// ==========================================
export async function createStage(data: {
  name: string;
  displayOrder: number;
  description?: string;
  parentStageId?: number | null;
  deviceTypeIds?: number[];
}) {
  const normalizedDeviceTypeIds = data.deviceTypeIds
    ? normalizeDeviceTypeIds(data.deviceTypeIds)
    : undefined;

  const created = await prisma.$transaction(async (tx) => {
    const stage = await tx.stage.create({
      data: {
        name: data.name,
        displayOrder: data.displayOrder,
        description: data.description,
      },
    });

    await updateStageRelations(tx, stage.id, data.parentStageId, normalizedDeviceTypeIds);
    return stage;
  });

  const stage = await getStageById(created.id);
  if (!stage) {
    throw new Error("Không thể lấy lại stage sau khi tạo.");
  }

  return stage;
}

// ==========================================
// LẤY DANH SÁCH KHÂU SẢN XUẤT
// ==========================================
export async function getAllStages() {
  return getStagesForHierarchy();
}

// ==========================================
// LẤY CÂY KHÂU SẢN XUẤT CHA - CON
// ==========================================
export async function getStageTree() {
  const stages = await getStagesForHierarchy();
  return buildHierarchyTree(stages);
}

// ==========================================
// LẤY CÂY KHÂU SẢN XUẤT THEO LOẠI THIẾT BỊ
// ==========================================
export async function getStageTreeByDeviceTypeId(deviceTypeId: number) {
  const stages = await getStagesForHierarchy();
  const filteredStages = stages.filter((stage) =>
    stage.deviceTypeIds.includes(deviceTypeId)
  );
  return buildHierarchyTree(filteredStages);
}

// ==========================================
// LẤY CHI TIẾT 1 KHÂU SẢN XUẤT
// ==========================================
export async function getStageById(id: number) {
  const stages = await getStagesForHierarchy();
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
  const target = stageMap.get(id);

  if (!target) {
    return null;
  }

  const byParent = new Map<number | null, StageWithConfigs[]>();
  for (const stage of stages) {
    const children = byParent.get(stage.parentStageId);
    if (children) {
      children.push(stage);
    } else {
      byParent.set(stage.parentStageId, [stage]);
    }
  }

  const mapNode = (stage: StageWithConfigs): StageHierarchyNode => {
    const children = (byParent.get(stage.id) ?? []).map(mapNode);
    const { parentStageId, parent, ...rest } = stage;
    return {
      ...rest,
      children,
    };
  };

  return mapNode(target);
}

// ==========================================
// CẬP NHẬT KHÂU SẢN XUẤT
// ==========================================
export async function updateStage(
  id: number,
  data: {
    name?: string;
    displayOrder?: number;
    description?: string;
    parentStageId?: number | null;
    deviceTypeIds?: number[];
  }
) {
  if (data.parentStageId === id) {
    throw createBusinessError("STAGE_PARENT_SELF", "Stage không thể tự làm stage cha của chính nó.");
  }

  if (data.parentStageId !== undefined && data.parentStageId !== null) {
    await assertNoHierarchyCycle(id, data.parentStageId);
  }

  const normalizedDeviceTypeIds = data.deviceTypeIds
    ? normalizeDeviceTypeIds(data.deviceTypeIds)
    : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.stage.findUniqueOrThrow({ where: { id } });

    const stageData: Prisma.StageUpdateInput = {};
    if (data.name !== undefined) {
      stageData.name = data.name;
    }
    if (data.displayOrder !== undefined) {
      stageData.displayOrder = data.displayOrder;
    }
    if (data.description !== undefined) {
      stageData.description = data.description;
    }

    if (Object.keys(stageData).length > 0) {
      await tx.stage.update({
        where: { id },
        data: stageData,
      });
    }

    await updateStageRelations(tx, id, data.parentStageId, normalizedDeviceTypeIds);
  });

  const stage = await getStageById(id);
  if (!stage) {
    throw new Error("Không thể lấy lại stage sau khi cập nhật.");
  }

  return stage;
}

// ==========================================
// XÓA KHÂU SẢN XUẤT
// ==========================================
export async function deleteStage(id: number) {
  return prisma.stage.delete({ where: { id } });
}

// ==========================================
// LẤY CÁC KHÂU CON TRỰC TIẾP CỦA MỘT KHÂU CHA
// ==========================================
export async function getChildStages(parentStageId: number) {
  const children = await prisma.stageHierarchy.findMany({
    where: { parentStageId },
    select: { childStageId: true },
    orderBy: { childStageId: "asc" },
  });

  return children.map((child) => child.childStageId);
}
