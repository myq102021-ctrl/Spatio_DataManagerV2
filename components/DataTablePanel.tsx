
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  Eye,
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit2,
  LayoutList,
  LayoutGrid,
  Archive,
  RotateCcw,
  Heart,
  Share2,
  FilePlus2,
} from 'lucide-react';
import { DATA_THEME_BIND_OPTIONS, MOCK_TABLE_DATA, WORLD_MAP_SCHEMATIC_COVER_URL } from '../constants';
import type { TableRow } from '../types';
import { EditDataThemeModal } from './EditDataThemeModal';
import { PublishServiceModal } from './PublishServiceModal';
import { PaginationBar } from './PaginationBar';

export type DataTableView = 'data_list' | 'public_data_market' | 'my_favorites';

type ListingMarketConfirmState =
  | { kind: 'single'; rowId: string; action: 'list' | 'unlist' }
  | { kind: 'batch'; action: 'list' | 'unlist'; ids: string[] };

interface DataTablePanelProps {
  /** 查看详情时传入该行名称、上架状态、主题与行政区划，与详情页展示一致 */
  onViewDetail?: (payload: {
    name: string;
    listingStatus: TableRow['listingStatus'];
    themeNodeId: string;
    adminDivision?: string;
  }) => void;
  /**
   * 数据总库：展示全部入库数据，上架到集市前需确认。
   * 公共数据集市：仅展示已上架数据（与总库同一套行状态），下架直接生效。
   */
  dataView?: DataTableView;
  /**
   * 公共数据集市 / 我的收藏 共用：已收藏行 id（由 App 持久化，保证两页同步）
   */
  favoriteIds?: Set<string>;
  onToggleFavorite?: (id: string) => void;
  /** 批量加入收藏（合并进收藏集；由 App 持久化） */
  onBatchAddFavorites?: (ids: string[]) => void;
}

export const DataTablePanel: React.FC<DataTablePanelProps> = ({
  onViewDetail,
  dataView = 'data_list',
  favoriteIds: favoriteIdsProp,
  onToggleFavorite: onToggleFavoriteProp,
  onBatchAddFavorites: onBatchAddFavoritesProp,
}) => {
  const [rows, setRows] = useState<TableRow[]>(() => MOCK_TABLE_DATA.map((r) => ({ ...r })));
  const [editRowId, setEditRowId] = useState<string | null>(null);
  /** 发布服务弹窗：对应数据行 id */
  const [publishRowId, setPublishRowId] = useState<string | null>(null);
  /** 上架到公共数据集市 / 下架 二次确认（单行或批量） */
  const [listingMarketConfirm, setListingMarketConfirm] =
    useState<ListingMarketConfirmState | null>(null);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(10);
  /** 列表（表格） / 视图（卡片网格） */
  const [displayMode, setDisplayMode] = useState<'list' | 'card'>('list');
  /** 数据总库：主列表 | 回收站 */
  const [libraryPane, setLibraryPane] = useState<'main' | 'recycle_bin'>('main');
  /** 逻辑删除进入回收站的数据 */
  const [recycledRows, setRecycledRows] = useState<TableRow[]>([]);
  /** 移入回收站确认：待移动的 id 列表 */
  const [logicalDeleteConfirmIds, setLogicalDeleteConfirmIds] = useState<string[] | null>(
    null,
  );
  /** 回收站彻底删除确认：数据库物理删表 */
  const [permanentDeleteConfirmIds, setPermanentDeleteConfirmIds] = useState<string[] | null>(
    null,
  );
  /** 未接入 App 收藏态时（如数据总库）的内部占位，不会在界面中展示集市操作 */
  const [internalFavoriteIds, setInternalFavoriteIds] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const isPublicMarket = dataView === 'public_data_market';
  const isMyFavorites = dataView === 'my_favorites';
  const showMarketStyleActions = isPublicMarket || isMyFavorites;
  const favoriteIds = favoriteIdsProp ?? internalFavoriteIds;
  const requireListingMarketConfirm = dataView === 'data_list';
  const isRecyclePane = requireListingMarketConfirm && libraryPane === 'recycle_bin';
  const isMainLibraryPane = requireListingMarketConfirm && libraryPane === 'main';
  const opStickyColClass =
    isRecyclePane || showMarketStyleActions
      ? 'min-w-[200px] w-[200px]'
      : 'min-w-[260px] w-[260px]';

  const visibleRows = useMemo(() => {
    if (isMyFavorites) {
      return rows.filter(
        (r) => r.listingStatus === 'listed' && favoriteIds.has(r.id),
      );
    }
    if (isPublicMarket) return rows.filter((r) => r.listingStatus === 'listed');
    if (isRecyclePane) return recycledRows;
    return rows;
  }, [rows, recycledRows, isPublicMarket, isMyFavorites, isRecyclePane, favoriteIds]);

  const editingRow = useMemo(
    () => (editRowId ? rows.find((r) => r.id === editRowId) : undefined),
    [editRowId, rows],
  );

  const selectedCount = useMemo(
    () => visibleRows.filter((r) => r.isChecked).length,
    [visibleRows],
  );

  const selectedVisibleIds = useMemo(
    () => visibleRows.filter((r) => r.isChecked).map((r) => r.id),
    [visibleRows],
  );

  const batchFavoriteDisabled =
    selectedVisibleIds.length === 0 ||
    isMyFavorites ||
    selectedVisibleIds.every((id) => favoriteIds.has(id));

  const batchApplyDisabled = selectedVisibleIds.length === 0;

  /** 数据总库主列表：选中项上架 */
  const batchListTargetIds = useMemo(
    () =>
      isMainLibraryPane
        ? rows
            .filter((r) => r.isChecked && r.listingStatus === 'not_listed')
            .map((r) => r.id)
        : [],
    [rows, isMainLibraryPane],
  );

  /** 数据总库主列表：选中项下架 */
  const batchUnlistTargetIds = useMemo(
    () =>
      isMainLibraryPane
        ? rows
            .filter((r) => r.isChecked && r.listingStatus === 'listed')
            .map((r) => r.id)
        : [],
    [rows, isMainLibraryPane],
  );

  const totalRecords = visibleRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / Math.max(1, listPageSize)));
  const safePage = Math.min(Math.max(1, listPage), totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * listPageSize;
    return visibleRows.slice(start, start + listPageSize);
  }, [visibleRows, safePage, listPageSize]);

  useEffect(() => {
    setListPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setListPage(1);
  }, [dataView]);

  useEffect(() => {
    setListPage(1);
  }, [libraryPane]);

  useEffect(() => {
    if (!requireListingMarketConfirm) {
      setLibraryPane('main');
      setListingMarketConfirm(null);
    }
  }, [requireListingMarketConfirm]);

  const toggleRowCheck = (id: string) => {
    if (isRecyclePane) {
      setRecycledRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isChecked: !r.isChecked } : r)),
      );
    } else {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isChecked: !r.isChecked } : r)),
      );
    }
  };

  const toggleAllCheck = () => {
    const ids = new Set(visibleRows.map((r) => r.id));
    const allOn =
      visibleRows.length > 0 && visibleRows.every((r) => r.isChecked);
    const mapToggle = (prev: TableRow[]) =>
      prev.map((r) => (ids.has(r.id) ? { ...r, isChecked: !allOn } : r));
    if (isRecyclePane) setRecycledRows(mapToggle);
    else setRows(mapToggle);
  };

  const moveRowsToRecycle = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const moving = rows.filter((r) => idSet.has(r.id));
    setRows((prev) => prev.filter((r) => !idSet.has(r.id)));
    setRecycledRows((prev) => [
      ...prev,
      ...moving.map((r) => ({ ...r, isChecked: false })),
    ]);
    setLogicalDeleteConfirmIds(null);
  };

  const restoreRowsByIds = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    const moving = recycledRows.filter((r) => idSet.has(r.id));
    setRecycledRows((prev) => prev.filter((r) => !idSet.has(r.id)));
    setRows((prev) => [...prev, ...moving.map((r) => ({ ...r, isChecked: false }))]);
  };

  const purgeRecycledByIds = (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setRecycledRows((prev) => prev.filter((r) => !idSet.has(r.id)));
    setPermanentDeleteConfirmIds(null);
  };

  const openLogicalDelete = (ids: string[]) => {
    if (ids.length === 0) return;
    setLogicalDeleteConfirmIds(ids);
  };

  const toggleMarketFavorite = (id: string) => {
    if (onToggleFavoriteProp) {
      onToggleFavoriteProp(id);
      return;
    }
    setInternalFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarketApply = (_row: TableRow) => {
    /* 后续可接「申请使用数据集」流程 */
  };

  const handleBatchAddFavorites = () => {
    const ids = selectedVisibleIds;
    if (ids.length === 0 || isMyFavorites) return;
    const toAdd = ids.filter((id) => !favoriteIds.has(id));
    if (toAdd.length === 0) return;
    if (onBatchAddFavoritesProp) {
      onBatchAddFavoritesProp(toAdd);
      return;
    }
    setInternalFavoriteIds((prev) => {
      const next = new Set(prev);
      toAdd.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBatchApply = () => {
    const rowsSel = visibleRows.filter((r) => r.isChecked);
    if (rowsSel.length === 0) return;
    /* 后续可接「批量申请使用数据集」流程 */
    void rowsSel;
  };

  const handleMarketShare = async (row: TableRow) => {
    const text = row.description ? `${row.name}\n${row.description}` : row.name;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: row.name, text });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      /* 用户取消分享或权限拒绝 */
    }
  };

  const openListingMarketConfirm = (row: TableRow) => {
    setListingMarketConfirm({
      kind: 'single',
      rowId: row.id,
      action: row.listingStatus === 'not_listed' ? 'list' : 'unlist',
    });
  };

  const openBatchListingConfirm = (action: 'list' | 'unlist') => {
    const ids = action === 'list' ? batchListTargetIds : batchUnlistTargetIds;
    if (ids.length === 0) return;
    setListingMarketConfirm({ kind: 'batch', action, ids });
  };

  const handleListingMarketToggle = (row: TableRow) => {
    if (!requireListingMarketConfirm) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                listingStatus: r.listingStatus === 'listed' ? 'not_listed' : 'listed',
              }
            : r,
        ),
      );
      return;
    }
    openListingMarketConfirm(row);
  };

  const confirmListingMarketAction = () => {
    if (!listingMarketConfirm) return;
    const pending = listingMarketConfirm;
    const applyListed = (listed: boolean, ids: Set<string>) => {
      setRows((prev) =>
        prev.map((r) =>
          ids.has(r.id)
            ? { ...r, listingStatus: listed ? 'listed' : 'not_listed' }
            : r,
        ),
      );
    };
    if (pending.kind === 'single') {
      applyListed(
        pending.action === 'list',
        new Set([pending.rowId]),
      );
    } else {
      const idSet = new Set<string>(pending.ids);
      applyListed(pending.action === 'list', idSet);
    }
    setListingMarketConfirm(null);
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="group relative min-w-[200px] flex-1 max-w-xl">
          <input
            type="text"
            placeholder={
              isRecyclePane ? '搜索回收站内数据' : '请输入数据名称搜索'
            }
            className="w-full rounded-lg border border-slate-200/80 bg-slate-50 py-2 pl-4 pr-10 text-[14px] font-normal outline-none transition-all placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
        </div>

        {showMarketStyleActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={batchFavoriteDisabled}
              title={isMyFavorites ? '当前列表均为已收藏数据' : undefined}
              onClick={handleBatchAddFavorites}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[13px] font-medium text-rose-700 shadow-sm transition-colors hover:bg-rose-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <Heart size={15} strokeWidth={2.25} />
              批量收藏
            </button>
            <button
              type="button"
              disabled={batchApplyDisabled}
              onClick={handleBatchApply}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[13px] font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <FilePlus2 size={15} strokeWidth={2.25} />
              批量申请
            </button>
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {requireListingMarketConfirm &&
            (libraryPane === 'main' ? (
              <button
                type="button"
                onClick={() => setLibraryPane('recycle_bin')}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                <Archive size={15} strokeWidth={2.25} />
                回收站
                {recycledRows.length > 0 ? (
                  <span className="min-w-[1.25rem] rounded-full bg-slate-200 px-1.5 text-center text-[11px] font-bold text-slate-700">
                    {recycledRows.length}
                  </span>
                ) : null}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLibraryPane('main')}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100/80"
              >
                返回数据列表
              </button>
            ))}

          {/* 列表 | 视图 */}
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-inner"
            role="group"
            aria-label="列表与视图切换"
          >
            <button
              type="button"
              onClick={() => setDisplayMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold transition-all ${
                displayMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList size={15} strokeWidth={2.25} />
              列表
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('card')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-semibold transition-all ${
                displayMode === 'card'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} strokeWidth={2.25} />
              视图
            </button>
          </div>

          {isMainLibraryPane && selectedCount > 0 && (
            <>
              <button
                type="button"
                disabled={batchListTargetIds.length === 0}
                onClick={() => openBatchListingConfirm('list')}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[13px] font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowUpCircle size={15} strokeWidth={2.25} />
                上架
              </button>
              <button
                type="button"
                disabled={batchUnlistTargetIds.length === 0}
                onClick={() => openBatchListingConfirm('unlist')}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowDownCircle size={15} strokeWidth={2.25} />
                下架
              </button>
            </>
          )}

          {isRecyclePane && selectedCount > 0 && (
            <>
              <button
                type="button"
                onClick={() =>
                  restoreRowsByIds(
                    recycledRows.filter((r) => r.isChecked).map((r) => r.id),
                  )
                }
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[13px] font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50"
              >
                <RotateCcw size={15} strokeWidth={2.25} />
                批量恢复
              </button>
              <button
                type="button"
                onClick={() =>
                  setPermanentDeleteConfirmIds(
                    recycledRows.filter((r) => r.isChecked).map((r) => r.id),
                  )
                }
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[13px] font-medium text-rose-700 shadow-sm transition-colors hover:bg-rose-50"
              >
                <Trash2 size={15} strokeWidth={2.25} />
                批量确认删除
              </button>
            </>
          )}

          {isMainLibraryPane && (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={() =>
                openLogicalDelete(rows.filter((r) => r.isChecked).map((r) => r.id))
              }
              className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-medium text-white shadow-sm shadow-blue-100 transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-40"
            >
              <Trash2 size={14} />
              删除
            </button>
          )}
        </div>
      </div>

      {displayMode === 'list' ? (
        <div className="scroll-x-hover-only isolate min-h-0 w-full min-w-0 flex-1 overflow-auto rounded-lg border border-slate-100 bg-white pb-1">
          <table className="w-full min-w-[1200px] border-collapse text-[13px]">
            <thead className="sticky top-0 z-10 bg-sky-50 text-slate-600 shadow-[inset_0_-1px_0_0_rgb(241_245_249)]">
              <tr>
                <th className="w-12 min-w-[48px] border-b border-slate-100 p-3 text-center font-semibold">
                  <input
                    type="checkbox"
                    checked={
                      visibleRows.length > 0 &&
                      visibleRows.every((r) => r.isChecked)
                    }
                    onChange={toggleAllCheck}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="min-w-[168px] border-b border-slate-100 p-3 text-left font-semibold text-slate-700 whitespace-nowrap">
                  数据名称
                </th>
                <th className="w-[96px] min-w-[96px] border-b border-slate-100 p-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                  数据类型
                </th>
                <th className="w-[168px] min-w-[168px] border-b border-slate-100 p-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                  入库时间
                </th>
                <th className="w-[100px] min-w-[100px] border-b border-slate-100 p-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                  数据量
                </th>
                <th className="w-[100px] min-w-[100px] border-b border-slate-100 p-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                  发布状态
                </th>
                <th className="min-w-[108px] border-b border-slate-100 p-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                  上架状态
                </th>
                <th
                  className={`data-table-op-sticky-head sticky right-0 top-0 z-[30] border-b border-l border-slate-200 bg-sky-50 p-3 text-center font-semibold text-slate-700 whitespace-nowrap ${opStickyColClass}`}
                >
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-[14px] text-slate-500"
                  >
                    {isRecyclePane
                      ? '回收站暂无数据'
                      : isMyFavorites
                        ? '暂无收藏数据，请在公共数据集市中收藏'
                        : '暂无数据'}
                  </td>
                  <td
                    className={`data-table-op-sticky-cell sticky right-0 z-[20] border-l border-slate-200 bg-white ${opStickyColClass}`}
                    aria-hidden
                  />
                </tr>
              ) : (
                pageRows.map((row) => (
                <tr key={row.id} className="group data-table-op-row bg-white transition-colors hover:bg-slate-50">
                  <td className="p-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={row.isChecked}
                      onChange={() => toggleRowCheck(row.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="min-w-[168px] p-3 align-middle">
                    <div className="truncate font-medium text-slate-800" title={row.name}>
                      {row.name}
                    </div>
                  </td>
                  <td className="w-[96px] min-w-[96px] p-3 text-center align-middle whitespace-nowrap tabular-nums text-slate-600">
                    {row.dataType}
                  </td>
                  <td className="min-w-[168px] p-3 text-center align-middle tabular-nums text-slate-600 whitespace-nowrap">
                    {row.ingestTime}
                  </td>
                  <td className="p-3 text-center align-middle tabular-nums text-slate-600">{row.dataVolume}</td>
                  <td className="p-3 text-center align-middle text-slate-600">{row.publishStatus}</td>
                  <td className="min-w-[108px] p-3 text-center align-middle whitespace-nowrap">
                    <span
                      className={`
                      inline-block rounded-md px-2.5 py-0.5 text-[12px] font-medium
                      ${row.listingStatus === 'listed'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                        : 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'}
                    `}
                    >
                      {row.listingStatus === 'listed' ? '已上架' : '未上架'}
                    </span>
                  </td>
                  <td
                    className={`data-table-op-sticky-cell sticky right-0 z-[20] border-l border-slate-200 bg-white p-3 text-center align-middle group-hover:bg-slate-50 ${opStickyColClass}`}
                  >
                    {isRecyclePane ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreRowsByIds([row.id])}
                          className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
                        >
                          恢复数据
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermanentDeleteConfirmIds([row.id])}
                          className="rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1.5 text-[12px] font-semibold text-rose-800 transition-colors hover:bg-rose-100"
                        >
                          确认删除
                        </button>
                      </div>
                    ) : showMarketStyleActions ? (
                      <div className="flex flex-nowrap items-center justify-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                        <IconActionButton
                          icon={<Eye size={15} />}
                          title="查看详情"
                          onClick={() =>
                            onViewDetail?.({
                              name: row.name,
                              listingStatus: row.listingStatus,
                              themeNodeId: row.themeNodeId,
                              ...(row.adminDivision != null && row.adminDivision !== ''
                                ? { adminDivision: row.adminDivision }
                                : {}),
                            })
                          }
                        />
                        <IconActionButton
                          variant={
                            favoriteIds.has(row.id) ? 'favoriteActive' : 'default'
                          }
                          icon={
                            <Heart
                              size={15}
                              className={
                                favoriteIds.has(row.id) ? 'fill-current' : undefined
                              }
                            />
                          }
                          title={favoriteIds.has(row.id) ? '取消收藏' : '收藏'}
                          onClick={() => toggleMarketFavorite(row.id)}
                        />
                        <IconActionButton
                          icon={<FilePlus2 size={15} />}
                          title="申请"
                          onClick={() => handleMarketApply(row)}
                        />
                        <IconActionButton
                          icon={<Share2 size={15} />}
                          title="分享"
                          onClick={() => void handleMarketShare(row)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-nowrap items-center justify-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                        <IconActionButton
                          icon={<Eye size={15} />}
                          title="查看详情"
                          onClick={() =>
                            onViewDetail?.({
                              name: row.name,
                              listingStatus: row.listingStatus,
                              themeNodeId: row.themeNodeId,
                              ...(row.adminDivision != null && row.adminDivision !== ''
                                ? { adminDivision: row.adminDivision }
                                : {}),
                            })
                          }
                        />
                        <IconActionButton
                          icon={<Edit2 size={15} />}
                          title="编辑主题"
                          onClick={() => setEditRowId(row.id)}
                        />
                        <IconActionButton
                          icon={<PlusCircle size={15} />}
                          title="发布服务"
                          onClick={() => setPublishRowId(row.id)}
                        />
                        <IconActionButton
                          icon={<ArrowUpCircle size={15} />}
                          title="上架/下架集市"
                          onClick={() => handleListingMarketToggle(row)}
                        />
                        <IconActionButton
                          icon={<Trash2 size={15} />}
                          title="删除（移入回收站）"
                          onClick={() => openLogicalDelete([row.id])}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-1">
          {/* 随屏宽变化：默认大屏一行 3 张；仅超宽屏(2xl) 才 4 列，避免中等宽度仍挤 4 列 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {pageRows.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-16 text-center text-[14px] text-slate-500">
                {isRecyclePane
                  ? '回收站暂无数据'
                  : isMyFavorites
                    ? '暂无收藏数据，请在公共数据集市中收藏'
                    : '暂无数据'}
              </div>
            ) : (
              pageRows.map((row) => (
              <article
                key={row.id}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition-all hover:border-blue-200/80 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-b from-slate-200/90 to-slate-300/80">
                  <img
                    src={WORLD_MAP_SCHEMATIC_COVER_URL}
                    alt=""
                    className="h-full w-full object-cover object-center grayscale contrast-[0.92] opacity-[0.92]"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-800/5 to-transparent" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/35 backdrop-blur-[2px]">
                    <input
                      type="checkbox"
                      checked={row.isChecked}
                      onChange={() => toggleRowCheck(row.id)}
                      className="h-3.5 w-3.5 rounded border-white/60 bg-white/90 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-1 px-3 pb-3 pt-2.5">
                  {/* 第一行：数据名称 */}
                  <h3
                    className="shrink-0 truncate text-[13px] font-black leading-snug text-slate-800"
                    title={row.name}
                  >
                    {row.name}
                  </h3>
                  {/* 第二行：描述最多两行；flex 内需 min-h-0，否则 line-clamp 易露出第三行笔画 */}
                  <p
                    className="min-h-0 line-clamp-2 overflow-hidden text-[11px] leading-snug text-slate-500 [overflow-wrap:anywhere]"
                    title={row.description || undefined}
                  >
                    {row.description ?? '—'}
                  </p>
                  {/* 第三行：标签单行 */}
                  <div
                    className="flex shrink-0 flex-nowrap gap-1.5 overflow-hidden pt-0.5"
                    title={(row.tags?.length ? row.tags : ['未分类']).join(' · ')}
                  >
                    {(row.tags?.length ? row.tags : ['未分类']).map((tag) => (
                      <span
                        key={tag}
                        className="shrink-0 rounded border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto w-full min-w-0 border-t border-slate-100 pt-1">
                    {isRecyclePane ? (
                      <div className="flex w-full min-w-0 gap-2 px-0.5 py-1">
                        <button
                          type="button"
                          onClick={() => restoreRowsByIds([row.id])}
                          className="min-h-[32px] flex-1 rounded-md border border-emerald-200 bg-emerald-50/90 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          恢复数据
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermanentDeleteConfirmIds([row.id])}
                          className="min-h-[32px] flex-1 rounded-md border border-rose-200 bg-rose-50/90 py-1.5 text-[11px] font-bold text-rose-800 hover:bg-rose-100"
                        >
                          确认删除
                        </button>
                      </div>
                    ) : showMarketStyleActions ? (
                      <div className="flex w-full min-w-0 divide-x divide-slate-100">
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<Eye size={14} />}
                            title="查看详情"
                            onClick={() =>
                              onViewDetail?.({
                                name: row.name,
                                listingStatus: row.listingStatus,
                                themeNodeId: row.themeNodeId,
                                ...(row.adminDivision != null && row.adminDivision !== ''
                                  ? { adminDivision: row.adminDivision }
                                  : {}),
                              })
                            }
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            variant={
                              favoriteIds.has(row.id) ? 'favoriteActive' : 'default'
                            }
                            icon={
                              <Heart
                                size={14}
                                className={
                                  favoriteIds.has(row.id) ? 'fill-current' : undefined
                                }
                              />
                            }
                            title={favoriteIds.has(row.id) ? '取消收藏' : '收藏'}
                            onClick={() => toggleMarketFavorite(row.id)}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<FilePlus2 size={14} />}
                            title="申请"
                            onClick={() => handleMarketApply(row)}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<Share2 size={14} />}
                            title="分享"
                            onClick={() => void handleMarketShare(row)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex w-full min-w-0 divide-x divide-slate-100">
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<Eye size={14} />}
                            title="查看详情"
                            onClick={() =>
                              onViewDetail?.({
                                name: row.name,
                                listingStatus: row.listingStatus,
                                themeNodeId: row.themeNodeId,
                                ...(row.adminDivision != null && row.adminDivision !== ''
                                  ? { adminDivision: row.adminDivision }
                                  : {}),
                              })
                            }
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<Edit2 size={14} />}
                            title="编辑主题"
                            onClick={() => setEditRowId(row.id)}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<PlusCircle size={14} />}
                            title="发布服务"
                            onClick={() => setPublishRowId(row.id)}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<ArrowUpCircle size={14} />}
                            title="上架/下架集市"
                            onClick={() => handleListingMarketToggle(row)}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center py-0.5">
                          <IconActionButton
                            compact
                            icon={<Trash2 size={14} />}
                            title="删除（移入回收站）"
                            onClick={() => openLogicalDelete([row.id])}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))
            )}
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <PaginationBar
          total={totalRecords}
          page={listPage}
          pageSize={listPageSize}
          onPageChange={setListPage}
          onPageSizeChange={(s) => {
            setListPageSize(s);
            setListPage(1);
          }}
          pageSizeOptions={[10, 12, 20, 50, 100]}
          leftExtra={
            <span className="text-slate-500">
              已选中 <span className="font-semibold text-blue-500">{selectedCount}</span> 条
            </span>
          }
        />
      </div>

      {editingRow && (
        <EditDataThemeModal
          open
          dataName={editingRow.name}
          options={DATA_THEME_BIND_OPTIONS}
          currentThemeId={editingRow.themeNodeId}
          onClose={() => setEditRowId(null)}
          onConfirm={(themeId) => {
            setRows((prev) =>
              prev.map((r) => (r.id === editingRow.id ? { ...r, themeNodeId: themeId } : r)),
            );
            setEditRowId(null);
          }}
        />
      )}

      <PublishServiceModal
        open={publishRowId !== null}
        defaultApiName={rows.find((r) => r.id === publishRowId)?.name ?? ''}
        onClose={() => setPublishRowId(null)}
        onConfirm={() => setPublishRowId(null)}
      />

      {requireListingMarketConfirm && listingMarketConfirm !== null && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setListingMarketConfirm(null)}
            aria-label="关闭"
          />
          <div
            className="relative w-full max-w-[420px] rounded-xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-market-confirm-title"
          >
            <h3 id="listing-market-confirm-title" className="sr-only">
              公共数据集市上架确认
            </h3>
            <p className="text-center text-[15px] leading-relaxed text-slate-700">
              {listingMarketConfirm.kind === 'batch' ? (
                listingMarketConfirm.action === 'list' ? (
                  <>
                    确定要将选中的{' '}
                    <strong className="text-slate-900">
                      {listingMarketConfirm.ids.length}
                    </strong>{' '}
                    条数据上架到<strong className="text-slate-900">【公共数据集市】</strong>吗？
                  </>
                ) : (
                  <>
                    确定要将选中的{' '}
                    <strong className="text-slate-900">
                      {listingMarketConfirm.ids.length}
                    </strong>{' '}
                    条数据从<strong className="text-slate-900">【公共数据集市】</strong>下架吗？
                  </>
                )
              ) : listingMarketConfirm.action === 'list' ? (
                <>
                  确定要上架数据到<strong className="text-slate-900">【公共数据集市】</strong>吗？
                </>
              ) : (
                <>
                  确定要从<strong className="text-slate-900">【公共数据集市】</strong>下架该数据吗？
                </>
              )}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setListingMarketConfirm(null)}
                className="min-w-[88px] rounded-lg border border-blue-200 bg-white px-5 py-2 text-[14px] font-medium text-blue-600 hover:bg-blue-50/80"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmListingMarketAction}
                className="min-w-[88px] rounded-lg bg-blue-600 px-5 py-2 text-[14px] font-medium text-white shadow-sm hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {logicalDeleteConfirmIds !== null && (
        <div className="fixed inset-0 z-[211] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setLogicalDeleteConfirmIds(null)}
            aria-label="关闭"
          />
          <div
            className="relative w-full max-w-[440px] rounded-xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20"
            role="dialog"
            aria-modal="true"
          >
            <p className="text-center text-[15px] leading-relaxed text-slate-700">
              确认将选中的{' '}
              <strong className="text-slate-900">{logicalDeleteConfirmIds.length}</strong>{' '}
              条数据移入回收站吗？
            </p>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-slate-500">
              移入后可在「回收站」恢复或彻底删除。此为逻辑删除，数据从总库列表移除但数据库表仍保留。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setLogicalDeleteConfirmIds(null)}
                className="min-w-[88px] rounded-lg border border-blue-200 bg-white px-5 py-2 text-[14px] font-medium text-blue-600 hover:bg-blue-50/80"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => moveRowsToRecycle(logicalDeleteConfirmIds)}
                className="min-w-[88px] rounded-lg bg-blue-600 px-5 py-2 text-[14px] font-medium text-white shadow-sm hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {permanentDeleteConfirmIds !== null && (
        <div className="fixed inset-0 z-[212] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setPermanentDeleteConfirmIds(null)}
            aria-label="关闭"
          />
          <div
            className="relative w-full max-w-[440px] rounded-xl border border-rose-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20"
            role="dialog"
            aria-modal="true"
          >
            <p className="text-center text-[15px] leading-relaxed text-slate-800">
              确认彻底删除选中的{' '}
              <strong className="text-rose-700">{permanentDeleteConfirmIds.length}</strong>{' '}
              条数据吗？
            </p>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-slate-500">
              此操作将删除数据库中的物理表，且<strong className="text-slate-700">不可恢复</strong>。
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPermanentDeleteConfirmIds(null)}
                className="min-w-[88px] rounded-lg border border-slate-200 bg-white px-5 py-2 text-[14px] font-medium text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => purgeRecycledByIds(permanentDeleteConfirmIds)}
                className="min-w-[88px] rounded-lg bg-rose-600 px-5 py-2 text-[14px] font-medium text-white shadow-sm hover:bg-rose-700"
              >
                彻底删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IconActionButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  /** 视图卡片底部等窄条区域 */
  compact?: boolean;
  variant?: 'default' | 'favoriteActive';
}> = ({ icon, title, onClick, compact, variant = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={
      variant === 'favoriteActive'
        ? `text-rose-500 transition-colors hover:bg-rose-50 ${compact ? 'rounded-md p-1' : 'rounded-lg p-2'}`
        : `text-blue-600 transition-colors hover:bg-blue-50 ${compact ? 'rounded-md p-1' : 'rounded-lg p-2'}`
    }
  >
    {icon}
  </button>
);
