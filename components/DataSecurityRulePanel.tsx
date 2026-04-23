import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Eye, Edit2, Trash2, Shield, ShieldCheck,
  ChevronDown, ChevronLeft, ChevronRight, RefreshCw, X,
  CheckCircle2, AlertTriangle, Info, Database, Users,
  Play, Phone, Mail, MapPin, Lightbulb, CreditCard,
  Settings, ArrowLeft, FileText
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RuleType = 'phone' | 'idcard' | 'email' | 'name' | 'address' | 'custom';
type MaskLevel = 'none' | 'partial' | 'full';

interface RoleBinding {
  roleId: string;
  roleName: string;
  maskLevel: MaskLevel;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  dataSourceId: string;
  dataSourceName: string;
  tableName: string;
  targetField: string;
  fieldLabel: string;
  ruleType: RuleType;
  roleBindings: RoleBinding[];
  status: 'active' | 'inactive';
  createTime: string;
}

// ─── Mock Static Data ─────────────────────────────────────────────────────────

interface DataField { id: string; name: string; label: string; }
interface DataTable { id: string; name: string; fields: DataField[]; }
interface DataSource { id: string; name: string; tables: DataTable[]; }

const MOCK_SOURCES: DataSource[] = [
  {
    id: 'ds_pop', name: '全省人口基础信息库',
    tables: [{
      id: 'tb_citizen', name: 'tb_citizen（市民信息）',
      fields: [
        { id: 'f1', name: 'real_name', label: '真实姓名' },
        { id: 'f2', name: 'phone_number', label: '手机号码' },
        { id: 'f3', name: 'id_card_no', label: '身份证号' },
        { id: 'f4', name: 'home_address', label: '家庭地址' },
        { id: 'f5', name: 'email', label: '电子邮箱' },
      ]
    }]
  },
  {
    id: 'ds_traffic', name: '智慧交通违章记录库',
    tables: [{
      id: 'tb_vio', name: 'tb_violation（违章记录）',
      fields: [
        { id: 'f6', name: 'driver_name', label: '驾驶人姓名' },
        { id: 'f7', name: 'driver_phone', label: '联系电话' },
      ]
    }]
  },
  {
    id: 'ds_health', name: '医疗健康电子档案',
    tables: [{
      id: 'tb_patient', name: 'tb_patient（患者信息）',
      fields: [
        { id: 'f8', name: 'patient_name', label: '患者姓名' },
        { id: 'f9', name: 'patient_id', label: '患者身份证' },
        { id: 'f10', name: 'patient_phone', label: '患者电话' },
      ]
    }]
  },
  {
    id: 'ds_ecomm', name: '电商用户行为数据库',
    tables: [{
      id: 'tb_user', name: 'tb_user（用户信息）',
      fields: [
        { id: 'f11', name: 'user_email', label: '注册邮箱' },
        { id: 'f12', name: 'user_phone', label: '绑定手机' },
      ]
    }]
  },
];

const ALL_ROLES = [
  { id: 'role_admin', name: '系统管理员' },
  { id: 'role_operator', name: '业务操作员' },
  { id: 'role_analyst', name: '数据分析师' },
  { id: 'role_auditor', name: '合规审计员' },
  { id: 'role_visitor', name: '外部访客' },
  { id: 'role_partner', name: '合作机构' },
];

const INITIAL_RULES: SecurityRule[] = [
  {
    id: 'rule_001', name: '市民手机号脱敏规则',
    description: '对人口库中的手机号进行中间4位遮蔽处理',
    dataSourceId: 'ds_pop', dataSourceName: '全省人口基础信息库',
    tableName: 'tb_citizen（市民信息）', targetField: 'phone_number', fieldLabel: '手机号码',
    ruleType: 'phone',
    roleBindings: [
      { roleId: 'role_admin', roleName: '系统管理员', maskLevel: 'none' },
      { roleId: 'role_operator', roleName: '业务操作员', maskLevel: 'partial' },
      { roleId: 'role_analyst', roleName: '数据分析师', maskLevel: 'partial' },
      { roleId: 'role_visitor', roleName: '外部访客', maskLevel: 'full' },
    ],
    status: 'active', createTime: '2025-01-10 09:30',
  },
  {
    id: 'rule_002', name: '身份证号脱敏规则',
    description: '对身份证号保留首6位及末4位，中间8位用*替代',
    dataSourceId: 'ds_pop', dataSourceName: '全省人口基础信息库',
    tableName: 'tb_citizen（市民信息）', targetField: 'id_card_no', fieldLabel: '身份证号',
    ruleType: 'idcard',
    roleBindings: [
      { roleId: 'role_admin', roleName: '系统管理员', maskLevel: 'none' },
      { roleId: 'role_auditor', roleName: '合规审计员', maskLevel: 'partial' },
      { roleId: 'role_analyst', roleName: '数据分析师', maskLevel: 'full' },
      { roleId: 'role_visitor', roleName: '外部访客', maskLevel: 'full' },
    ],
    status: 'active', createTime: '2025-01-11 14:20',
  },
  {
    id: 'rule_003', name: '患者姓名脱敏规则',
    description: '对医疗档案中患者姓名进行星号脱敏处理',
    dataSourceId: 'ds_health', dataSourceName: '医疗健康电子档案',
    tableName: 'tb_patient（患者信息）', targetField: 'patient_name', fieldLabel: '患者姓名',
    ruleType: 'name',
    roleBindings: [
      { roleId: 'role_admin', roleName: '系统管理员', maskLevel: 'none' },
      { roleId: 'role_operator', roleName: '业务操作员', maskLevel: 'partial' },
      { roleId: 'role_visitor', roleName: '外部访客', maskLevel: 'full' },
    ],
    status: 'active', createTime: '2025-01-12 11:05',
  },
  {
    id: 'rule_004', name: '电商用户邮箱脱敏',
    description: '对注册邮箱@前部分进行部分遮蔽处理',
    dataSourceId: 'ds_ecomm', dataSourceName: '电商用户行为数据库',
    tableName: 'tb_user（用户信息）', targetField: 'user_email', fieldLabel: '注册邮箱',
    ruleType: 'email',
    roleBindings: [
      { roleId: 'role_admin', roleName: '系统管理员', maskLevel: 'none' },
      { roleId: 'role_analyst', roleName: '数据分析师', maskLevel: 'partial' },
      { roleId: 'role_partner', roleName: '合作机构', maskLevel: 'full' },
    ],
    status: 'active', createTime: '2025-01-13 16:40',
  },
  {
    id: 'rule_005', name: '家庭地址脱敏规则',
    description: '仅保留省市信息，隐藏详细街道地址',
    dataSourceId: 'ds_pop', dataSourceName: '全省人口基础信息库',
    tableName: 'tb_citizen（市民信息）', targetField: 'home_address', fieldLabel: '家庭地址',
    ruleType: 'address',
    roleBindings: [
      { roleId: 'role_admin', roleName: '系统管理员', maskLevel: 'none' },
      { roleId: 'role_operator', roleName: '业务操作员', maskLevel: 'partial' },
      { roleId: 'role_visitor', roleName: '外部访客', maskLevel: 'full' },
    ],
    status: 'inactive', createTime: '2025-01-14 10:15',
  },
  {
    id: 'rule_006', name: '违章记录联系电话脱敏',
    description: '交通违章记录中驾驶人联系电话的脱敏处理',
    dataSourceId: 'ds_traffic', dataSourceName: '智慧交通违章记录库',
    tableName: 'tb_violation（违章记录）', targetField: 'driver_phone', fieldLabel: '联系电话',
    ruleType: 'phone',
    roleBindings: [
      { roleId: 'role_admin', roleName: '系统管理员', maskLevel: 'none' },
      { roleId: 'role_operator', roleName: '业务操作员', maskLevel: 'partial' },
      { roleId: 'role_visitor', roleName: '外部访客', maskLevel: 'full' },
    ],
    status: 'active', createTime: '2025-01-15 09:00',
  },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const SAMPLE_VALUES: Record<RuleType, string[]> = {
  phone:   ['13812345678', '15987654321', '17634567890', '18901234567', '13698765432'],
  idcard:  ['420106199001012345', '420111198507230123', '420112200003150456'],
  email:   ['zhangsan@gmail.com', 'lisi_work@company.cn', 'wangwu2024@163.com'],
  name:    ['张三丰', '李小明', '王芳', '陈大华', '赵雅丽'],
  address: ['湖北省武汉市洪山区珞狮路100号', '湖北省黄石市下陆区铁山路28号', '湖北省宜昌市西陵区葛洲坝路5号'],
  custom:  ['USER_1234567890', 'ACC_9876543210', 'ORD_2468013579'],
};

const applyMask = (value: string, ruleType: RuleType, level: MaskLevel): string => {
  if (level === 'none') return value;
  if (level === 'full') return '●'.repeat(Math.min(value.length, 10));
  switch (ruleType) {
    case 'phone':   return value.slice(0, 3) + '****' + value.slice(7);
    case 'idcard':  return value.slice(0, 6) + '********' + value.slice(14);
    case 'email': {
      const atIdx = value.indexOf('@');
      if (atIdx < 0) return value.slice(0, 2) + '****';
      const local = value.slice(0, atIdx);
      return local.slice(0, Math.min(3, local.length)) + '***' + value.slice(atIdx);
    }
    case 'name':    return value[0] + '*'.repeat(Math.max(1, value.length - 1));
    case 'address': {
      const m = value.match(/^(.+?[省市])/);
      return m ? m[1] + '***（详细地址已隐藏）' : value.slice(0, 4) + '***';
    }
    default: return value.slice(0, 2) + '****' + value.slice(-2);
  }
};

type RuleTypeMeta = { label: string; color: string; bg: string; Icon: React.FC<{ size?: number }> };
const RULE_TYPE_META: Record<RuleType, RuleTypeMeta> = {
  phone:   { label: '手机号',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',   Icon: Phone },
  idcard:  { label: '身份证',  color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', Icon: CreditCard },
  email:   { label: '邮箱',    color: 'text-cyan-600',   bg: 'bg-cyan-50 border-cyan-200',   Icon: Mail },
  name:    { label: '姓名',    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200', Icon: Users },
  address: { label: '地址',    color: 'text-green-600',  bg: 'bg-green-50 border-green-200', Icon: MapPin },
  custom:  { label: '自定义',  color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-200', Icon: Settings },
};

const MASK_LEVEL_META: Record<MaskLevel, { label: string; activeCls: string }> = {
  none:    { label: '不脱敏',   activeCls: 'bg-green-50 border-green-300 text-green-700' },
  partial: { label: '部分脱敏', activeCls: 'bg-amber-50 border-amber-300 text-amber-700' },
  full:    { label: '完全脱敏', activeCls: 'bg-red-50 border-red-300 text-red-600' },
};

const fmtNow = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

type ViewState = 'list' | 'create' | 'test';

export const DataSecurityRulePanel: React.FC = () => {
  const [view, setView]           = useState<ViewState>('list');
  const [rules, setRules]         = useState<SecurityRule[]>(INITIAL_RULES);
  const [testRule, setTestRule]   = useState<SecurityRule | null>(null);
  const [editRule, setEditRule]   = useState<SecurityRule | null>(null);
  const [filterType, setFilterType] = useState<RuleType | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SecurityRule | null>(null);

  const filteredRules = useMemo(() =>
    rules.filter(r => {
      const matchType   = filterType === 'all' || r.ruleType === filterType;
      const matchSearch = r.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          r.dataSourceName.includes(searchText);
      return matchType && matchSearch;
    }), [rules, filterType, searchText]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<RuleType | 'all', number>> = { all: rules.length };
    rules.forEach(r => { counts[r.ruleType] = (counts[r.ruleType] || 0) + 1; });
    return counts;
  }, [rules]);

  const handleToggleStatus = (id: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r));

  const confirmDelete = () => {
    if (deleteTarget) { setRules(prev => prev.filter(r => r.id !== deleteTarget.id)); setDeleteTarget(null); }
  };

  const handleSaveRule = (rule: SecurityRule) => {
    setRules(prev => {
      const exists = prev.some(r => r.id === rule.id);
      return exists ? prev.map(r => r.id === rule.id ? rule : r) : [rule, ...prev];
    });
    setView('list');
  };

  if (view === 'create') {
    return <RuleCreateView initialRule={editRule} onBack={() => setView('list')} onSave={handleSaveRule} />;
  }
  if (view === 'test' && testRule) {
    return <RuleTestView rule={testRule} onBack={() => setView('list')} />;
  }

  // ─── List View ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-white h-full animate-fadeIn overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">数据安全规则</h2>
          <div className="relative group ml-1">
            <div className="p-1 hover:bg-slate-100 rounded-full cursor-help transition-colors">
              <Lightbulb size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
            </div>
            <div className="absolute left-0 top-full mt-2 w-[300px] bg-slate-800/95 text-white p-4 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all z-[100] ring-1 ring-white/10">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <Info size={14} className="text-blue-400" />
                <span className="text-[14px] font-bold">数据安全规则说明</span>
              </div>
              <div className="space-y-2 text-slate-300 text-[13px]">
                <p><strong className="text-white">规则配置：</strong>支持手机、身份证、邮箱等多种脱敏策略。</p>
                <p><strong className="text-white">角色绑定：</strong>不同角色可看到不同层级的脱敏数据。</p>
                <p><strong className="text-white">规则测试：</strong>配置完成后可立即验证脱敏效果。</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-[14px] font-medium hover:bg-slate-50 transition-all">
            <RefreshCw size={14} className="text-blue-500" /> 刷新
          </button>
          <button
            onClick={() => { setEditRule(null); setView('create'); }}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            <Plus size={16} /> 新建规则
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-b border-slate-50 flex gap-4 flex-shrink-0">
        {[
          { label: '规则总数', value: rules.length,                                  cls: 'text-slate-700 bg-slate-50' },
          { label: '生效中',   value: rules.filter(r => r.status === 'active').length,   cls: 'text-blue-600 bg-blue-50' },
          { label: '已停用',   value: rules.filter(r => r.status === 'inactive').length, cls: 'text-slate-400 bg-slate-50' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-1.5 ${s.cls} rounded-lg`}>
            <span className="text-[12px] text-slate-500 font-medium">{s.label}</span>
            <span className={`text-[20px] font-black ${s.cls.split(' ')[0]}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-[210px] flex-shrink-0 border-r border-slate-100 p-4 space-y-0.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">规则类型</p>
          {([
            ['all', '全部规则', Shield] as [string, string, React.FC<{ size?: number }>],
            ...Object.entries(RULE_TYPE_META).map(([k, v]) => [k, `${v.label}脱敏`, v.Icon] as [string, string, React.FC<{ size?: number }>]),
          ]).map(([key, label, Icon]) => {
            const count = typeCounts[key as RuleType | 'all'] || 0;
            const active = filterType === key;
            return (
              <button
                key={key}
                onClick={() => setFilterType(key as RuleType | 'all')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{label}</span>
                <span className={`text-[11px] min-w-[20px] px-1.5 py-0.5 rounded-full font-bold text-center ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Rule Table */}
        <div className="flex-1 flex flex-col p-5 overflow-hidden">
          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
                placeholder="搜索规则名称或数据源..."
                className="w-80 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 text-[14px] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl shadow-sm">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-[#f8fafc] text-[#475569] border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-bold w-10 text-center">序号</th>
                  <th className="p-4 font-bold">规则名称</th>
                  <th className="p-4 font-bold">规则类型</th>
                  <th className="p-4 font-bold">绑定数据源</th>
                  <th className="p-4 font-bold">脱敏字段</th>
                  <th className="p-4 font-bold text-center">绑定角色</th>
                  <th className="p-4 font-bold text-center">状态</th>
                  <th className="p-4 font-bold">创建时间</th>
                  <th className="p-4 font-bold text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRules.map((rule, idx) => {
                  const meta = RULE_TYPE_META[rule.ruleType];
                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-center text-slate-400 font-medium tabular-nums">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 tracking-tight">{rule.name}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5 max-w-[200px] truncate">{rule.description}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[12px] font-bold ${meta.bg} ${meta.color}`}>
                          <meta.Icon size={11} /> {meta.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-slate-700 font-medium text-[13px]">{rule.dataSourceName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rule.tableName}</div>
                      </td>
                      <td className="p-4">
                        <code className="text-[12px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">{rule.targetField}</code>
                        <div className="text-[11px] text-slate-400 mt-0.5">{rule.fieldLabel}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-full">
                          <Users size={12} className="text-slate-500" />
                          <span className="text-[13px] font-bold text-slate-600">{rule.roleBindings.length}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(rule.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${rule.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
                        >
                          {rule.status === 'active'
                            ? <><CheckCircle2 size={12} />生效中</>
                            : <><X size={12} />已停用</>}
                        </button>
                      </td>
                      <td className="p-4 text-slate-500 text-[12px] font-mono">{rule.createTime}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3 text-slate-300">
                          <button
                            onClick={() => { setTestRule(rule); setView('test'); }}
                            className="hover:text-green-500 transition-colors" title="规则测试"
                          >
                            <Play size={15} />
                          </button>
                          <button
                            onClick={() => { setEditRule(rule); setView('create'); }}
                            className="hover:text-blue-500 transition-colors" title="编辑"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(rule)}
                            className="hover:text-red-500 transition-colors" title="删除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRules.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center opacity-20">
                <Shield size={48} className="mb-2" />
                <p className="font-bold">暂无安全规则</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 px-1 text-[13px] text-slate-500">
            <span>共 <strong>{filteredRules.length}</strong> 条规则</span>
            <div className="flex items-center gap-2">
              <button disabled className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 disabled:opacity-30">
                <ChevronLeft size={15} />
              </button>
              <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold shadow-sm shadow-blue-100 text-[13px]">1</button>
              <button disabled className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 disabled:opacity-30">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-[420px] border border-slate-200 overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-50/50">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">确认删除该规则？</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed px-4">
                规则 <span className="text-red-600 font-bold">"{deleteTarget.name}"</span> 将被永久删除，绑定角色的数据将恢复默认显示。
              </p>
            </div>
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-[14px] font-bold hover:bg-white transition-all">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all">确定删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Create / Edit View ───────────────────────────────────────────────────────

interface CreateViewProps {
  initialRule: SecurityRule | null;
  onBack: () => void;
  onSave: (rule: SecurityRule) => void;
}

const STEPS = ['基础信息', '数据绑定', '脱敏策略', '角色绑定'];

const RuleCreateView: React.FC<CreateViewProps> = ({ initialRule, onBack, onSave }) => {
  const [step, setStep]             = useState(0);
  const [name, setName]             = useState(initialRule?.name || '');
  const [description, setDescription] = useState(initialRule?.description || '');
  const [ruleType, setRuleType]     = useState<RuleType>(initialRule?.ruleType || 'phone');
  const [dataSourceId, setDataSourceId] = useState(initialRule?.dataSourceId || '');
  const [tableId, setTableId]       = useState('');
  const [fieldId, setFieldId]       = useState('');
  const [roleBindings, setRoleBindings] = useState<RoleBinding[]>(
    initialRule?.roleBindings ||
    ALL_ROLES.map(r => ({ roleId: r.id, roleName: r.name, maskLevel: 'partial' as MaskLevel }))
  );

  const selectedSource = MOCK_SOURCES.find(s => s.id === dataSourceId);
  const selectedTable  = selectedSource?.tables.find(t => t.id === tableId);

  React.useEffect(() => {
    if (!initialRule) return;
    const src = MOCK_SOURCES.find(s => s.id === initialRule.dataSourceId);
    if (!src) return;
    const tbl = src.tables.find(t => t.name === initialRule.tableName);
    if (!tbl) return;
    setTableId(tbl.id);
    const fld = tbl.fields.find(f => f.name === initialRule.targetField);
    if (fld) setFieldId(fld.id);
  }, [initialRule]);

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return !!dataSourceId && !!tableId && !!fieldId;
    return true;
  };

  const handleSave = () => {
    const src = MOCK_SOURCES.find(s => s.id === dataSourceId);
    const tbl = src?.tables.find(t => t.id === tableId);
    const fld = tbl?.fields.find(f => f.id === fieldId);
    if (!src || !tbl || !fld) return;
    onSave({
      id: initialRule?.id || `rule_${Date.now()}`,
      name, description, ruleType,
      dataSourceId, dataSourceName: src.name,
      tableName: tbl.name, targetField: fld.name, fieldLabel: fld.label,
      roleBindings,
      status: initialRule?.status || 'active',
      createTime: initialRule?.createTime || fmtNow(),
    });
  };

  const sample0 = SAMPLE_VALUES[ruleType][0];

  return (
    <div className="flex-1 flex flex-col bg-white h-full animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-[14px] transition-colors font-medium">
          <ArrowLeft size={16} /> 返回
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <h2 className="text-[17px] font-bold text-slate-800">{initialRule ? '编辑安全规则' : '新建安全规则'}</h2>
      </div>

      {/* Stepper */}
      <div className="px-10 py-5 border-b border-slate-50 flex-shrink-0">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black transition-all ${i < step ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}>
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`text-[12px] font-bold whitespace-nowrap ${i === step ? 'text-blue-600' : i < step ? 'text-slate-600' : 'text-slate-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all ${i < step ? 'bg-blue-400' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        <div className="max-w-2xl mx-auto">

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2"><span className="text-red-500 mr-1">*</span>规则名称</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="例：市民手机号脱敏规则"
                  className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-3"><span className="text-red-500 mr-1">*</span>规则类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(RULE_TYPE_META) as [RuleType, RuleTypeMeta][]).map(([key, meta]) => (
                    <button
                      key={key} onClick={() => setRuleType(key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-[14px] font-bold transition-all ${ruleType === key ? `border-blue-500 bg-blue-50 ${meta.color}` : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <meta.Icon size={16} />
                      {meta.label}脱敏
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2">规则描述</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="请输入规则的用途描述..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] resize-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Step 1: Data Binding */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-2"><span className="text-red-500 mr-1">*</span>选择数据源（已入库）</label>
                <div className="relative">
                  <select
                    value={dataSourceId}
                    onChange={e => { setDataSourceId(e.target.value); setTableId(''); setFieldId(''); }}
                    className="w-full h-10 pl-4 pr-10 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] appearance-none bg-white cursor-pointer"
                  >
                    <option value="">请选择数据源...</option>
                    {MOCK_SOURCES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {dataSourceId && (
                <div className="animate-fadeIn">
                  <label className="block text-[14px] font-bold text-slate-700 mb-2"><span className="text-red-500 mr-1">*</span>选择数据表</label>
                  <div className="relative">
                    <select
                      value={tableId}
                      onChange={e => { setTableId(e.target.value); setFieldId(''); }}
                      className="w-full h-10 pl-4 pr-10 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] appearance-none bg-white cursor-pointer"
                    >
                      <option value="">请选择数据表...</option>
                      {selectedSource?.tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {tableId && (
                <div className="animate-fadeIn">
                  <label className="block text-[14px] font-bold text-slate-700 mb-2"><span className="text-red-500 mr-1">*</span>选择脱敏字段</label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTable?.fields.map(f => (
                      <button
                        key={f.id} onClick={() => setFieldId(f.id)}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-[13px] font-medium transition-all text-left ${fieldId === f.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <Database size={14} className={fieldId === f.id ? 'text-blue-500' : 'text-slate-400'} />
                        <div>
                          <div className="font-bold">{f.label}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{f.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {fieldId && (
                <div className="animate-fadeIn p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wide">数据样本预览</p>
                  <div className="flex gap-2 flex-wrap">
                    {SAMPLE_VALUES[ruleType].slice(0, 5).map((v, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[13px] font-mono text-slate-600 shadow-sm">{v}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Mask Strategy */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                <Info size={16} className="text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-bold text-blue-700">已选规则类型：{RULE_TYPE_META[ruleType].label}脱敏</p>
                  <p className="text-[12px] text-blue-600 mt-0.5">系统已根据规则类型内置最优脱敏算法，下方展示脱敏效果</p>
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-bold text-slate-700 mb-3">脱敏效果对比预览</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200">
                    <div className="p-3 text-[12px] font-bold text-slate-500">原始数据</div>
                    <div className="p-3 text-[12px] font-bold text-amber-600 border-l border-slate-200">部分脱敏（partial）</div>
                    <div className="p-3 text-[12px] font-bold text-red-500 border-l border-slate-200">完全脱敏（full）</div>
                  </div>
                  {SAMPLE_VALUES[ruleType].slice(0, 4).map((val, i) => (
                    <div key={i} className="grid grid-cols-3 border-t border-slate-100 hover:bg-slate-50/50">
                      <div className="p-3 font-mono text-[13px] text-slate-700">{val}</div>
                      <div className="p-3 font-mono text-[13px] text-amber-700 border-l border-slate-100">{applyMask(val, ruleType, 'partial')}</div>
                      <div className="p-3 font-mono text-[13px] text-red-500 border-l border-slate-100">{applyMask(val, ruleType, 'full')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Role Binding */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[13px] text-slate-600">
                  为每个角色配置数据可见级别。
                  <strong className="text-green-700">不脱敏</strong> = 查看原始数据；
                  <strong className="text-amber-600">部分脱敏</strong> = 中间字符遮蔽；
                  <strong className="text-red-500">完全脱敏</strong> = 全部替换为遮蔽符号。
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center bg-slate-50 border-b border-slate-200 px-5 py-3">
                  <span className="text-[12px] font-bold text-slate-500">角色名称</span>
                  <span className="text-[12px] font-bold text-slate-500 mx-6">权限等级</span>
                  <span className="text-[12px] font-bold text-slate-500">数据效果预览</span>
                </div>
                {roleBindings.map((rb, idx) => (
                  <div key={rb.roleId} className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-3 border-t border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                        <Users size={13} className="text-slate-500" />
                      </div>
                      <span className="text-[14px] font-medium text-slate-700">{rb.roleName}</span>
                    </div>
                    <div className="flex gap-1.5 mx-6">
                      {(['none', 'partial', 'full'] as MaskLevel[]).map(lvl => {
                        const isSelected = rb.maskLevel === lvl;
                        return (
                          <button
                            key={lvl}
                            onClick={() => setRoleBindings(prev => prev.map((r, i) => i === idx ? { ...r, maskLevel: lvl } : r))}
                            className={`px-2.5 py-1 rounded-lg text-[12px] font-bold border transition-all ${isSelected ? MASK_LEVEL_META[lvl].activeCls : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                          >
                            {MASK_LEVEL_META[lvl].label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="font-mono text-[13px]">
                      {rb.maskLevel === 'none'
                        ? <span className="text-green-700 font-bold">{sample0}</span>
                        : rb.maskLevel === 'partial'
                        ? <span className="text-amber-600 font-bold">{applyMask(sample0, ruleType, 'partial')}</span>
                        : <span className="text-red-500 font-bold">{applyMask(sample0, ruleType, 'full')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-10 py-5 border-t border-slate-100 flex justify-between flex-shrink-0 bg-slate-50/50">
        <button onClick={onBack} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold hover:bg-white transition-colors">
          取消
        </button>
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold hover:bg-white transition-colors">
              <ChevronLeft size={16} /> 上一步
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一步 <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave} disabled={!canNext()}
              className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-40"
            >
              <CheckCircle2 size={16} /> 保存规则
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Test View ────────────────────────────────────────────────────────────────

interface TestViewProps {
  rule: SecurityRule;
  onBack: () => void;
}

const RuleTestView: React.FC<TestViewProps> = ({ rule, onBack }) => {
  const [testValues, setTestValues]     = useState<string[]>(SAMPLE_VALUES[rule.ruleType].slice(0, 4));
  const [isRunning, setIsRunning]       = useState(false);
  const [hasResult, setHasResult]       = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState(rule.roleBindings[0]?.roleId || '');
  const [testMs, setTestMs]             = useState(0);

  const runTest = () => {
    setIsRunning(true);
    setHasResult(false);
    const start = Date.now();
    const delay = 900 + Math.random() * 400;
    setTimeout(() => {
      setIsRunning(false);
      setHasResult(true);
      setTestMs(Math.round(Date.now() - start));
    }, delay);
  };

  const meta = RULE_TYPE_META[rule.ruleType];
  const activeBinding = rule.roleBindings.find(rb => rb.roleId === activeRoleTab);

  return (
    <div className="flex-1 flex flex-col bg-white h-full animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-[14px] transition-colors font-medium">
          <ArrowLeft size={16} /> 返回规则列表
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <h2 className="text-[17px] font-bold text-slate-800">规则测试</h2>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[12px] font-bold ${meta.bg} ${meta.color}`}>
          <meta.Icon size={11} /> {meta.label}
        </span>
        <span className="text-[14px] text-slate-500">{rule.name}</span>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* Left: config + input */}
        <div className="w-[360px] flex-shrink-0 border-r border-slate-100 flex flex-col">
          {/* Rule Summary */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[13px] font-bold text-slate-600 mb-3 uppercase tracking-wide">规则信息</h3>
            <div className="space-y-2">
              {[
                ['规则名称', rule.name],
                ['绑定数据源', rule.dataSourceName],
                ['数据表', rule.tableName],
                ['脱敏字段', `${rule.fieldLabel}（${rule.targetField}）`],
                ['绑定角色', `${rule.roleBindings.length} 个角色`],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2 text-[13px]">
                  <span className="text-slate-400 w-[72px] flex-shrink-0 font-medium">{k}</span>
                  <span className="text-slate-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Test Input */}
          <div className="flex-1 p-5 overflow-y-auto">
            <h3 className="text-[13px] font-bold text-slate-600 mb-1 uppercase tracking-wide">测试数据</h3>
            <p className="text-[12px] text-slate-400 mb-4">可直接修改下方测试值</p>
            <div className="space-y-2.5">
              {testValues.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[12px] text-slate-400 w-5 text-right tabular-nums">{i + 1}.</span>
                  <input
                    type="text" value={v}
                    onChange={e => setTestValues(prev => prev.map((val, j) => j === i ? e.target.value : val))}
                    className="flex-1 h-9 px-3 border border-slate-200 rounded-lg text-[13px] font-mono outline-none focus:border-blue-400 transition-all bg-white"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={runTest} disabled={isRunning}
              className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-70"
            >
              {isRunning
                ? <><RefreshCw size={15} className="animate-spin" />正在测试...</>
                : <><Play size={15} />执行测试</>}
            </button>
          </div>
        </div>

        {/* Right: results */}
        <div className="flex-1 flex flex-col p-5 overflow-hidden">
          {!hasResult && !isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <div className="p-8 bg-slate-50 rounded-3xl mb-5 border border-slate-100">
                <ShieldCheck size={52} className="opacity-30" />
              </div>
              <p className="font-bold text-slate-500 text-[16px]">点击"执行测试"开始</p>
              <p className="text-[13px] mt-1.5 text-slate-400">对比不同角色看到的脱敏数据效果</p>
            </div>
          )}

          {isRunning && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw size={42} className="animate-spin mb-5 text-blue-500" />
              <p className="font-bold text-slate-600 text-[15px]">正在执行规则测试…</p>
              <p className="text-[13px] mt-1.5">应用脱敏策略并生成角色视角结果</p>
            </div>
          )}

          {hasResult && (
            <div className="flex-1 flex flex-col animate-fadeIn overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-slate-800">测试结果</h3>
                <div className="flex items-center gap-2 text-[12px] text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
                  <CheckCircle2 size={13} />
                  测试完成 · {testValues.length} 条 · {testMs}ms
                </div>
              </div>

              {/* Role Tabs */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {rule.roleBindings.map(rb => (
                  <button
                    key={rb.roleId} onClick={() => setActiveRoleTab(rb.roleId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-bold border transition-all ${activeRoleTab === rb.roleId ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <Users size={12} />
                    {rb.roleName}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeRoleTab === rb.roleId ? 'bg-blue-500 text-white' : rb.maskLevel === 'none' ? 'bg-green-100 text-green-600' : rb.maskLevel === 'partial' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-500'}`}>
                      {MASK_LEVEL_META[rb.maskLevel].label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Result Table */}
              {activeBinding && (
                <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
                  {/* Role description */}
                  <div className={`px-5 py-3 border-b flex items-center gap-3 text-[13px] ${activeBinding.maskLevel === 'none' ? 'bg-green-50 border-green-100' : activeBinding.maskLevel === 'partial' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                    <Users size={14} className={activeBinding.maskLevel === 'none' ? 'text-green-600' : activeBinding.maskLevel === 'partial' ? 'text-amber-600' : 'text-red-500'} />
                    <span className={`font-bold ${activeBinding.maskLevel === 'none' ? 'text-green-700' : activeBinding.maskLevel === 'partial' ? 'text-amber-700' : 'text-red-600'}`}>
                      {activeBinding.roleName}
                    </span>
                    <span className={activeBinding.maskLevel === 'none' ? 'text-green-600' : activeBinding.maskLevel === 'partial' ? 'text-amber-600' : 'text-red-500'}>
                      · {MASK_LEVEL_META[activeBinding.maskLevel].label} — 该角色访问 <strong>{rule.fieldLabel}</strong> 字段时看到以下数据
                    </span>
                  </div>
                  <table className="w-full text-[14px] border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="p-4 font-bold text-slate-500 text-left w-10">#</th>
                        <th className="p-4 font-bold text-slate-500 text-left">原始数据</th>
                        <th className="p-4 font-bold text-slate-500 text-left">脱敏后数据（{activeBinding.roleName} 视角）</th>
                        <th className="p-4 font-bold text-slate-500 text-left">脱敏级别</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {testValues.map((val, i) => {
                        const masked = applyMask(val, rule.ruleType, activeBinding.maskLevel);
                        return (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-400 font-medium tabular-nums">{i + 1}</td>
                            <td className="p-4 font-mono text-slate-600">{val}</td>
                            <td className="p-4 font-mono font-bold">
                              <span className={activeBinding.maskLevel === 'none' ? 'text-green-700' : activeBinding.maskLevel === 'partial' ? 'text-amber-600' : 'text-red-500'}>
                                {masked}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${MASK_LEVEL_META[activeBinding.maskLevel].activeCls}`}>
                                {MASK_LEVEL_META[activeBinding.maskLevel].label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
