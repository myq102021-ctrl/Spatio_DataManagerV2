import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Sprout,
  Users,
  FileText,
  ArrowLeftRight,
  FlaskConical,
  Tractor,
  Package,
  TrendingUp,
  Factory,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Link2,
  Boxes,
} from 'lucide-react';
import {
  FULL_KNOWLEDGE_GRAPH,
  KG_ENTITY_TYPE_COLOR,
  KG_ENTITY_TYPE_LABEL,
  KG_LEGEND_GROUPS,
  getEntityById,
  type KgEntity,
  type KgEntityType,
  type LandParcelProfile,
} from '../knowledgeGraphMock';

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

function DetailInfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function LandParcelProfileView({ profile }: { profile: LandParcelProfile }) {
  return (
    <div className="space-y-4">
      <Section title="地块基础信息" icon={<MapPin size={12} />}>
        <dl className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
          <DetailInfoRow label="地块编码" value={profile.basic.parcel_code} />
          <DetailInfoRow label="面积" value={`${profile.basic.area_mu} 亩`} />
          <DetailInfoRow label="地类" value={profile.basic.land_type} />
          <DetailInfoRow label="耕地质量" value={profile.basic.quality_grade} />
          <DetailInfoRow label="中心坐标" value={profile.basic.centroid} />
          <DetailInfoRow label="状态" value={profile.basic.status} />
        </dl>
      </Section>

      <Section title="所属行政区划" icon={<MapPin size={12} />}>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          {profile.admin_division.path}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">区划代码 {profile.admin_division.admin_code}</p>
      </Section>

      <Section title="当前种植作物" icon={<Sprout size={12} />}>
        <div className="rounded-xl border border-lime-100 bg-lime-50/50 p-3 text-sm">
          <p className="font-bold text-lime-900">
            {profile.current_crop.crop_name} · {profile.current_crop.season}
          </p>
          <p className="mt-1 text-slate-600">
            {profile.current_crop.year}年 · 定植/播种 {profile.current_crop.plant_date}
          </p>
        </div>
      </Section>

      <Section title="历年种植记录" icon={<Sprout size={12} />}>
        <ul className="space-y-1.5">
          {profile.planting_history.map((h) => (
            <li
              key={`${h.year}-${h.season}`}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
            >
              <span className="font-semibold text-slate-800">
                {h.year} {h.season}
              </span>
              <span className="text-slate-600">{h.crop_name}</span>
              <span className="text-[11px] font-bold text-emerald-600">{h.yield_kg_mu} kg/亩</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="经营主体" icon={<Users size={12} />}>
        <dl className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
          <DetailInfoRow label="名称" value={profile.operator.entity_name} />
          <DetailInfoRow label="类型" value={profile.operator.entity_type} />
          <DetailInfoRow label="经营方式" value={profile.operator.mode} />
          <DetailInfoRow label="起始日期" value={profile.operator.since} />
        </dl>
      </Section>

      <Section title="权属信息" icon={<FileText size={12} />}>
        {profile.ownership.map((o, i) => (
          <dl key={i} className="mb-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <DetailInfoRow label="权利类型" value={o.right_type} />
            <DetailInfoRow label="权利人" value={o.holder} />
            <DetailInfoRow label="份额" value={o.share_ratio} />
            <DetailInfoRow label="权证号" value={o.cert_no} />
          </dl>
        ))}
      </Section>

      {profile.transfer.length > 0 && (
        <Section title="流转信息" icon={<ArrowLeftRight size={12} />}>
          {profile.transfer.map((t) => (
            <dl key={t.contract_id} className="rounded-xl border border-orange-100 bg-orange-50/40 p-3">
              <DetailInfoRow label="合同编号" value={t.contract_id} />
              <DetailInfoRow label="流转类型" value={t.type} />
              <DetailInfoRow label="流出方" value={t.from} />
              <DetailInfoRow label="流入方" value={t.to} />
              <DetailInfoRow label="到期日" value={t.end_date} />
              <DetailInfoRow label="价格" value={`${t.price_yuan_mu} 元/亩/年`} />
            </dl>
          ))}
        </Section>
      )}

      <Section title="土壤肥力" icon={<FlaskConical size={12} />}>
        <dl className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
          <DetailInfoRow label="肥力等级" value={profile.soil_fertility.fertility_grade} />
          <DetailInfoRow label="检测日期" value={profile.soil_fertility.latest_test.date} />
          <DetailInfoRow label="pH" value={profile.soil_fertility.latest_test.ph} />
          <DetailInfoRow label="有机质" value={profile.soil_fertility.latest_test.om} />
          <DetailInfoRow label="氮" value={profile.soil_fertility.latest_test.n} />
          <DetailInfoRow label="磷" value={profile.soil_fertility.latest_test.p} />
          <DetailInfoRow label="钾" value={profile.soil_fertility.latest_test.k} />
        </dl>
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.soil_fertility.suitable_crops.map((c) => (
            <span
              key={c}
              className="rounded-md bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-800"
            >
              宜 {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title="农事活动" icon={<Tractor size={12} />}>
        <ul className="space-y-1.5">
          {profile.farm_activities.map((a, i) => (
            <li key={i} className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-[12px]">
              <span className="font-bold text-slate-800">{a.date}</span>
              <span className="mx-2 text-slate-300">|</span>
              <span className="text-cyan-700">{a.type}</span>
              {a.input !== '—' && <p className="mt-0.5 text-slate-500">投入：{a.input}</p>}
              {a.service !== '—' && <p className="mt-0.5 text-slate-500">农机：{a.service}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="产量与收益" icon={<TrendingUp size={12} />}>
        <dl className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
          <DetailInfoRow label="年份" value={profile.yield_and_revenue.latest.year} />
          <DetailInfoRow label="总产量" value={`${profile.yield_and_revenue.latest.total_kg} kg`} />
          <DetailInfoRow label="销售量" value={`${profile.yield_and_revenue.latest.sales_kg} kg`} />
          <DetailInfoRow label="均价" value={`${profile.yield_and_revenue.latest.avg_price} 元/kg`} />
          <DetailInfoRow label="收益" value={`${profile.yield_and_revenue.latest.revenue_yuan} 元`} />
        </dl>
      </Section>

      <Section title="加工与销售去向" icon={<Factory size={12} />}>
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-[12px] leading-relaxed text-indigo-900">
          {profile.supply_chain.path_summary}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {profile.supply_chain.nodes.map((n) => (
            <span
              key={n}
              className="rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-800"
            >
              {n}
            </span>
          ))}
        </div>
      </Section>

      {profile.risk_alerts.length > 0 && (
        <Section title="风险预警" icon={<AlertTriangle size={12} />}>
          {profile.risk_alerts.map((r, i) => (
            <div
              key={i}
              className="mb-2 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2 text-[12px]"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                  {r.level}
                </span>
                <span className="font-bold text-red-900">{r.type}</span>
              </div>
              <p className="mt-1 text-slate-700">{r.message}</p>
              <p className="mt-1 text-[10px] text-slate-400">{r.alert_time}</p>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

const TYPE_ORDER: KgEntityType[] = KG_LEGEND_GROUPS.flatMap((g) => g.types);

function RelatedEntitiesSection({
  relatedRelations,
  onNavigateEntity,
}: {
  relatedRelations: { rel: { id: string; label: string }; other: KgEntity }[];
  onNavigateEntity: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<KgEntityType, KgEntity[]>();
    for (const { other } of relatedRelations) {
      const list = map.get(other.type) ?? [];
      if (!list.some((e) => e.id === other.id)) list.push(other);
      map.set(other.type, list);
    }
    return TYPE_ORDER.filter((t) => map.has(t)).map((t) => ({
      type: t,
      label: KG_ENTITY_TYPE_LABEL[t],
      color: KG_ENTITY_TYPE_COLOR[t],
      entities: map.get(t)!,
    }));
  }, [relatedRelations]);

  const [expandedTypes, setExpandedTypes] = useState<Set<KgEntityType>>(new Set());

  useEffect(() => {
    setExpandedTypes(new Set(groups.map((g) => g.type)));
  }, [groups]);

  const totalCount = groups.reduce((n, g) => n + g.entities.length, 0);
  if (totalCount === 0) return null;

  const toggleType = (type: KgEntityType) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <Section title={`关联实体 (${totalCount})`} icon={<Boxes size={12} />}>
      <div className="space-y-2">
        {groups.map(({ type, label, color, entities }) => {
          const open = expandedTypes.has(type);
          return (
            <div
              key={type}
              className="overflow-hidden rounded-xl border border-slate-100 bg-white ring-1 ring-slate-900/[0.03]"
            >
              <button
                type="button"
                onClick={() => toggleType(type)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50"
              >
                <ChevronDown
                  size={14}
                  className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
                />
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-[12px] font-bold text-slate-800">{label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  {entities.length}
                </span>
              </button>
              {open && (
                <ul className="border-t border-slate-100 px-2 py-1.5">
                  {entities.map((ent) => {
                    const relLabels = relatedRelations
                      .filter((r) => r.other.id === ent.id)
                      .map((r) => r.rel.label);
                    return (
                      <li key={ent.id}>
                        <button
                          type="button"
                          onClick={() => onNavigateEntity(ent.id)}
                          className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-2 text-left transition hover:bg-blue-50/60"
                        >
                          <span className="text-[13px] font-semibold text-slate-800">{ent.name}</span>
                          {relLabels.length > 0 && (
                            <span className="text-[10px] text-blue-600">
                              {relLabels.join(' · ')}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function GenericEntityDetail({
  entity,
  relatedRelations,
  onNavigateEntity,
}: {
  entity: KgEntity;
  relatedRelations: { rel: { id: string; label: string }; other: KgEntity }[];
  onNavigateEntity: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: KG_ENTITY_TYPE_COLOR[entity.type] }}
        >
          {KG_ENTITY_TYPE_LABEL[entity.type]}
        </span>
        <h3 className="mt-2 text-lg font-black text-slate-900">{entity.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{entity.description}</p>
      </div>

      <Section title="属性" icon={<Package size={12} />}>
        <dl className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          {Object.entries(entity.properties).map(([k, v]) => (
            <div key={k}>
              <DetailInfoRow label={k} value={String(v)} />
            </div>
          ))}
        </dl>
      </Section>

      <Section title={`关联关系 (${relatedRelations.length})`} icon={<Link2 size={12} />}>
        <ul className="space-y-2">
          {relatedRelations.map(({ rel, other }) => (
            <li key={rel.id}>
              <button
                type="button"
                onClick={() => onNavigateEntity(other.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50/50"
              >
                <span className="shrink-0 text-[10px] font-bold text-blue-600">{rel.label}</span>
                <ChevronRight size={12} className="shrink-0 text-slate-300" />
                <span className="truncate font-semibold text-slate-800">{other.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <RelatedEntitiesSection
        relatedRelations={relatedRelations}
        onNavigateEntity={onNavigateEntity}
      />
    </div>
  );
}

export interface KnowledgeGraphEntityDetailProps {
  entityId: string;
  onNavigateEntity: (id: string) => void;
}

export const KnowledgeGraphEntityDetail: React.FC<KnowledgeGraphEntityDetailProps> = ({
  entityId,
  onNavigateEntity,
}) => {
  const entity = getEntityById(entityId);
  if (!entity) return null;

  const relatedRelations = FULL_KNOWLEDGE_GRAPH.relations
    .filter((r) => r.sourceId === entityId || r.targetId === entityId)
    .map((rel) => {
      const otherId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
      const other = getEntityById(otherId);
      return other ? { rel, other } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (entity.type === 'land_parcel' && entity.parcelProfile) {
    return (
      <div className="space-y-4">
        <LandParcelProfileView profile={entity.parcelProfile} />
        <Section title={`关联关系 (${relatedRelations.length})`} icon={<Link2 size={12} />}>
          <ul className="space-y-2">
            {relatedRelations.map(({ rel, other }) => (
              <li key={rel.id}>
                <button
                  type="button"
                  onClick={() => onNavigateEntity(other.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-left text-sm transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <span className="shrink-0 text-[10px] font-bold text-blue-600">{rel.label}</span>
                  <ChevronRight size={12} className="shrink-0 text-slate-300" />
                  <span className="truncate font-semibold text-slate-800">{other.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
        <RelatedEntitiesSection
          relatedRelations={relatedRelations}
          onNavigateEntity={onNavigateEntity}
        />
      </div>
    );
  }

  return (
    <GenericEntityDetail
      entity={entity}
      relatedRelations={relatedRelations}
      onNavigateEntity={onNavigateEntity}
    />
  );
};
