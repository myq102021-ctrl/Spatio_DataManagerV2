import React, { useCallback, useMemo, useRef, useState } from 'react';
import { filterCodeTables } from '../standardCodeTableMock';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  Languages,
  Link2,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Undo2,
} from 'lucide-react';

/** 标准编码：CLT_中间段_三位编号，中间段为大写字母数字下划线 */
const CODE_PREFIX = 'CLT_';

function normalizeMiddle(raw: string): string {
  const u = raw.toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_');
  return u.replace(/^_|_$/g, '') || 'CUSTOM';
}

function buildStandardCode(middle: string, seq: number): string {
  const m = normalizeMiddle(middle);
  const n = Math.max(1, Math.min(999, Math.floor(seq) || 1));
  return `${CODE_PREFIX}${m}_${String(n).padStart(3, '0')}`;
}

function parseStandardCode(full: string): { middle: string; seq: number } | null {
  const t = full.trim();
  const re = /^CLT_([A-Z0-9_]+)_(\d{1,3})$/i;
  const x = t.match(re);
  if (!x) return null;
  const seq = Math.max(1, Math.min(999, parseInt(x[2], 10)));
  return { middle: normalizeMiddle(x[1]), seq };
}

/** 将英文短语转为小驼峰，便于作为标准英文名 / 字段名 */
function englishToCamelCase(s: string): string {
  const words = s
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean);
  if (!words.length) return '';
  const lower = words.map((w) => w.toLowerCase());
  return lower[0] + lower.slice(1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
}

async function translateChineseToEnglish(text: string): Promise<string> {
  const q = text.trim();
  if (!q) return '';
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=zh-CN|en`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('translate failed');
  const data = await res.json();
  const raw = data.responseData?.translatedText?.trim();
  if (!raw || raw === q) throw new Error('no translation');
  return raw;
}

const WIZARD_STEPS = [
  { key: 'attr', title: '属性配置', icon: <FileText size={16} /> },
  { key: 'monitor', title: '落标监控配置', icon: <ShieldCheck size={16} /> },
  { key: 'mapping', title: '智能映射配置', icon: <Link2 size={16} /> },
  { key: 'relation', title: '关联信息配置', icon: <Share2 size={16} /> },
] as const;

type AssocTab = 'standards' | 'codes' | 'docs';

/** 值域类型（与技术属性「值域」下拉对应） */
type ValueDomainKind = '' | 'enum' | 'range' | 'regex' | 'codeTable';

interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
}

const FieldLabel: React.FC<FieldLabelProps> = ({ children, required }) => (
  <label className="flex items-center gap-1 text-[13px] text-[rgba(0,0,0,0.85)] mb-1.5">
    {required && <span className="text-[#ff4d4f]">*</span>}
    {children}
    <button type="button" className="text-[#bfbfbf] hover:text-[#1890ff] p-0">
      <Info size={13} />
    </button>
  </label>
);

const inputCls =
  'w-full h-8 px-3 border border-[#d9d9d9] rounded text-[13px] outline-none hover:border-[#40a9ff] focus:border-[#40a9ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)]';

const selectCls =
  'w-full h-8 px-3 border border-[#d9d9d9] rounded text-[13px] outline-none bg-white hover:border-[#40a9ff] focus:border-[#40a9ff] appearance-none cursor-pointer';

export interface DataStandardNewWizardProps {
  onClose: () => void;
}

export const DataStandardNewWizard: React.FC<DataStandardNewWizardProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [anchor, setAnchor] = useState<'biz' | 'tech'>('biz');
  const bizRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);

  const [codeMiddle, setCodeMiddle] = useState('PRD_INF');
  const [codeSeq, setCodeSeq] = useState(6);
  const [codeFullEdit, setCodeFullEdit] = useState('');
  const [useFullCodeEdit, setUseFullCodeEdit] = useState(false);

  const [standardNameZh, setStandardNameZh] = useState('');
  const [standardNameEn, setStandardNameEn] = useState('');
  const [translateLoading, setTranslateLoading] = useState(false);

  const [standardType, setStandardType] = useState('');
  const [bizNote, setBizNote] = useState('');
  const [descLen, setDescLen] = useState(0);
  const [description, setDescription] = useState('');
  const [effectiveType, setEffectiveType] = useState<'permanent' | 'custom'>('permanent');
  const [nullable, setNullable] = useState<'yes' | 'no'>('yes');
  const [valueDomainKind, setValueDomainKind] = useState<ValueDomainKind>('');
  const [enumValuesText, setEnumValuesText] = useState('');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [rangeIncludeMin, setRangeIncludeMin] = useState(true);
  const [rangeIncludeMax, setRangeIncludeMax] = useState(true);
  const [regexPattern, setRegexPattern] = useState('');
  const [codeTableId, setCodeTableId] = useState('');
  const [codeTableKeyword, setCodeTableKeyword] = useState('');

  const [assocTab, setAssocTab] = useState<AssocTab>('standards');
  const [ruleSearch, setRuleSearch] = useState('');

  const maxDesc = 256;

  const composedCode = useMemo(() => buildStandardCode(codeMiddle, codeSeq), [codeMiddle, codeSeq]);

  /** 与「标准码表」模块同源；仅「已发布」可被值域引用（对齐 DataArts 码表须发布后使用） */
  const filteredCodeTables = useMemo(() => {
    const published = filterCodeTables(codeTableKeyword).filter((t) => t.status === '已发布');
    return published.map((t) => ({
      id: t.id,
      label: `${t.tableName}（${t.tableCode}）`,
    }));
  }, [codeTableKeyword]);

  const regenerateSeq = useCallback(() => {
    setCodeSeq((s) => (s >= 999 ? 1 : s + 1));
  }, []);

  const autoGenerateCode = useCallback(() => {
    const seg = `U${Date.now().toString().slice(-5)}`;
    setCodeMiddle(seg);
    setCodeSeq((s) => (s >= 999 ? 1 : s + 1));
  }, []);

  const applyParsedFullCode = useCallback(() => {
    const raw = codeFullEdit.trim();
    const p = parseStandardCode(raw);
    if (p) {
      setCodeMiddle(p.middle);
      setCodeSeq(p.seq);
    }
  }, [codeFullEdit]);

  const scrollToSection = useCallback((which: 'biz' | 'tech') => {
    setAnchor(which);
    const el = which === 'biz' ? bizRef.current : techRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleTranslateName = useCallback(async () => {
    const src = standardNameZh.trim();
    if (!src) return;
    setTranslateLoading(true);
    try {
      const translated = await translateChineseToEnglish(src);
      const camel = englishToCamelCase(translated);
      setStandardNameEn(camel || translated.toLowerCase().replace(/\s+/g, '_'));
    } catch {
      window.alert('翻译失败，请检查网络或稍后重试；也可手动填写英文名。');
    } finally {
      setTranslateLoading(false);
    }
  }, [standardNameZh]);

  const lastStepIndex = WIZARD_STEPS.length - 1;

  return (
    <div
      className="absolute inset-0 z-[100] flex flex-col bg-[#f8fafc] h-full animate-fadeIn overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-standard-title"
    >
      {/* 顶部导航 — 与服务开发 APICreationWizard 一致 */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 md:px-8 py-4 flex items-center justify-between shadow-sm z-10 gap-4">
        <div className="flex items-center gap-4 min-w-0 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0"
            title="返回列表"
          >
            <Undo2 size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200 shrink-0" />
          <h2 id="new-standard-title" className="text-[16px] font-bold text-slate-800 truncate">
            新建标准{' '}
            <span className="text-slate-400 font-medium ml-2 text-sm">(向导模式)</span>
          </h2>
        </div>

        <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-2 overflow-x-auto custom-scrollbar">
          {WIZARD_STEPS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => setStep(idx)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all shrink-0 ${
                  step === idx ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {s.icon}
                <span className="text-xs font-bold whitespace-nowrap">{s.title}</span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <ChevronRight size={14} className="mx-2 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-3 md:px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft size={14} />
              上一步
            </button>
          )}
          <button
            type="button"
            className="px-3 md:px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all inline-flex"
          >
            保存草稿
          </button>
          <button
            type="button"
            onClick={() =>
              step < lastStepIndex ? setStep((s) => s + 1) : onClose()
            }
            className="px-5 md:px-6 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"
          >
            {step >= lastStepIndex ? '完成' : '下一步'}
            {step < lastStepIndex && <ArrowRight size={14} />}
          </button>
        </div>
      </div>

      {/* 小屏步骤条 */}
      <div className="lg:hidden flex-shrink-0 bg-white border-b border-slate-100 px-4 py-2 overflow-x-auto custom-scrollbar">
        <div className="flex items-center min-w-max gap-1">
          {WIZARD_STEPS.map((s, idx) => (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => setStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                  step === idx ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-50'
                }`}
              >
                {s.icon}
                {s.title}
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Body — 与服务开发一致的可滚动主区域 */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[min(100%,480px)]">
            {/* Step 0: 属性配置 — 业务属性 + 技术属性同页，左侧锚点跳转 */}
            {step === 0 && (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 min-h-[560px]">
                <aside className="lg:w-[148px] flex-shrink-0 flex flex-row lg:flex-col gap-2 lg:gap-3 border-b lg:border-b-0 lg:border-r border-slate-100 p-4 lg:py-8 lg:pl-6 lg:pr-2">
                  <button
                    type="button"
                    onClick={() => scrollToSection('biz')}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold transition-colors ${
                      anchor === 'biz'
                        ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${anchor === 'biz' ? 'bg-blue-600' : 'bg-slate-300'}`}
                    />
                    业务属性
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('tech')}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold transition-colors ${
                      anchor === 'tech'
                        ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${anchor === 'tech' ? 'bg-blue-600' : 'bg-slate-300'}`}
                    />
                    技术属性
                  </button>
                </aside>

                <div className="flex-1 space-y-10 p-6 lg:pr-10 pb-12 overflow-visible">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-800">属性配置</h2>
                    <div className="text-[13px] text-slate-500">
                      <span className="text-slate-400">标准模板</span>{' '}
                      <span className="text-slate-700">遥感卫星影像-通用元数据模板</span>{' '}
                      <button type="button" className="text-blue-600 hover:underline font-medium">
                        切换
                      </button>
                    </div>
                  </div>

                  {/* 业务属性 */}
                  <section ref={bizRef} id="attr-section-biz" className="scroll-mt-6">
                    <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="h-7 w-1 rounded-full bg-blue-600" />
                      业务属性
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                      <div className="md:col-span-2 space-y-2">
                        <FieldLabel required>标准编码</FieldLabel>
                        <p className="text-[12px] text-slate-400 mb-1">
                          格式固定为 <span className="font-mono text-slate-600">CLT_</span>
                          自定义段<span className="font-mono text-slate-600">_</span>
                          三位编号（编号可自动生成）；亦可展开编辑完整编码。
                        </p>
                        {!useFullCodeEdit ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm text-slate-500">{CODE_PREFIX}</span>
                            <input
                              value={codeMiddle}
                              onChange={(e) => setCodeMiddle(e.target.value)}
                              className={`${inputCls} flex-1 min-w-[120px] max-w-[280px] font-mono uppercase`}
                              placeholder="中间段，如 PRD_INF"
                              spellCheck={false}
                            />
                            <span className="font-mono text-slate-400">_</span>
                            <span className="font-mono text-sm tabular-nums text-slate-800 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                              {String(codeSeq).padStart(3, '0')}
                            </span>
                            <button
                              type="button"
                              onClick={regenerateSeq}
                              className="text-[13px] text-blue-600 hover:underline whitespace-nowrap"
                            >
                              重新生成编号
                            </button>
                            <button
                              type="button"
                              onClick={autoGenerateCode}
                              className="text-[13px] font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 whitespace-nowrap"
                            >
                              自动生成
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCodeFullEdit(composedCode);
                                setUseFullCodeEdit(true);
                              }}
                              className="text-[13px] text-slate-500 hover:text-blue-600 whitespace-nowrap"
                            >
                              编辑完整编码
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              value={codeFullEdit}
                              onChange={(e) => setCodeFullEdit(e.target.value)}
                              className={`${inputCls} font-mono`}
                              placeholder="CLT_XXX_001"
                              spellCheck={false}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  applyParsedFullCode();
                                  setUseFullCodeEdit(false);
                                }}
                                className="text-[13px] px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                              >
                                应用格式
                              </button>
                              <button
                                type="button"
                                onClick={() => setUseFullCodeEdit(false)}
                                className="text-[13px] text-slate-500 hover:text-slate-700"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        )}
                        <p className="text-[12px] font-mono text-slate-600">当前：{composedCode}</p>
                      </div>

                      <div>
                        <FieldLabel required>标准名称</FieldLabel>
                        <input
                          value={standardNameZh}
                          onChange={(e) => setStandardNameZh(e.target.value)}
                          className={inputCls}
                          placeholder="请输入标准名称（中文）"
                        />
                      </div>
                      <div>
                        <FieldLabel>标准英文名</FieldLabel>
                        <div className="flex gap-2 items-center">
                          <input
                            value={standardNameEn}
                            onChange={(e) => setStandardNameEn(e.target.value)}
                            className={`${inputCls} flex-1 min-w-0 font-mono text-[13px]`}
                            placeholder="如 productPrice，可点击翻译自动生成"
                            spellCheck={false}
                          />
                          <button
                            type="button"
                            disabled={translateLoading || !standardNameZh.trim()}
                            onClick={handleTranslateName}
                            title="根据上方标准名称（中文）翻译为英文并填入小驼峰形式"
                            className="shrink-0 h-8 px-3 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                          >
                            <Languages size={15} className={translateLoading ? 'animate-pulse' : ''} />
                            {translateLoading ? '翻译中…' : '翻译'}
                          </button>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          翻译使用在线服务生成英文后转为小驼峰；若失败请手动填写。
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel required>标准类型</FieldLabel>
                        <select
                          value={standardType}
                          onChange={(e) => setStandardType(e.target.value)}
                          className={selectCls}
                        >
                          <option value="">请选择标准类型</option>
                          <option value="field">字段标准</option>
                          <option value="code">编码标准</option>
                          <option value="dict">代码标准</option>
                          <option value="measure">度量标准</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel>说明</FieldLabel>
                        <textarea
                          value={bizNote}
                          onChange={(e) => setBizNote(e.target.value)}
                          className="w-full min-h-[72px] px-3 py-2 border border-[#d9d9d9] rounded text-[13px] outline-none resize-y hover:border-[#40a9ff] focus:border-[#40a9ff]"
                          placeholder="简要说明业务含义、适用场景等"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel required>标准集及目录</FieldLabel>
                        <select className={selectCls}>
                          <option>遥感卫星影像相关 / 卫星影像元数据标准集</option>
                          <option>测绘数据 / 基础测绘成果标准集</option>
                          <option>农业业务数据 / 耕地地块业务标准集</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>负责人</FieldLabel>
                        <select className={selectCls}>
                          <option>SuperAdmin</option>
                          <option>zhangsan</option>
                          <option>zhanglei</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>生效时间</FieldLabel>
                        <div className="flex flex-wrap gap-6 pt-1">
                          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                            <input
                              type="radio"
                              name="eff"
                              checked={effectiveType === 'permanent'}
                              onChange={() => setEffectiveType('permanent')}
                            />
                            永久
                          </label>
                          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                            <input
                              type="radio"
                              name="eff"
                              checked={effectiveType === 'custom'}
                              onChange={() => setEffectiveType('custom')}
                            />
                            自定义
                          </label>
                        </div>
                        {effectiveType === 'custom' && (
                          <div className="mt-2 flex flex-wrap gap-2 items-center">
                            <input type="date" className={inputCls} />
                            <span className="text-slate-300">—</span>
                            <input type="date" className={inputCls} />
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <FieldLabel>描述</FieldLabel>
                        <div className="relative">
                          <textarea
                            value={description}
                            maxLength={maxDesc}
                            onChange={(e) => {
                              setDescription(e.target.value);
                              setDescLen(e.target.value.length);
                            }}
                            className="w-full min-h-[100px] px-3 py-2 pb-7 border border-[#d9d9d9] rounded text-[13px] outline-none resize-y hover:border-[#40a9ff] focus:border-[#40a9ff]"
                            placeholder="请输入描述"
                          />
                          <span className="absolute bottom-2 right-3 text-[12px] text-[#bfbfbf]">
                            {descLen}/{maxDesc}
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 技术属性 */}
                  <section ref={techRef} id="attr-section-tech" className="scroll-mt-6">
                    <h3 className="text-[15px] font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="h-7 w-1 rounded-full bg-violet-500" />
                      技术属性
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                      <div>
                        <FieldLabel required>数据类型</FieldLabel>
                        <select className={selectCls}>
                          <option value="">请选择</option>
                          <option>字符串 STRING</option>
                          <option>数值 NUMBER</option>
                          <option>整数 INTEGER</option>
                          <option>日期 DATE</option>
                          <option>日期时间 DATETIME</option>
                          <option>布尔 BOOLEAN</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>是否可为空值</FieldLabel>
                        <div className="flex gap-6 pt-1">
                          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                            <input
                              type="radio"
                              name="nullable"
                              checked={nullable === 'yes'}
                              onChange={() => setNullable('yes')}
                              className="text-blue-600"
                            />
                            是
                          </label>
                          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                            <input
                              type="radio"
                              name="nullable"
                              checked={nullable === 'no'}
                              onChange={() => setNullable('no')}
                              className="text-blue-600"
                            />
                            否
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <FieldLabel>值域</FieldLabel>
                          <select
                            value={valueDomainKind}
                            onChange={(e) =>
                              setValueDomainKind((e.target.value || '') as ValueDomainKind)
                            }
                            className={selectCls}
                          >
                            <option value="">请选择值域类型</option>
                            <option value="enum">枚举</option>
                            <option value="range">区间</option>
                            <option value="regex">正则</option>
                            <option value="codeTable">引用码表</option>
                          </select>
                        </div>

                        {valueDomainKind !== '' && (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 space-y-3">
                            <div className="text-[13px] font-bold text-slate-700">自定义规则</div>

                            {valueDomainKind === 'enum' && (
                              <div className="space-y-2">
                                <p className="text-[12px] text-slate-500">
                                  列出所有允许取值；每行一项，或使用英文逗号分隔。
                                </p>
                                <textarea
                                  value={enumValuesText}
                                  onChange={(e) => setEnumValuesText(e.target.value)}
                                  className="w-full min-h-[120px] px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400 resize-y font-mono"
                                  placeholder={'例如：\n男\n女\n未知\n或：男,女,未知'}
                                />
                              </div>
                            )}

                            {valueDomainKind === 'range' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[12px] text-slate-600 mb-1 block">最小值</span>
                                  <input
                                    value={rangeMin}
                                    onChange={(e) => setRangeMin(e.target.value)}
                                    className={inputCls}
                                    placeholder="下限"
                                  />
                                  <label className="flex items-center gap-2 mt-2 text-[12px] text-slate-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={rangeIncludeMin}
                                      onChange={(e) => setRangeIncludeMin(e.target.checked)}
                                      className="rounded border-slate-300"
                                    />
                                    包含下限（闭区间）
                                  </label>
                                </div>
                                <div>
                                  <span className="text-[12px] text-slate-600 mb-1 block">最大值</span>
                                  <input
                                    value={rangeMax}
                                    onChange={(e) => setRangeMax(e.target.value)}
                                    className={inputCls}
                                    placeholder="上限"
                                  />
                                  <label className="flex items-center gap-2 mt-2 text-[12px] text-slate-600 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={rangeIncludeMax}
                                      onChange={(e) => setRangeIncludeMax(e.target.checked)}
                                      className="rounded border-slate-300"
                                    />
                                    包含上限（闭区间）
                                  </label>
                                </div>
                                <p className="sm:col-span-2 text-[12px] text-slate-400">
                                  数值/日期等区间请与上方「数据类型」一致；日期建议用 ISO 格式。
                                </p>
                              </div>
                            )}

                            {valueDomainKind === 'regex' && (
                              <div className="space-y-2">
                                <p className="text-[12px] text-slate-500">
                                  填写用于校验的正则表达式（不含分隔符）。
                                </p>
                                <input
                                  value={regexPattern}
                                  onChange={(e) => setRegexPattern(e.target.value)}
                                  className={`${inputCls} font-mono`}
                                  placeholder="例如 ^1[3-9]\d{9}$"
                                  spellCheck={false}
                                />
                              </div>
                            )}

                            {valueDomainKind === 'codeTable' && (
                              <div className="space-y-3">
                                <p className="text-[12px] text-slate-500">
                                  选择已发布的码表；可搜索名称或编码筛选。
                                </p>
                                <div className="relative">
                                  <Search
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                                    size={14}
                                  />
                                  <input
                                    value={codeTableKeyword}
                                    onChange={(e) => setCodeTableKeyword(e.target.value)}
                                    className={`${inputCls} pl-8`}
                                    placeholder="搜索码表名称 / 编码"
                                  />
                                </div>
                                <select
                                  value={codeTableId}
                                  onChange={(e) => setCodeTableId(e.target.value)}
                                  className={selectCls}
                                >
                                  <option value="">请选择码表</option>
                                  {filteredCodeTables.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                                {filteredCodeTables.length === 0 && codeTableKeyword.trim() && (
                                  <p className="text-[12px] text-amber-600">无匹配码表，请调整关键词</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <FieldLabel>计量单位</FieldLabel>
                        <select className={selectCls}>
                          <option value="">请选择</option>
                          <optgroup label="通用 / 业务">
                            <option value="none">无</option>
                            <option value="yuan">元</option>
                            <option value="piece">件</option>
                            <option value="kg">千克 (kg)</option>
                          </optgroup>
                          <optgroup label="时空数据 · 长度与距离">
                            <option value="mm">毫米 (mm)</option>
                            <option value="cm">厘米 (cm)</option>
                            <option value="m">米 (m)</option>
                            <option value="km">千米 (km)</option>
                            <option value="nmi">海里 (nmi)</option>
                            <option value="m_s">米/秒 (m/s)</option>
                            <option value="km_h">千米/时 (km/h)</option>
                          </optgroup>
                          <optgroup label="时空数据 · 面积">
                            <option value="m2">平方米 (m²)</option>
                            <option value="km2">平方千米 (km²)</option>
                            <option value="ha">公顷 (hm²)</option>
                            <option value="mu">亩</option>
                          </optgroup>
                          <optgroup label="时空数据 · 角度与坐标">
                            <option value="deg">度 (°) — 经纬度、方位</option>
                            <option value="rad">弧度 (rad)</option>
                            <option value="arcsec">角秒 (″)</option>
                            <option value="mm_m">毫弧度 (mrad)</option>
                          </optgroup>
                          <optgroup label="时空数据 · 栅格与分辨率">
                            <option value="px">像素 (px)</option>
                            <option value="m_px">米/像素 (m/px)</option>
                            <option value="deg_px">度/像素 — 球面栅格</option>
                          </optgroup>
                          <optgroup label="时空数据 · 时间">
                            <option value="ms">毫秒 (ms)</option>
                            <option value="s">秒 (s)</option>
                            <option value="min">分 (min)</option>
                            <option value="h">小时 (h)</option>
                            <option value="d">天 (d)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* Step 1: 落标监控配置 */}
            {step === 1 && (
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="text-[15px] font-semibold text-[rgba(0,0,0,0.85)]">落标监控配置</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bfbfbf]"
                        size={14}
                      />
                      <input
                        value={ruleSearch}
                        onChange={(e) => setRuleSearch(e.target.value)}
                        className="h-8 w-[200px] pl-8 pr-2 border border-[#d9d9d9] rounded text-[13px] outline-none"
                        placeholder="请输入规则名称"
                      />
                    </div>
                    <button
                      type="button"
                      className="text-[13px] text-[rgba(0,0,0,0.65)] flex items-center gap-1 hover:text-[#1890ff]"
                    >
                      <HelpCircle size={14} />
                      说明
                    </button>
                    <button
                      type="button"
                      className="h-8 px-3 rounded-lg text-[13px] font-medium text-white flex items-center gap-1 bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                      <Plus size={14} /> 新建质量监控规则
                    </button>
                  </div>
                </div>
                <div className="border border-[#f0f0f0] rounded overflow-hidden">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                        <th className="text-left py-3 px-4 font-medium text-[rgba(0,0,0,0.85)]">
                          规则名称
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[rgba(0,0,0,0.85)]">
                          监控类型
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[rgba(0,0,0,0.85)]">
                          添加方式
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-[rgba(0,0,0,0.85)]">
                          规则类型
                        </th>
                      </tr>
                    </thead>
                  </table>
                  <div className="py-16 flex flex-col items-center justify-center text-[#bfbfbf] text-[13px]">
                    <div className="w-16 h-16 mb-3 rounded border border-dashed border-[#e8e8e8] flex items-center justify-center text-[#d9d9d9] text-2xl">
                      ∅
                    </div>
                    暂无数据
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 智能映射配置 */}
            {step === 2 && (
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-[15px] font-semibold text-[rgba(0,0,0,0.85)]">智能映射配置</h2>
                  <button type="button" className="text-[#1890ff] hover:underline text-[13px] flex items-center gap-1">
                    <Info size={14} /> 使用说明
                  </button>
                </div>
                <div className="max-w-xl">
                  <FieldLabel>识别特征</FieldLabel>
                  <select className={selectCls}>
                    <option value="">请选择识别特征</option>
                    <option>字段名称相似度</option>
                    <option>业务语义标签</option>
                    <option>历史映射记录</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: 关联信息 */}
            {step === 3 && (
              <div className="p-6 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[15px] font-semibold text-[rgba(0,0,0,0.85)]">关联信息</h2>
                  <button
                    type="button"
                    className="h-8 px-4 border rounded text-[13px] text-[#1890ff] border-[#1890ff] bg-white hover:bg-[#e6f7ff]"
                  >
                    新增
                  </button>
                </div>
                <div className="flex flex-1 min-h-0 border border-[#f0f0f0] rounded overflow-hidden">
                  <div className="w-[140px] flex-shrink-0 border-r border-[#f0f0f0] bg-[#fafafa] py-2">
                    {(
                      [
                        { id: 'standards' as const, label: '关联标准' },
                        { id: 'codes' as const, label: '关联码表' },
                        { id: 'docs' as const, label: '关联文档' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAssocTab(t.id)}
                        className={`w-full text-left px-4 py-3 text-[13px] border-l-[3px] transition-colors ${
                          assocTab === t.id
                            ? 'border-[#1890ff] text-[#1890ff] font-medium bg-white'
                            : 'border-transparent text-[rgba(0,0,0,0.65)] hover:bg-[#f5f5f5]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                          <th className="text-left py-3 px-4 font-medium">标准名称</th>
                          <th className="text-left py-3 px-4 font-medium">标准编码</th>
                          <th className="text-left py-3 px-4 font-medium">归属目录及标准集</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="py-12 text-center text-[#bfbfbf] text-[13px]">暂无数据</div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

