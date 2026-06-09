import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface CollapseRailHandleProps {
  /** 控制的是左侧还是右侧面板 */
  side: 'left' | 'right';
  /** 对应面板是否已收起 */
  collapsed: boolean;
  onToggle: () => void;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
}

/**
 * 收缩条胶囊手柄：白底圆角、细边框、轻阴影 + 方向箭头
 */
export const CollapseRailHandle: React.FC<CollapseRailHandleProps> = ({
  side,
  collapsed,
  onToggle,
  expandLabel = '展开',
  collapseLabel = '收起',
  className = '',
}) => {
  const chevronPointsOut =
    (side === 'left' && !collapsed) || (side === 'right' && collapsed);

  return (
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? expandLabel : collapseLabel}
      aria-label={collapsed ? expandLabel : collapseLabel}
      aria-expanded={!collapsed}
      className={`group/rail flex h-11 w-[15px] shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 shadow-[0_1px_5px_rgba(15,23,42,0.1)] backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-[0_2px_8px_rgba(15,23,42,0.14)] active:scale-95 ${className}`}
    >
      <ChevronLeft
        size={14}
        strokeWidth={2.25}
        className={`text-slate-500 transition-transform duration-200 group-hover/rail:text-slate-700 ${
          chevronPointsOut ? '' : 'rotate-180'
        }`}
      />
    </button>
  );
};
