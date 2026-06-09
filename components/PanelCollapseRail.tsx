import React from 'react';
import { CollapseRailHandle } from './CollapseRailHandle';

export interface PanelCollapseRailProps {
  /** 控制的是左侧还是右侧面板 */
  side: 'left' | 'right';
  /** 对应面板是否已收起 */
  collapsed: boolean;
  onToggle: () => void;
  /** 无障碍说明 */
  expandLabel?: string;
  collapseLabel?: string;
}

/**
 * 面板收缩条：细竖线 + 垂直居中胶囊手柄
 */
export const PanelCollapseRail: React.FC<PanelCollapseRailProps> = ({
  side,
  collapsed,
  onToggle,
  expandLabel = '展开面板',
  collapseLabel = '收起面板',
}) => {
  return (
    <div
      className="relative z-20 flex w-3 shrink-0 self-stretch"
      role="separator"
      aria-orientation="vertical"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200/90"
        aria-hidden
      />
      <CollapseRailHandle
        side={side}
        collapsed={collapsed}
        onToggle={onToggle}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      />
    </div>
  );
};
