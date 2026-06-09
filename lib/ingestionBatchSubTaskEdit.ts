/** 批量入库子任务（列表行 / 编辑上下文） */
export interface IngestionBatchSubTask {
  id: string;
  name: string;
  /** 创建任务所选数据类型（矢量 / 影像 / GF1标准卫星包 等） */
  dataType: string;
  ingestionMode: 'single' | 'batch';
  executionKind?: 'offline' | 'realtime';
  themeNodeId?: string;
  status: 'success' | 'failure' | 'processing';
  progress: number;
  log: string;
  creator: string;
  createTime: string;
}

export interface IngestionBatchSubTaskEditContext {
  task: IngestionBatchSubTask;
  batchGroupName: string;
  parentId: string;
}

/** 列表/详情展示：优先使用任务上的 dataType，兼容旧 mock 的 type + 任务组推断 */
export function resolveIngestionTaskDataType(
  task: { dataType?: string; type?: string },
  batchGroupName?: string,
): string {
  if (task.dataType?.trim()) return task.dataType.trim();
  const legacy = task.type ?? '';
  if (legacy === 'Shp') return '矢量';
  const g = batchGroupName ?? '';
  if (/GF1C|GF1/i.test(g)) return 'GF1标准卫星包';
  if (/GF2/i.test(g)) return 'GF2标准卫星包';
  if (/landsat|LC08/i.test(g)) return 'Landsat标准卫星包';
  if (/Sentinel/i.test(g)) return 'Sentinel标准卫星包';
  if (/ZY/i.test(g)) return 'ZY标准卫星包';
  if (legacy === '影像') return '影像';
  return legacy || '矢量';
}

export function isIngestionRasterDataType(dataType: string): boolean {
  return (
    dataType.includes('影像') ||
    dataType.includes('三维') ||
    /标准卫星包/.test(dataType)
  );
}

export function defaultMetadataModelForDataType(dataType: string): string {
  const modelByType: Record<string, string> = {
    矢量: '矢量元数据标准',
    影像: '遥感专题数据标准',
    'GF1标准卫星包': 'GF卫星元数据标准',
    'GF2标准卫星包': 'GF卫星元数据标准',
    'ZY标准卫星包': 'ZY卫星元数据标准',
    'Sentinel标准卫星包': 'Sentinel卫星元数据标准',
    'Landsat标准卫星包': 'Landsat卫星元 metadata标准',
  };
  return modelByType[dataType] ?? '';
}
