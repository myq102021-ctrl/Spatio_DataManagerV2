import React from 'react';
import { X, FileText, ListOrdered } from 'lucide-react';
import type { IngestionTaskDetailPayload } from '../lib/ingestionTaskDetail';
import { ingestionScopeLabel, ingestionTaskStatusLabel } from '../lib/ingestionTaskDetail';

interface IngestionTaskDetailDrawerProps {
  detail: IngestionTaskDetailPayload;
  onClose: () => void;
}

const DetailRow: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}> = ({ label, value, mono }) => (
  <div className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <span className="w-[88px] shrink-0 text-[12px] text-slate-400">{label}</span>
    <span
      className={`min-w-0 flex-1 text-[13px] text-slate-700 break-all leading-relaxed ${
        mono ? 'font-mono text-[12px]' : 'font-medium'
      }`}
    >
      {value}
    </span>
  </div>
);

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center gap-2 border-b border-slate-50 pb-3">
      <div className="w-1 h-4 rounded-full bg-blue-600" />
      <span className="text-slate-400">{icon}</span>
      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
    </div>
    {children}
  </div>
);

const DATA_INFO_ROWS: { label: string; key: keyof Pick<
  IngestionTaskDetailPayload,
  'dataLayer' | 'dataType'
> }[] = [
  { label: '数据分层', key: 'dataLayer' },
  { label: '数据类型', key: 'dataType' },
];

const DataInfoTable: React.FC<{ detail: IngestionTaskDetailPayload }> = ({ detail }) => (
  <table className="w-full border-collapse border border-slate-200/90 text-[13px]">
    <tbody>
      {DATA_INFO_ROWS.map(({ label, key }) => (
        <tr key={key} className="border-b border-slate-200/90">
          <td className="w-[96px] shrink-0 bg-[#eef5fb] px-3 py-2.5 text-center font-medium text-slate-600">
            {label}
          </td>
          <td className="bg-white px-3 py-2.5 text-slate-800 break-all">{detail[key] || '—'}</td>
        </tr>
      ))}
      <tr>
        <td className="w-[96px] shrink-0 bg-[#eef5fb] px-3 py-2.5 text-center font-medium text-slate-600">
          数据主题
        </td>
        <td className="bg-white px-3 py-2.5">
          {detail.dataThemePath && detail.dataThemePath !== '—' ? (
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 flex-1 font-medium leading-snug text-slate-800 break-all">
                {detail.dataThemePath}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-slate-400">
                {detail.dataThemeNodeId}
              </span>
            </div>
          ) : (
            <span className="text-slate-500">—</span>
          )}
        </td>
      </tr>
    </tbody>
  </table>
);

const StatusBadge: React.FC<{ status: IngestionTaskDetailPayload['status'] }> = ({ status }) => {
  const label = ingestionTaskStatusLabel(status);
  const cls =
    status === 'success'
      ? 'bg-green-50 text-green-600 border-green-100'
      : status === 'failure'
        ? 'bg-red-50 text-red-500 border-red-100'
        : status === 'pending'
          ? 'bg-slate-50 text-slate-600 border-slate-200'
          : 'bg-amber-50 text-amber-700 border-amber-100';
  return (
    <span className={`inline-block rounded border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
};

export const IngestionTaskDetailDrawer: React.FC<IngestionTaskDetailDrawerProps> = ({
  detail,
  onClose,
}) => (
  <>
    <div
      className="absolute inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] transition-opacity"
      onClick={onClose}
      aria-hidden
    />
    <aside
      className="absolute top-0 right-0 z-50 flex h-full w-[420px] flex-col border-l border-slate-200 bg-white shadow-2xl animate-slideLeft"
      role="dialog"
      aria-labelledby="ingestion-task-detail-title"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 id="ingestion-task-detail-title" className="text-base font-bold text-slate-800">
          查看详情
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          aria-label="关闭"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto bg-[#f8fafc] p-5 custom-scrollbar">
        <Section title="基础信息" icon={<FileText size={14} className="text-blue-500" />}>
          <DetailRow label="任务名称" value={detail.name} />
          <DetailRow label="创建用户" value={detail.creator} />
          <DetailRow label="创建时间" value={detail.createTime} mono />
          <DetailRow label="结束时间" value={detail.endTime ?? '—'} mono />
          <DetailRow label="耗时" value={detail.duration ?? '—'} />
        </Section>

        <Section title="任务信息" icon={<ListOrdered size={14} className="text-indigo-500" />}>
          <DetailRow label="任务组名称" value={detail.batchGroupName ?? '—'} />
          <DetailRow label="子任务名称" value={detail.subTaskName ?? '—'} />
          <DetailRow label="任务状态" value={<StatusBadge status={detail.status} />} />
          <DetailRow label="任务类型" value={detail.taskType || '—'} />
          <DetailRow label="入库方式" value={ingestionScopeLabel(detail.ingestionMode)} />
        </Section>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-3 text-sm font-bold text-slate-800">数据信息</h4>
          <DataInfoTable detail={detail} />
        </div>
      </div>

      <div className="flex shrink-0 justify-end border-t border-slate-100 bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-100 px-6 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
        >
          关闭
        </button>
      </div>
    </aside>
  </>
);
