/**
 * WorkloadConfig Service
 * Tầng Business Logic: Xử lý CRUD cho bảng cấu hình định mức (stage_workload_configs).
 * Mỗi config quy định: với X số worker thì target là Y sản phẩm cho 1 khâu.
 */
import prisma from "../config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

type ParentAutoCalculatedConfig = {
  numWorkers: number;
  timeHours: number;
  targetQuantity: number;
  configuredChildren: number;
  totalChildren: number;
  isComplete: boolean;
  basedOnChildStageIds: number[];
};

const workloadConfigInclude = {
  stage: {
    include: {
      parentLink: {
        include: {
          parentStage: {
            select: { id: true, name: true },
          },
        },
      },
    },
  },
} as const;

type WorkloadConfigRecord = Prisma.StageWorkloadConfigGetPayload<{
  include: typeof workloadConfigInclude;
}>;

function mapConfigWithParent(record: WorkloadConfigRecord) {
  const { parentLink, ...stageData } = record.stage;

  return {
    ...record,
    stage: {
      ...stageData,
      parentStageId: parentLink?.parentStageId ?? null,
      parent: parentLink?.parentStage
        ? {
            id: parentLink.parentStage.id,
            name: parentLink.parentStage.name,
          }
        : null,
    },
  };
}

async function getParentAutoCalculatedConfigsByChildStageId(stageId: number): Promise<{
  parentStageId: number;
  configs: ParentAutoCalculatedConfig[];
} | null> {
  const parentLink = await prisma.stageHierarchy.findUnique({
    where: { childStageId: stageId },
    select: { parentStageId: true },
  });

  if (!parentLink) {
    return null;
  }

  const childLinks = await prisma.stageHierarchy.findMany({
    where: { parentStageId: parentLink.parentStageId },
    select: { childStageId: true },
  });

  const childStageIds = childLinks.map((item) => item.childStageId);
  if (childStageIds.length === 0) {
    return {
      parentStageId: parentLink.parentStageId,
      configs: [],
    };
  }

  const children = await prisma.stage.findMany({
    where: { id: { in: childStageIds } },
    include: {
      workloadConfigs: true,
    },
  });

  const totalChildren = children.length;
  const grouped = new Map<string, { numWorkers: number; timeHours: number; childTargets: Map<number, number> }>();

  for (const child of children) {
    for (const config of child.workloadConfigs) {
      const key = `${config.numWorkers}_${config.timeHours}`;
      const current = grouped.get(key);
      if (current) {
        current.childTargets.set(child.id, config.targetQuantity);
      } else {
        grouped.set(key, {
          numWorkers: config.numWorkers,
          timeHours: config.timeHours,
          childTargets: new Map([[child.id, config.targetQuantity]]),
        });
      }
    }
  }

  const configs = Array.from(grouped.values())
    .map((item) => {
      const childTargets = Array.from(item.childTargets.values());
      const childIds = Array.from(item.childTargets.keys()).sort((a, b) => a - b);

      return {
        numWorkers: item.numWorkers,
        timeHours: item.timeHours,
        targetQuantity: Math.min(...childTargets),
        configuredChildren: item.childTargets.size,
        totalChildren,
        isComplete: item.childTargets.size === totalChildren,
        basedOnChildStageIds: childIds,
      };
    })
    .sort((a, b) => {
      if (a.numWorkers !== b.numWorkers) {
        return a.numWorkers - b.numWorkers;
      }
      return a.timeHours - b.timeHours;
    });

  return {
    parentStageId: parentLink.parentStageId,
    configs,
  };
}

// ==========================================
// TẠO CẤU HÌNH ĐỊNH MỨC MỚI
// ==========================================
export async function createWorkloadConfig(data: {
  stageId: number;
  numWorkers: number;
  targetQuantity: number;
  timeHours: number;
}) {
  const config = await prisma.stageWorkloadConfig.create({
    data,
    include: workloadConfigInclude,
  });

  const parentAutoCalculated = await getParentAutoCalculatedConfigsByChildStageId(data.stageId);

  return {
    ...mapConfigWithParent(config),
    parentAutoCalculated,
  };
}

// ==========================================
// LẤY DANH SÁCH CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function getAllWorkloadConfigs() {
  const configs = await prisma.stageWorkloadConfig.findMany({
    include: workloadConfigInclude,
    orderBy: { stageId: "asc" },
  });

  return configs.map(mapConfigWithParent);
}

// ==========================================
// LẤY CHI TIẾT 1 CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function getWorkloadConfigById(id: number) {
  const config = await prisma.stageWorkloadConfig.findUnique({
    where: { id },
    include: workloadConfigInclude,
  });

  if (!config) {
    return null;
  }

  const parentAutoCalculated = await getParentAutoCalculatedConfigsByChildStageId(config.stageId);

  return {
    ...mapConfigWithParent(config),
    parentAutoCalculated,
  };
}

// ==========================================
// CẬP NHẬT CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function updateWorkloadConfig(
  id: number,
  data: {
    stageId?: number;
    numWorkers?: number;
    targetQuantity?: number;
    timeHours?: number;
  }
) {
  const config = await prisma.stageWorkloadConfig.update({
    where: { id },
    data,
    include: workloadConfigInclude,
  });

  const parentAutoCalculated = await getParentAutoCalculatedConfigsByChildStageId(config.stageId);

  return {
    ...mapConfigWithParent(config),
    parentAutoCalculated,
  };
}

// ==========================================
// XÓA CẤU HÌNH ĐỊNH MỨC
// ==========================================
export async function deleteWorkloadConfig(id: number) {
  const deleted = await prisma.stageWorkloadConfig.delete({ where: { id } });
  const parentAutoCalculated = await getParentAutoCalculatedConfigsByChildStageId(deleted.stageId);

  return {
    ...deleted,
    parentAutoCalculated,
  };
}
