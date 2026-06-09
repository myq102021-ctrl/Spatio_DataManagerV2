import React, { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

const RENDER_STYLE_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: '请选择样式文件' },
  { id: 'default_raster', label: 'default_raster_style.sld' },
  { id: 'admin_boundary', label: 'admin_boundary_style.sld' },
  { id: 'dem_hillshade', label: 'dem_hillshade_style.sld' },
  { id: 'satellite_rgb', label: 'satellite_truecolor.sld' },
];

export interface PublishServiceModalProps {
  open: boolean;
  /** 默认填充 API 名称，一般为当前行数据名称 */
  defaultApiName: string;
  onClose: () => void;
  onConfirm: (payload: { apiName: string; description: string; styleId: string }) => void;
}

export const PublishServiceModal: React.FC<PublishServiceModalProps> = ({
  open,
  defaultApiName,
  onClose,
  onConfirm,
}) => {
  const [apiName, setApiName] = useState(defaultApiName);
  const [description, setDescription] = useState('');
  const [styleId, setStyleId] = useState('');

  useEffect(() => {
    if (open) {
      setApiName(defaultApiName);
      setDescription('');
      setStyleId('');
    }
  }, [open, defaultApiName]);

  if (!open) return null;

  const handleSubmit = () => {
    const name = apiName.trim();
    if (!name) return;
    if (!styleId) return;
    onConfirm({ apiName: name, description: description.trim(), styleId });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="关闭"
      />
      <div
        className="relative w-full max-w-md rounded-xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-service-title"
      >
        <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-slate-200/60 px-5 py-4">
          <h3 id="publish-service-title" className="text-[15px] font-bold text-slate-900">
            发布服务设置
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-slate-700">
              <span className="mr-0.5 text-red-500">*</span>
              API名称
            </label>
            <input
              type="text"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              placeholder="请输入 API 名称"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-slate-700">API描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="请输入描述"
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[14px] text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-slate-700">
              <span className="mr-0.5 text-red-500">*</span>
              渲染方案
            </label>
            <div className="relative">
              <select
                value={styleId}
                onChange={(e) => setStyleId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-10 text-[14px] text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              >
                {RENDER_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.id || 'placeholder'} value={opt.id} disabled={opt.id === ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 rounded-b-xl border-t border-slate-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[88px] rounded-lg border border-blue-200 bg-white px-5 py-2 text-[14px] font-medium text-blue-600 hover:bg-blue-50/80"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!apiName.trim() || !styleId}
            className="min-w-[88px] rounded-lg bg-blue-600 px-5 py-2 text-[14px] font-medium text-white shadow-sm shadow-blue-100 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
