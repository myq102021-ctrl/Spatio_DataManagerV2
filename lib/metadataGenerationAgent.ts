/**
 * 元数据生成智能体：仅依据页面可见信息（卡片、DDL、样例值）推断，不凭空编造。
 */

export type MetadataRowShape = { key: string; en: string; cn: string; value: string };

export type SensitivityLevel = '公开' | '内部' | '敏感' | '高度敏感';

export type FieldConfidence = 'high' | 'medium' | 'low';

export interface MetadataAgentFieldResult {
  key: string;
  en: string;
  cn: string;
  value: string;
  confidence: FieldConfidence;
  /** 推断依据（页面字段 / DDL / 样例） */
  reasoning: string;
  /** 不确定时必填说明 */
  uncertainty?: string;
}

export interface SensitiveFieldMark {
  /** DDL 字段名或元数据项 */
  field: string;
  level: SensitivityLevel;
  category: '手机号' | '身份证' | '邮箱' | '地址' | '姓名' | '其他';
  evidence: string;
}

export interface MetadataAgentOutput {
  agentRole: '元数据生成智能体';
  generatedAt: string;
  /** 读取到的页面上下文摘要 */
  sourceSummary: string;
  fields: MetadataAgentFieldResult[];
  sensitiveFields: SensitiveFieldMark[];
  uncertainty: {
    overall?: string;
    notes: string[];
  };
}

/** 智能体输出 JSON Schema（供校验与对接大模型） */
export const METADATA_AGENT_OUTPUT_JSON_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['agentRole', 'generatedAt', 'sourceSummary', 'fields', 'sensitiveFields', 'uncertainty'],
  additionalProperties: false,
  properties: {
    agentRole: { const: '元数据生成智能体' },
    generatedAt: { type: 'string', format: 'date-time' },
    sourceSummary: { type: 'string', minLength: 1 },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'en', 'cn', 'value', 'confidence', 'reasoning'],
        additionalProperties: false,
        properties: {
          key: { type: 'string' },
          en: { type: 'string' },
          cn: { type: 'string' },
          value: { type: 'string' },
          confidence: { enum: ['high', 'medium', 'low'] },
          reasoning: { type: 'string' },
          uncertainty: { type: 'string' },
        },
      },
    },
    sensitiveFields: {
      type: 'array',
      items: {
        type: 'object',
        required: ['field', 'level', 'category', 'evidence'],
        additionalProperties: false,
        properties: {
          field: { type: 'string' },
          level: { enum: ['公开', '内部', '敏感', '高度敏感'] },
          category: {
            enum: ['手机号', '身份证', '邮箱', '地址', '姓名', '其他'],
          },
          evidence: { type: 'string' },
        },
      },
    },
    uncertainty: {
      type: 'object',
      required: ['notes'],
      additionalProperties: false,
      properties: {
        overall: { type: 'string' },
        notes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;

export interface AttributeFieldDef {
  name: string;
  type: string;
  length: string;
  desc: string;
}

export interface MetadataAgentPageContext {
  overview: {
    name: string;
    description: string;
    level: string;
    source: string;
    copyright: string;
    adminDivision: string;
    themePath: string;
    listingStatus: string;
    dataFormat: string;
    dataSize?: string;
    collectTime: string;
    ingestTime: string;
    updateTime: string;
  };
  tags: string[];
  ddlFields: AttributeFieldDef[];
  /** 数据表样例行（用于字段语义推断） */
  sampleRecords: Record<string, string>[];
  existingRows: MetadataRowShape[];
}

const AGENT_ROLE = '元数据生成智能体' as const;

const PHONE_RE = /1[3-9]\d{9}/;
const ID_CARD_RE = /\d{17}[\dXx]|\d{15}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function nonEmpty(s: string | undefined | null): string | null {
  const t = s?.trim();
  return t ? t : null;
}

/** 由字段定义生成 DDL 文本（供智能体上下文） */
export function buildDdlFromFieldDefs(fields: AttributeFieldDef[]): string {
  const lines = fields.map((f) => {
    const len = f.length ? `(${f.length})` : '';
    return `  ${f.name} ${f.type}${len} COMMENT '${f.desc.replace(/'/g, "''")}'`;
  });
  return `CREATE TABLE data_feature (\n${lines.join(',\n')}\n);`;
}

function inferDataTypeFromFormat(format: string, existing: string): { value: string; confidence: FieldConfidence; reasoning: string; uncertainty?: string } {
  const f = format.toLowerCase();
  if (f.includes('vector') || f.includes('point') || f.includes('polygon') || f.includes('line')) {
    return { value: 'shp', confidence: 'medium', reasoning: `数据格式卡片为「${format}」，映射为矢量类` };
  }
  if (f.includes('tiff') || f.includes('影像') || f.includes('栅格')) {
    return { value: 'tiff', confidence: 'medium', reasoning: `数据格式卡片为「${format}」` };
  }
  if (nonEmpty(existing)) {
    return { value: existing, confidence: 'low', reasoning: '沿用元数据草稿已有 dataType', uncertainty: '页面未明确文件扩展名，保留原值' };
  }
  return {
    value: '—',
    confidence: 'low',
    reasoning: '页面未提供可映射的数据格式',
    uncertainty: '请根据实际入库文件类型手工填写',
  };
}

function pickPublishTime(ctx: MetadataAgentPageContext): {
  value: string;
  confidence: FieldConfidence;
  reasoning: string;
  uncertainty?: string;
} {
  const t = nonEmpty(ctx.overview.updateTime) ?? nonEmpty(ctx.overview.ingestTime) ?? nonEmpty(ctx.overview.collectTime);
  if (t) {
    const datePart = t.slice(0, 10);
    return { value: datePart, confidence: 'high', reasoning: `取自页面时间字段：${t}` };
  }
  return {
    value: '—',
    confidence: 'low',
    reasoning: '页面无采集/入库/更新时间',
    uncertainty: '缺少时间信息，请手工填写 publishTime',
  };
}

function buildAbstract(ctx: MetadataAgentPageContext): MetadataAgentFieldResult {
  const parts: string[] = [];
  const name = nonEmpty(ctx.overview.name);
  const desc = nonEmpty(ctx.overview.description);
  if (desc) parts.push(desc);
  else if (name) parts.push(`数据集「${name}」。`);

  const extras: string[] = [];
  if (nonEmpty(ctx.overview.adminDivision)) extras.push(`行政区划：${ctx.overview.adminDivision}`);
  if (nonEmpty(ctx.overview.themePath)) extras.push(`数据主题：${ctx.overview.themePath}`);
  if (nonEmpty(ctx.overview.source)) extras.push(`来源：${ctx.overview.source}`);
  if (ctx.tags.length) extras.push(`标签：${ctx.tags.slice(0, 6).join('、')}`);
  if (extras.length) parts.push(extras.join('；'));

  const ddlHint =
    ctx.ddlFields.length > 0
      ? `属性表含 ${ctx.ddlFields.length} 个字段（如 ${ctx.ddlFields.slice(0, 3).map((f) => f.name).join('、')} 等）。`
      : '';
  if (ddlHint) parts.push(ddlHint);

  const value = parts.join('').slice(0, 520) || '—';
  const hasDesc = !!desc;
  return {
    key: 'abstract',
    en: 'abstract',
    cn: '摘要',
    value,
    confidence: hasDesc ? 'high' : 'medium',
    reasoning: hasDesc ? '数据说明卡片 + 页面其他字段拼接' : '由数据名称与页面卡片信息拼接，无独立说明正文',
    ...(hasDesc ? {} : { uncertainty: '建议补充数据说明后重新生成摘要' }),
  };
}

function scanSensitiveFields(ctx: MetadataAgentPageContext): SensitiveFieldMark[] {
  const marks: SensitiveFieldMark[] = [];
  const seen = new Set<string>();

  const push = (m: SensitiveFieldMark) => {
    const k = `${m.field}:${m.category}`;
    if (seen.has(k)) return;
    seen.add(k);
    marks.push(m);
  };

  for (const f of ctx.ddlFields) {
    const n = f.name.toUpperCase();
    const d = `${f.name} ${f.desc}`;
    if (/NAME|姓名|联系人|CREATOR|创建人|LEGAL|法人/i.test(n) || /姓名|联系人|创建人/.test(d)) {
      push({
        field: f.name,
        level: '内部',
        category: '姓名',
        evidence: `DDL 字段 ${f.name}：${f.desc}`,
      });
    }
    if (/ADDR|地址|LOCATION|坐落/i.test(n) || /地址|坐落/.test(d)) {
      push({
        field: f.name,
        level: '敏感',
        category: '地址',
        evidence: `DDL 字段 ${f.name}：${f.desc}`,
      });
    }
    if (/PHONE|MOBILE|TEL|手机|电话/i.test(n)) {
      push({
        field: f.name,
        level: '敏感',
        category: '手机号',
        evidence: `DDL 字段 ${f.name}`,
      });
    }
    if (/EMAIL|邮箱/i.test(n)) {
      push({
        field: f.name,
        level: '内部',
        category: '邮箱',
        evidence: `DDL 字段 ${f.name}`,
      });
    }
    if (/ID_CARD|IDCARD|身份证|证件号/i.test(n)) {
      push({
        field: f.name,
        level: '高度敏感',
        category: '身份证',
        evidence: `DDL 字段 ${f.name}`,
      });
    }
  }

  for (const row of ctx.sampleRecords.slice(0, 8)) {
    for (const [col, val] of Object.entries(row)) {
      const v = String(val ?? '');
      if (PHONE_RE.test(v)) {
        push({
          field: col,
          level: '敏感',
          category: '手机号',
          evidence: `样例值含手机号模式：${v.slice(0, 11)}…`,
        });
      }
      if (ID_CARD_RE.test(v)) {
        push({
          field: col,
          level: '高度敏感',
          category: '身份证',
          evidence: `样例值含证件号模式（${col}）`,
        });
      }
      if (EMAIL_RE.test(v)) {
        push({
          field: col,
          level: '内部',
          category: '邮箱',
          evidence: `样例值含邮箱（${col}）`,
        });
      }
      if (/NAME_CN|CREATOR/i.test(col) && /[\u4e00-\u9fa5]{2,}/.test(v)) {
        push({
          field: col,
          level: '内部',
          category: '姓名',
          evidence: `样例含中文姓名/名称：${col}=${v}`,
        });
      }
      if (/区|县|市|路|号|街道|村|镇/.test(v) && v.length >= 4) {
        push({
          field: col,
          level: '敏感',
          category: '地址',
          evidence: `样例值含地址语义：${col}`,
        });
      }
    }
  }

  const contactRow = ctx.existingRows.find((r) => r.key === 'contact');
  const contactVal = contactRow?.value ?? '';
  if (PHONE_RE.test(contactVal)) {
    push({
      field: 'contact',
      level: '敏感',
      category: '手机号',
      evidence: '元数据 contact 含手机号',
    });
  }
  if (EMAIL_RE.test(contactVal)) {
    push({
      field: 'contact',
      level: '内部',
      category: '邮箱',
      evidence: '元数据 contact 含邮箱',
    });
  }
  if (/[\u4e00-\u9fa5]{2,4}/.test(contactVal) && /管理|联系|员|张三|李四/.test(contactVal)) {
    push({
      field: 'contact',
      level: '内部',
      category: '姓名',
      evidence: '元数据 contact 含联系人姓名',
    });
  }

  return marks;
}

function fieldResult(
  row: MetadataRowShape,
  value: string,
  confidence: FieldConfidence,
  reasoning: string,
  uncertainty?: string,
): MetadataAgentFieldResult {
  return {
    key: row.key,
    en: row.en,
    cn: row.cn,
    value,
    confidence,
    reasoning,
    ...(uncertainty ? { uncertainty } : {}),
  };
}

/**
 * 运行元数据生成智能体（本地规则引擎，结构符合 JSON Schema，可替换为 LLM 调用）
 */
export function runMetadataGenerationAgent(ctx: MetadataAgentPageContext): MetadataAgentOutput {
  const uncertaintyNotes: string[] = [];
  const existingByKey = new Map(ctx.existingRows.map((r) => [r.key, r]));

  const tagStr = ctx.tags.filter(Boolean).slice(0, 6).join('、') || '';
  const publish = pickPublishTime(ctx);
  const dataTypeInfer = inferDataTypeFromFormat(
    ctx.overview.dataFormat,
    existingByKey.get('dataType')?.value ?? '',
  );

  const fields: MetadataAgentFieldResult[] = ctx.existingRows.map((row) => {
    switch (row.key) {
      case 'dataID': {
        const name = nonEmpty(ctx.overview.name);
        if (name) {
          return fieldResult(row, name, 'high', '数据名称卡片 / 列表带入');
        }
        return fieldResult(row, row.value || '—', 'low', '页面无数据名称', '请填写数据名称');
      }
      case 'catagories': {
        if (tagStr) {
          return fieldResult(row, tagStr, 'high', '标签卡片');
        }
        const theme = nonEmpty(ctx.overview.themePath);
        if (theme) {
          return fieldResult(row, theme, 'medium', '无标签时使用数据主题路径', '建议补充标签后重新生成');
        }
        return fieldResult(row, row.value || '—', 'low', '无标签与主题', '请手工填写数据分类');
      }
      case 'dataSeclevel': {
        const level = nonEmpty(ctx.overview.level);
        if (level) {
          return fieldResult(row, level, 'high', '数据级别卡片');
        }
        return fieldResult(row, row.value || '—', 'low', '页面未填写数据级别');
      }
      case 'dataVer': {
        const kept = nonEmpty(row.value);
        if (kept && kept !== '—') {
          return fieldResult(row, kept, 'medium', '沿用元数据草稿', '页面未提供版本号，未自动递增');
        }
        uncertaintyNotes.push('dataVer：页面无版本信息，默认 V1.0 需人工确认');
        return fieldResult(row, 'V1.0', 'low', '页面无版本字段，采用默认占位', '请确认实际数据版本');
      }
      case 'dataType':
        return fieldResult(
          row,
          dataTypeInfer.value,
          dataTypeInfer.confidence,
          dataTypeInfer.reasoning,
          dataTypeInfer.uncertainty,
        );
      case 'serviceType': {
        const kept = nonEmpty(row.value);
        return fieldResult(
          row,
          kept ?? '时空服务',
          kept ? 'medium' : 'low',
          kept ? '沿用元数据草稿' : '页面未声明服务类型',
          kept ? undefined : '请根据实际发布服务类型确认',
        );
      }
      case 'publishTime':
        return fieldResult(
          row,
          publish.value,
          publish.confidence,
          publish.reasoning,
          publish.confidence === 'low' ? publish.uncertainty : undefined,
        );
      case 'uuid': {
        const kept = nonEmpty(row.value);
        if (kept && kept.length > 8) {
          return fieldResult(row, kept, 'high', '沿用已有唯一标识');
        }
        const uuid =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `gen-${Date.now().toString(36)}`;
        uncertaintyNotes.push('uuid：页面无业务 UUID，已生成技术标识供登记使用');
        return fieldResult(
          row,
          uuid,
          'medium',
          '系统生成技术 UUID（非业务字段取值）',
          '若库内已有固定编码请替换',
        );
      }
      case 'abstract':
        return buildAbstract(ctx);
      case 'contact': {
        const src = nonEmpty(ctx.overview.source);
        if (src) {
          return fieldResult(row, `数据管理单位 · ${src}`, 'medium', '数据来源卡片', '联系人姓名需业务侧补充');
        }
        return fieldResult(row, row.value || '—', 'low', '无联系人信息', '请填写联系人');
      }
      default:
        return fieldResult(row, row.value || '—', 'low', '无映射规则', '请手工填写');
    }
  });

  const sensitiveFields = scanSensitiveFields(ctx);
  if (sensitiveFields.length > 0) {
    uncertaintyNotes.push(
      `已识别 ${sensitiveFields.length} 项敏感相关字段，请核对数据安全等级（当前页面级别：${ctx.overview.level || '未填'}）`,
    );
  }

  const listed =
    ctx.overview.listingStatus === 'listed' ? '已上架' : '未上架';

  const sourceSummary = [
    `数据名称：${ctx.overview.name || '—'}`,
    `说明：${ctx.overview.description ? '已填写' : '未填写'}`,
    `标签：${tagStr || '无'}`,
    `格式：${ctx.overview.dataFormat}`,
    `级别：${ctx.overview.level}`,
    `来源：${ctx.overview.source}`,
    `行政区划：${ctx.overview.adminDivision}`,
    `主题：${ctx.overview.themePath}`,
    `上架：${listed}`,
    `DDL 字段数：${ctx.ddlFields.length}`,
    `样例行数：${ctx.sampleRecords.length}`,
  ].join('；');

  return {
    agentRole: AGENT_ROLE,
    generatedAt: new Date().toISOString(),
    sourceSummary,
    fields,
    sensitiveFields,
    uncertainty: {
      overall:
        uncertaintyNotes.length > 0
          ? '部分字段依据不足或存在敏感信息，请人工复核后再导入'
          : undefined,
      notes: uncertaintyNotes,
    },
  };
}

/** 将智能体 fields 转为元数据表行 */
export function metadataRowsFromAgentOutput(
  output: MetadataAgentOutput,
): MetadataRowShape[] {
  return output.fields.map((f) => ({
    key: f.key,
    en: f.en,
    cn: f.cn,
    value: f.value,
  }));
}

/** 轻量 JSON Schema 校验 */
export function validateMetadataAgentOutput(data: unknown): data is MetadataAgentOutput {
  if (!data || typeof data !== 'object') return false;
  const o = data as MetadataAgentOutput;
  if (o.agentRole !== AGENT_ROLE) return false;
  if (!Array.isArray(o.fields) || !Array.isArray(o.sensitiveFields)) return false;
  if (!o.uncertainty || !Array.isArray(o.uncertainty.notes)) return false;
  return o.fields.every(
    (f) =>
      typeof f.key === 'string' &&
      typeof f.value === 'string' &&
      ['high', 'medium', 'low'].includes(f.confidence),
  );
}

export const METADATA_AGENT_SYSTEM_PROMPT = `你是一个元数据生成智能体。
你的任务是读取当前页面的数据名称，根据 DDL、当前页面的数据名称、数据说明、标签、格式、数据级别、数据时间、来源、行政区划等卡片信息生成元数据字段取值。
不能凭空编造；不确定时必须在字段级 uncertainty 或 uncertainty.notes 中说明。
字段含义必须结合样例值和 DDL 字段注释判断。
输出必须符合 METADATA_AGENT_OUTPUT_JSON_SCHEMA。
涉及手机号、身份证、邮箱、地址、姓名等要在 sensitiveFields 中标记敏感等级。`;
