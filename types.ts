
import { ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  children?: MenuItem[];
  isActive?: boolean;
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
