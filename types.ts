
import { ReactNode } from 'react';

/** 治理工具：外部引用（可跳转链接）或自定义（名称与说明，无外链） */
export type GovernanceToolMode = 'external' | 'custom';

export interface GovernanceTool {
  id: string;
  mode: GovernanceToolMode;
  name: string;
  description: string;
  /** 仅 external 模式使用 */
  link?: string;
  /** 卡片图标；不填时外部工具会按 link 的域名自动解析网站 favicon */
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: MenuItem[];
  isActive?: boolean;
  type?: 'item' | 'header';
}

/** 可选的数据主题绑定项（与左侧数据主题树叶子/可选节点一致） */
export interface DataThemeBindOption {
  id: string;
  path: string;
}

export interface TableRow {
  id: string;
  name: string;
  /** 数据类型，如 tiff */
  dataType: string;
  /** 入库时间 */
  ingestTime: string;
  /** 数据量展示文案，如 8.26 GB */
  dataVolume: string;
  /** 发布状态 */
  publishStatus: string;
  /** 上架状态 */
  listingStatus: 'listed' | 'not_listed';
  isChecked: boolean;
  /** 入库绑定的数据主题节点 id（编辑弹窗用） */
  themeNodeId: string;
  /** 行政区划（详情元信息展示/编辑，可选） */
  adminDivision?: string;
  /** 卡片视图简要说明（一至两行展示，超出悬浮见全文） */
  description?: string;
  /** 卡片视图标签（单行展示，可多枚） */
  tags?: string[];
}

export interface TreeNode {
  id: string;
  label: string;
  type: 'category' | 'folder' | 'dataset' | 'map';
  children?: TreeNode[];
  expanded?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  closable?: boolean;
  active?: boolean;
}

export interface ApplicationRecord {
    id: string;
    serviceId: string;
    serviceName: string;
    category: string;
    type: string;
    duration: string;
    status: 'pending' | 'approved' | 'rejected';
    applyTime: string;
    protocols: string[];
    applicant?: string;
    source?: string;
    auditOpinion?: string;
    appKey?: string;
    appSecret?: string;
}

export interface MarketNode {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  children?: MarketNode[];
}

/** 数据密级（L1–L4 等） */
export interface DataSensitivity {
  id: string;
  code: string;
  name: string;
  sensitivity: string;
  impact: string;
  securityLevel: string;
  processingMethod: string;
  createTime: string;
}

/** 业务字段与脱敏/策略配置 */
export interface SensitiveDataConfig {
  id: string;
  dataSource: string;
  dbSchema: string;
  tableName: string;
  columnName: string;
  maskingAlgorithm: string;
  status: 'enabled' | 'disabled';
}

/** 敏感信息自动识别规则 */
export interface IdentificationRule {
  id: string;
  name: string;
  method: string;
  matchPattern: string;
  excludePattern?: string;
  maskingAlgorithm: string;
  status: 'enabled' | 'disabled';
  description?: string;
}
