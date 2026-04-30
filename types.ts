
import { ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: MenuItem[];
  isActive?: boolean;
  type?: 'item' | 'header';
}

export interface TableRow {
  id: string;
  name: string;
  collectionTime: string;
  storageTime: string;
  isChecked: boolean;
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
