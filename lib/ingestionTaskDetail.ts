import { isIngestionRasterDataType, resolveIngestionTaskDataType } from './ingestionBatchSubTaskEdit';
import { themePathByNodeId } from './dataThemePath';
import { getGf1cSceneDetail, isGf1cSceneTaskId } from '../gf1cBatchIngestionMock';

/** 离线任务 / 实时任务 */
export type IngestionExecutionKind = 'offline' | 'realtime';

export interface IngestionTaskLike {
  id: string;
  name: string;
  /** 创建任务所选数据类型 */
  dataType?: string;
  /** @deprecated 旧列表字段，请使用 dataType */
  type?: string;
  ingestionMode: 'single' | 'batch';
  /** 任务类型：离线任务、实时任务 */
  executionKind?: IngestionExecutionKind;
  status: 'success' | 'failure' | 'processing' | 'pending';
  log: string;
  creator: string;
  createTime: string;
  /** 入库绑定的数据主题节点 id */
  themeNodeId?: string;
}

export interface BuildIngestionTaskDetailOptions {
  /** 批量入库父目录（任务组）名称 */
  batchGroupName?: string;
}

export interface IngestionTaskDetailPayload {
  id: string;
  name: string;
  creator: string;
  createTime: string;
  endTime: string | null;
  duration: string | null;
  status: IngestionTaskLike['status'];
  taskType: string;
  /** 批量入库任务组名称；单次入库为 null */
  batchGroupName: string | null;
  /** 批量入库子任务名称；单次入库为 null */
  subTaskName: string | null;
  /** 数据分层，如贴源层 */
  dataLayer: string;
  dataType: string;
  /** 创建任务时同步注入的数据主题路径（与创建页下拉 label 一致） */
  dataThemePath: string;
  /** 数据主题节点 id（与创建页下拉 value 一致） */
  dataThemeNodeId: string;
  ingestionMode: 'single' | 'batch';
}

function parseDateTime(s: string): Date | null {
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6]),
  );
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} 分 ${s} 秒` : `${m} 分`;
}

function resolveEndAndDuration(task: IngestionTaskLike): {
  endTime: string | null;
  duration: string | null;
} {
  if (task.status === 'processing') {
    return { endTime: null, duration: null };
  }
  const start = parseDateTime(task.createTime);
  if (!start) {
    return { endTime: null, duration: null };
  }
  const elapsedSec =
    task.status === 'success'
      ? 18 + (task.id.charCodeAt(0) % 30)
      : 45 + (task.id.charCodeAt(task.id.length - 1) % 120);
  const end = new Date(start.getTime() + elapsedSec * 1000);
  return {
    endTime: formatDateTime(end),
    duration: formatDuration(elapsedSec),
  };
}

export function ingestionExecutionKindLabel(kind: IngestionExecutionKind): string {
  return kind === 'realtime' ? '实时任务' : '离线任务';
}

export function ingestionScopeLabel(mode: 'single' | 'batch'): string {
  return mode === 'batch' ? '批量入库' : '单次入库';
}

function resolveExecutionKind(task: IngestionTaskLike): IngestionExecutionKind {
  if (task.executionKind) return task.executionKind;
  if (/实时/.test(task.name)) return 'realtime';
  return 'offline';
}

function resolveThemeNodeId(task: IngestionTaskLike, batchGroupName?: string): string {
  if (task.themeNodeId) return task.themeNodeId;
  if (isGf1cSceneTaskId(task.id)) {
    return getGf1cSceneDetail(task.id)?.themeNodeId ?? 'rs-sat-s2';
  }
  const dt = resolveIngestionTaskDataType(task, batchGroupName);
  if (isIngestionRasterDataType(dt)) return 'rs-sat-s2';
  return 'geo-admin';
}

export function buildIngestionTaskDetail(
  task: IngestionTaskLike,
  options?: BuildIngestionTaskDetailOptions,
): IngestionTaskDetailPayload {
  const { endTime, duration } = resolveEndAndDuration(task);
  const executionKind = resolveExecutionKind(task);
  const taskType = ingestionExecutionKindLabel(executionKind);

  const batchGroupName =
    task.ingestionMode === 'batch' && options?.batchGroupName
      ? options.batchGroupName
      : null;

  const dataThemeNodeId = resolveThemeNodeId(task, options?.batchGroupName);
  const dataThemePath = themePathByNodeId(dataThemeNodeId);
  const dataType = resolveIngestionTaskDataType(task, options?.batchGroupName);

  return {
    id: task.id,
    name: task.name,
    creator: task.creator,
    createTime: task.createTime,
    endTime,
    duration,
    status: task.status,
    taskType,
    batchGroupName,
    subTaskName: batchGroupName ? task.name : null,
    dataLayer: '贴源层',
    dataType,
    dataThemePath,
    dataThemeNodeId,
    ingestionMode: task.ingestionMode,
  };
}

export function ingestionTaskStatusLabel(status: IngestionTaskLike['status']): string {
  if (status === 'success') return '成功';
  if (status === 'failure') return '失败';
  if (status === 'pending') return '待启动';
  return '进行中';
}
