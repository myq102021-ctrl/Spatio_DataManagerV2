import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

export interface PaginationBarProps {
  /** 总条数 */
  total: number;
  /** 当前页，从 1 开始 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  onPageChange: (page: number) => void;
  /** 不传则「每页条数」为只读展示 */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showQuickJumper?: boolean;
  /** 显示在「共 N 条」右侧的附加说明 */
  leftExtra?: React.ReactNode;
  /** 仅渲染右侧控件（页容量、翻页、前往），左侧由外层自行排版 */
  controlsOnly?: boolean;
  className?: string;
}

function computeVisiblePages(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set<number>([1, totalPages]);
  for (let i = page - 2; i <= page + 2; i++) {
    if (i >= 1 && i <= totalPages) set.add(i);
  }
  const sorted = Array.from(set).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(sorted[i]);
  }
  return out;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  showQuickJumper = true,
  leftExtra,
  controlsOnly = false,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const [jumpInput, setJumpInput] = useState(String(safePage));

  useEffect(() => {
    setJumpInput(String(safePage));
  }, [safePage]);

  const pageNumbers = useMemo(() => computeVisiblePages(safePage, totalPages), [safePage, totalPages]);

  const commitJump = () => {
    const n = parseInt(jumpInput, 10);
    if (Number.isFinite(n)) {
      const p = Math.min(Math.max(1, n), totalPages);
      onPageChange(p);
      setJumpInput(String(p));
    } else {
      setJumpInput(String(safePage));
    }
  };

  const sizeControl =
    onPageSizeChange ? (
      <div className="relative">
        <select
          value={pageSize}
          onChange={(e) => {
            const next = Number(e.target.value);
            onPageSizeChange(next);
            onPageChange(1);
          }}
          className="h-8 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-8 text-[13px] font-medium text-slate-600 outline-none transition-colors hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}条/页
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    ) : (
      <span className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] font-medium text-slate-500">
        {pageSize}条/页
      </span>
    );

  const navCluster = (
    <>
      {sizeControl}
      <div className="flex items-center gap-1">
        <NavBtn disabled={safePage <= 1} onClick={() => onPageChange(safePage - 1)} title="上一页">
          <ChevronLeft size={16} />
        </NavBtn>
        {pageNumbers.map((item, idx) =>
          item === 'ellipsis' ? (
            <span
              key={`e-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-1.5 text-[13px] font-medium transition-colors ${
                item === safePage
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              {item}
            </button>
          ),
        )}
        <NavBtn
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          title="下一页"
        >
          <ChevronRight size={16} />
        </NavBtn>
      </div>
      {showQuickJumper && (
        <div className="flex items-center gap-1.5 text-[13px] text-slate-600">
          <span>前往</span>
          <input
            type="text"
            inputMode="numeric"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onBlur={commitJump}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commitJump())}
            className="h-8 w-10 rounded-lg border border-slate-200 bg-white text-center text-[13px] font-semibold text-blue-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
          <span>页</span>
        </div>
      )}
    </>
  );

  if (controlsOnly) {
    return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{navCluster}</div>;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-600 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span>
          共 <span className="font-medium text-slate-800">{total.toLocaleString()}</span> 条
        </span>
        {leftExtra}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">{navCluster}</div>
    </div>
  );
};

const NavBtn: React.FC<{
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}> = ({ disabled, onClick, title, children }) => (
  <button
    type="button"
    disabled={disabled}
    title={title}
    onClick={onClick}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-35"
  >
    {children}
  </button>
);
