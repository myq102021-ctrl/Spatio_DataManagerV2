import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, Plus, Trash2, Wand2, X } from 'lucide-react';
import type {
  CodeTableFieldDataType,
  CodeTableFieldDef,
  StandardCodeTableDef,
} from '../standardCodeTableMock';
import { CODE_TABLE_LEAF_DIRECTORIES } from '../standardCodeTableMock';

const FIELD_TYPES: CodeTableFieldDataType[] = [
  'STRING',
  'BIGINT',
  'DOUBLE',
  'TIMESTAMP',
  'DATE',
  'BOOLEAN',
  'DECIMAL',
];

const DOC_LINK =
  'https://support.huaweicloud.com/usermanual-dataartsstudio/dataartsstudio_01_0604.html';

function genId(): string {
  return `ct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function isValidEnglishIdentifier(s: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s.trim());
}

interface FieldRow extends CodeTableFieldDef {
  _key: string;
}

export interface CreateCodeTableModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (table: StandardCodeTableDef) => void;
  /** 传入时表示编辑该码表（表编码只读） */
  editingTable?: StandardCodeTableDef | null;
  onUpdated?: (table: StandardCodeTableDef) => void;
}

export const CreateCodeTableModal: React.FC<CreateCodeTableModalProps> = ({
  open,
  onClose,
  onCreated,
  editingTable = null,
  onUpdated,
}) => {
  const isEdit = Boolean(editingTable);
  const [tableName, setTableName] = useState('');
  const [tableCode, setTableCode] = useState('');
  const [description, setDescription] = useState('');
  const [directoryId, setDirectoryId] = useState(CODE_TABLE_LEAF_DIRECTORIES[0]?.id ?? '');
  const [fields, setFields] = useState<FieldRow[]>(() => [
    {
      _key: genId(),
      name: '编码',
      nameEn: 'code',
      dataType: 'STRING',
    },
    {
      _key: genId(),
      name: '名称',
      nameEn: 'name',
      dataType: 'STRING',
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const descLen = description.length;
  const maxDesc = 600;

  const directoryPath = useMemo(() => {
    return CODE_TABLE_LEAF_DIRECTORIES.find((d) => d.id === directoryId)?.path ?? '';
  }, [directoryId]);

  const resetForm = useCallback(() => {
    setTableName('');
    setTableCode('');
    setDescription('');
    setDirectoryId(CODE_TABLE_LEAF_DIRECTORIES[0]?.id ?? '');
    setFields([
      {
        _key: genId(),
        name: '编码',
        nameEn: 'code',
        dataType: 'STRING',
      },
      {
        _key: genId(),
        name: '名称',
        nameEn: 'name',
        dataType: 'STRING',
      },
    ]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (editingTable) {
      setTableName(editingTable.tableName);
      setTableCode(editingTable.tableCode);
      setDescription(editingTable.description);
      setDirectoryId(editingTable.directoryId);
      setFields(
        editingTable.fields.map((f) => ({
          ...f,
          _key: genId(),
        }))
      );
      setError(null);
    } else {
      resetForm();
    }
    // 仅用 id：避免列表重渲染传入新 row 引用时冲掉正在编辑的内容
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editingTable 按 id 同步即可
  }, [open, editingTable?.id]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      { _key: genId(), name: '', nameEn: '', dataType: 'STRING' },
    ]);
  };

  const removeField = (key: string) => {
    setFields((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r._key !== key)));
  };

  const updateField = (key: string, patch: Partial<Omit<FieldRow, '_key'>>) => {
    setFields((prev) =>
      prev.map((r) => (r._key === key ? { ...r, ...patch } : r))
    );
  };

  const autoGenerateCode = () => {
    const base =
      tableName.trim().replace(/\s+/g, '_').slice(0, 24) || 'new_table';
    const sanitized = base.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const tail = Date.now().toString(36).slice(-4);
    setTableCode((sanitized.match(/^[a-zA-Z]/) ? sanitized : `tb_${sanitized}`).slice(0, 48) + '_' + tail);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = tableName.trim();
    if (!name) {
      setError('请填写表名称。');
      return;
    }
    if (/[\\<>/%"';]/.test(name) || /\n/.test(name)) {
      setError('表名称不能包含 \\ < > % " \' ; 及换行符。');
      return;
    }

    const code = tableCode.trim();
    if (!code) {
      setError('请填写表编码，或点击「自动生成编码」。');
      return;
    }
    if (!isValidEnglishIdentifier(code)) {
      setError('表编码须以英文字母开头，仅含字母、数字、下划线。');
      return;
    }

    if (description.length > maxDesc) {
      setError(`描述长度不能超过 ${maxDesc} 个字符。`);
      return;
    }

    const fieldDefs: CodeTableFieldDef[] = [];
    for (const r of fields) {
      const fn = r.name.trim();
      const fe = r.nameEn.trim();
      if (!fn && !fe) continue;
      if (!fn || !fe) {
        setError('每条字段须同时填写「字段名称」与「英文名称」，或删除空行。');
        return;
      }
      if (!/^[a-zA-Z\u4e00-\u9fff]/.test(fn)) {
        setError(`字段名称须以中文或英文字母开头：${fn}`);
        return;
      }
      if (!isValidEnglishIdentifier(fe)) {
        setError(`字段英文名称格式不正确：${fe}`);
        return;
      }
      fieldDefs.push({
        name: fn,
        nameEn: fe,
        dataType: r.dataType,
      });
    }

    if (fieldDefs.length === 0) {
      setError('请至少添加一条完整的建表字段。');
      return;
    }

    const dupEn = fieldDefs.map((f) => f.nameEn);
    if (new Set(dupEn).size !== dupEn.length) {
      setError('字段英文名称不能重复。');
      return;
    }

    if (editingTable) {
      const row: StandardCodeTableDef = {
        ...editingTable,
        tableName: name,
        tableCode: editingTable.tableCode,
        description: description.trim(),
        directoryId,
        directoryPath,
        fields: fieldDefs,
      };
      onUpdated?.(row);
    } else {
      const row: StandardCodeTableDef = {
        id: genId(),
        tableName: name,
        tableCode: code,
        description: description.trim(),
        directoryId,
        directoryPath,
        status: '草稿',
        recordCount: 0,
        fields: fieldDefs,
      };
      onCreated(row);
    }
    resetForm();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-code-table-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200">
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 id="create-code-table-title" className="text-lg font-bold text-slate-800">
              {isEdit ? '编辑码表' : '新建码表'}
            </h2>
            <p className="text-[12px] text-slate-500 mt-1">
              对齐 DataArts 码表：基础配置（表名、编码、描述）与建表字段（名称 / 英文 / 类型）。
              <a
                href={DOC_LINK}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                查看说明
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-8">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 text-[13px] px-3 py-2 border border-red-100">
              {error}
            </div>
          )}

          {/* 基础配置 */}
          <section className="space-y-4">
            <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 border-l-4 border-blue-600 pl-2">
              基础配置
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[13px] text-slate-700 mb-1">
                  <span className="text-red-500">*</span> 表名称
                </label>
                <input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500"
                  placeholder="码表中文名称"
                  maxLength={128}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[13px] text-slate-700 mb-1">
                  <span className="text-red-500">*</span> 表编码
                  <span className="text-slate-400 font-normal ml-2 text-[12px]">
                    （英文，字母开头，仅字母数字下划线）
                  </span>
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    value={tableCode}
                    onChange={(e) => setTableCode(e.target.value)}
                    readOnly={isEdit}
                    className={`flex-1 min-w-[200px] h-10 px-3 border border-slate-200 rounded-lg text-[13px] font-mono outline-none focus:border-blue-500 ${
                      isEdit ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="如 dim_custom_field"
                    spellCheck={false}
                  />
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={autoGenerateCode}
                      className="h-10 px-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Wand2 size={15} />
                      自动生成编码
                    </button>
                  )}
                </div>
                {isEdit && (
                  <p className="text-[11px] text-slate-400 mt-1">表编码创建后不可修改，引用侧依赖唯一编码。</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-[13px] text-slate-700 mb-1">描述</label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={maxDesc}
                    className="w-full min-h-[88px] px-3 py-2 pb-7 border border-slate-200 rounded-lg text-[13px] outline-none resize-y focus:border-blue-500"
                    placeholder="可选，0～600 字符"
                  />
                  <span className="absolute bottom-2 right-3 text-[11px] text-slate-400">
                    {descLen}/{maxDesc}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[13px] text-slate-700 mb-1">
                  <span className="text-red-500">*</span> 选择目录
                </label>
                <select
                  value={directoryId}
                  onChange={(e) => setDirectoryId(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-[13px] outline-none bg-white focus:border-blue-500"
                >
                  {CODE_TABLE_LEAF_DIRECTORIES.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.path}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  保存后为草稿；发布后可被数据标准「值域 · 引用码表」引用。
                </p>
              </div>
            </div>
          </section>

          {/* 建表配置 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 border-l-4 border-violet-500 pl-2">
                建表配置
              </h3>
              <button
                type="button"
                onClick={addField}
                className="text-[13px] font-medium text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <Plus size={16} /> 新建字段
              </button>
            </div>
            <p className="text-[12px] text-slate-500">
              字段数据类型支持 STRING、BIGINT、DOUBLE、TIMESTAMP、DATE、BOOLEAN、DECIMAL（与 DataArts 一致）。
            </p>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-[13px] border-collapse">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold w-[26%]">
                      <span className="text-red-500">*</span> 字段名称
                    </th>
                    <th className="text-left py-2 px-3 font-semibold w-[26%]">
                      <span className="text-red-500">*</span> 英文名称
                    </th>
                    <th className="text-left py-2 px-3 font-semibold w-[28%]">
                      <span className="text-red-500">*</span> 字段数据类型
                    </th>
                    <th className="text-center py-2 px-3 font-semibold w-[80px]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((row) => (
                    <tr key={row._key} className="bg-white">
                      <td className="py-2 px-2 align-top">
                        <input
                          value={row.name}
                          onChange={(e) => updateField(row._key, { name: e.target.value })}
                          className="w-full h-9 px-2 border border-slate-200 rounded-md outline-none focus:border-blue-500"
                          placeholder="字段名称"
                        />
                      </td>
                      <td className="py-2 px-2 align-top">
                        <input
                          value={row.nameEn}
                          onChange={(e) =>
                            updateField(row._key, { nameEn: e.target.value })
                          }
                          className="w-full h-9 px-2 border border-slate-200 rounded-md outline-none font-mono text-[12px] focus:border-blue-500"
                          placeholder="field_name"
                          spellCheck={false}
                        />
                      </td>
                      <td className="py-2 px-2 align-top">
                        <select
                          value={row.dataType}
                          onChange={(e) =>
                            updateField(row._key, {
                              dataType: e.target.value as CodeTableFieldDataType,
                            })
                          }
                          className="w-full h-9 px-2 border border-slate-200 rounded-md outline-none bg-white focus:border-blue-500"
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center align-top">
                        <button
                          type="button"
                          onClick={() => removeField(row._key)}
                          disabled={fields.length <= 1}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                          title="删除字段"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2 pb-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="h-10 px-5 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="h-10 px-6 rounded-lg bg-blue-600 text-white text-[13px] font-bold shadow-md hover:bg-blue-700"
            >
              {isEdit ? '保存' : '保存（草稿）'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
