/**
 * 标准码表 — mock 数据（概念对齐华为云 DataArts「码表管理」：
 * lookup / 数据字典，存储枚举名称与编码映射，可供数据标准「值域-引用码表」引用）
 * @see https://support.huaweicloud.com/usermanual-dataartsstudio/dataartsstudio_01_0604.html
 */

export type CodeTableFieldDataType =
  | 'STRING'
  | 'BIGINT'
  | 'DOUBLE'
  | 'TIMESTAMP'
  | 'DATE'
  | 'BOOLEAN'
  | 'DECIMAL';

export interface CodeTableFieldDef {
  name: string;
  nameEn: string;
  dataType: CodeTableFieldDataType;
}

export type CodeTableLifecycleStatus = '草稿' | '已发布' | '已驳回' | '已下线';

export interface StandardCodeTableDef {
  id: string;
  /** 表名称 */
  tableName: string;
  /** 表编码（英文，字母数字下划线） */
  tableCode: string;
  description: string;
  directoryId: string;
  /** 完整目录路径展示 */
  directoryPath: string;
  status: CodeTableLifecycleStatus;
  recordCount: number;
  fields: CodeTableFieldDef[];
}

export interface CodeTableDirectoryNode {
  id: string;
  label: string;
  count?: number;
  children?: CodeTableDirectoryNode[];
}

export const CODE_TABLE_DIRECTORY_TREE: CodeTableDirectoryNode[] = [
  {
    id: 'root',
    label: '全部目录',
    children: [
      {
        id: 'dir-common',
        label: '公共参考码表',
        count: 2,
        children: [
          { id: 'dir-common-basic', label: '基础人口与社会', count: 1 },
          { id: 'dir-common-geo', label: '测绘与行政区划', count: 1 },
        ],
      },
      {
        id: 'dir-rs-agri',
        label: '遥感与农业',
        count: 2,
        children: [
          { id: 'dir-rs', label: '遥感影像', count: 1 },
          { id: 'dir-agri', label: '农业业务', count: 1 },
        ],
      },
    ],
  },
];

/** 与新建标准向导「值域 → 引用码表」下拉共用同一批 id */
export const STANDARD_CODE_TABLES: StandardCodeTableDef[] = [
  {
    id: 'ct-gender',
    tableName: '性别代码表',
    tableCode: 'dim_gender_gb2261',
    description: 'GB/T 2261 性别代码，用于人口与社会属性标准化。',
    directoryId: 'dir-common-basic',
    directoryPath: '公共参考码表/基础人口与社会',
    status: '已发布',
    recordCount: 8,
    fields: [
      { name: '编码', nameEn: 'code', dataType: 'STRING' },
      { name: '名称', nameEn: 'name', dataType: 'STRING' },
      { name: '备注', nameEn: 'remark', dataType: 'STRING' },
    ],
  },
  {
    id: 'ct-id-type',
    tableName: '证件类型代码表',
    tableCode: 'dim_certificate_type',
    description: '身份证件及其他有效证件类型枚举。',
    directoryId: 'dir-common-basic',
    directoryPath: '公共参考码表/基础人口与社会',
    status: '已发布',
    recordCount: 24,
    fields: [
      { name: '编码', nameEn: 'code', dataType: 'STRING' },
      { name: '名称', nameEn: 'name', dataType: 'STRING' },
    ],
  },
  {
    id: 'ct-region',
    tableName: '行政区划代码表',
    tableCode: 'dim_admin_region',
    description: '多级行政区划编码与名称映射。',
    directoryId: 'dir-common-geo',
    directoryPath: '公共参考码表/测绘与行政区划',
    status: '已发布',
    recordCount: 3521,
    fields: [
      { name: '区划代码', nameEn: 'region_code', dataType: 'STRING' },
      { name: '区划名称', nameEn: 'region_name', dataType: 'STRING' },
      { name: '上级代码', nameEn: 'parent_code', dataType: 'STRING' },
    ],
  },
  {
    id: 'ct-industry',
    tableName: '国民经济行业分类',
    tableCode: 'dim_industry_gb4754',
    description: '行业门类到细类的层级编码，可用于维度建模。',
    directoryId: 'dir-common-geo',
    directoryPath: '公共参考码表/测绘与行政区划',
    status: '已发布',
    recordCount: 1889,
    fields: [
      { name: '行业代码', nameEn: 'industry_code', dataType: 'STRING' },
      { name: '行业名称', nameEn: 'industry_name', dataType: 'STRING' },
      { name: '层级', nameEn: 'level', dataType: 'BIGINT' },
    ],
  },
  {
    id: 'ct-sensor',
    tableName: '遥感传感器类型码表',
    tableCode: 'dim_rs_sensor_type',
    description: '光学/SAR 等传感器载荷标识，用于影像元数据取值标准化。',
    directoryId: 'dir-rs',
    directoryPath: '遥感与农业/遥感影像',
    status: '已发布',
    recordCount: 42,
    fields: [
      { name: '传感器编码', nameEn: 'sensor_code', dataType: 'STRING' },
      { name: '传感器名称', nameEn: 'sensor_name', dataType: 'STRING' },
      { name: '载荷类型', nameEn: 'payload_type', dataType: 'STRING' },
    ],
  },
  {
    id: 'ct-crop',
    tableName: '农作物类别代码表',
    tableCode: 'dim_crop_category',
    description: '作物大类及细分枚举，服务长势与种植结构业务。',
    directoryId: 'dir-agri',
    directoryPath: '遥感与农业/农业业务',
    status: '草稿',
    recordCount: 0,
    fields: [
      { name: '作物代码', nameEn: 'crop_code', dataType: 'STRING' },
      { name: '作物名称', nameEn: 'crop_name', dataType: 'STRING' },
    ],
  },
];

/** 数据标准「引用码表」下拉选项（id / 展示名） */
export function getCodeTableSelectOptions(): { id: string; label: string }[] {
  return STANDARD_CODE_TABLES.filter((t) => t.status === '已发布').map((t) => ({
    id: t.id,
    label: `${t.tableName}（${t.tableCode}）`,
  }));
}

/** 新建码表时可选择的叶子目录（与左侧目录树叶子一致） */
export const CODE_TABLE_LEAF_DIRECTORIES: { id: string; path: string }[] = [
  { id: 'dir-common-basic', path: '公共参考码表/基础人口与社会' },
  { id: 'dir-common-geo', path: '公共参考码表/测绘与行政区划' },
  { id: 'dir-rs', path: '遥感与农业/遥感影像' },
  { id: 'dir-agri', path: '遥感与农业/农业业务' },
];

/** 列表展示用：优先使用存库的 directoryPath，缺失时按 directoryId 反查路径 */
export function resolveCodeTableDirectoryPath(
  row: Pick<StandardCodeTableDef, 'directoryId' | 'directoryPath'>
): string {
  const trimmed = row.directoryPath?.trim();
  if (trimmed) return trimmed;
  const byId = CODE_TABLE_LEAF_DIRECTORIES.find((d) => d.id === row.directoryId)?.path;
  if (byId) return byId;
  return row.directoryId?.trim() || '—';
}

/** 父目录 -> 下属叶子目录 id（用于左侧树选中父级时过滤列表） */
export const CODE_TABLE_DIRECTORY_CHILDREN: Record<string, string[]> = {
  'dir-common': ['dir-common-basic', 'dir-common-geo'],
  'dir-rs-agri': ['dir-rs', 'dir-agri'],
};

/** 根据关键字过滤（名称 / 编码）；可传入当前列表状态 */
export function filterCodeTables(
  keyword: string,
  source: StandardCodeTableDef[] = STANDARD_CODE_TABLES
): StandardCodeTableDef[] {
  const k = keyword.trim().toLowerCase();
  if (!k) return source;
  return source.filter(
    (t) =>
      t.tableName.toLowerCase().includes(k) ||
      t.tableCode.toLowerCase().includes(k) ||
      t.id.toLowerCase().includes(k)
  );
}

/** 追加用户新建的码表（与初始 mock 同源数组，便于引用侧读取） */
export function appendStandardCodeTable(row: StandardCodeTableDef): void {
  STANDARD_CODE_TABLES.push(row);
}

/** 按 id 整体替换码表（编辑保存） */
export function replaceStandardCodeTable(row: StandardCodeTableDef): boolean {
  const i = STANDARD_CODE_TABLES.findIndex((t) => t.id === row.id);
  if (i === -1) return false;
  STANDARD_CODE_TABLES[i] = row;
  return true;
}

/** 按 id 合并更新部分字段 */
export function patchStandardCodeTable(
  id: string,
  patch: Partial<StandardCodeTableDef>
): StandardCodeTableDef | undefined {
  const i = STANDARD_CODE_TABLES.findIndex((t) => t.id === id);
  if (i === -1) return undefined;
  const merged = { ...STANDARD_CODE_TABLES[i], ...patch };
  STANDARD_CODE_TABLES[i] = merged;
  return merged;
}

/** 删除码表 */
export function removeStandardCodeTable(id: string): boolean {
  const i = STANDARD_CODE_TABLES.findIndex((t) => t.id === id);
  if (i === -1) return false;
  STANDARD_CODE_TABLES.splice(i, 1);
  return true;
}
