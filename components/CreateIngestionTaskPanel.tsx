import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Undo2,
    ChevronDown,
    CloudUpload,
    X,
    FileCode,
    Loader2,
    Settings2,
    Table as TableIcon,
    Plus,
    CheckCircle2,
    Check,
    Database,
    HelpCircle,
    FileJson,
    FileArchive,
    Image as ImageIcon,
    Layers,
    Info,
    Tag as TagIcon,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Trash2,
    RefreshCw,
    XCircle,
    ClipboardCheck,
    ShieldCheck,
    ScanSearch,
    FileCheck2,
    Ruler,
    AlertTriangle,
    BookOpen,
    FilterX,
} from 'lucide-react';
import { RequirementsSpecDrawer, type FeaturePoint } from './RequirementsSpecDrawer';
import type { CloudFile } from './CloudDiskSelectionPage';
import { PaginationBar } from './PaginationBar';
import { DATA_THEME_BIND_OPTIONS } from '../constants';
import type { IngestionBatchSubTaskEditContext } from '../lib/ingestionBatchSubTaskEdit';
import {
    defaultMetadataModelForDataType,
    isIngestionRasterDataType,
    resolveIngestionTaskDataType,
} from '../lib/ingestionBatchSubTaskEdit';

interface CreateIngestionTaskPanelProps {
    onBack: () => void;
    onNavigate?: (menuId: string) => void;
    onOpenCloudDisk?: () => void;
    pendingCloudPick?: { token: number; files: CloudFile[] } | null;
    onPendingCloudPickConsumed?: () => void;
    /** 由列表页「新建单次/批量入库任务」传入，用于标题区分 */
    createMode?: 'single' | 'batch';
    /** 编辑批量子任务时传入；表单布局同新建，任务名称为任务组名称（只读） */
    editSubTask?: IngestionBatchSubTaskEditContext | null;
    /** 编辑完成后重新提交子任务 */
    onResubmitSubTask?: (payload: { subTaskName: string; taskId: string }) => void;
}

/** 云盘同步后的批量映射行；integrityStatus 为入库前数据完整性校验结果 */
interface ParsedFile {
    id: string;
    name: string;
    extension: string;
    format: string;
    /** 与「数据类型」下拉：矢量 / 影像 / 三维模型 对应 */
    dataCategory: 'vector' | 'raster' | 'model3d' | 'unknown';
    size: string;
    integrityStatus: 'ready' | 'fail';
    integrityReason?: string;
    /**
     * 压缩包内可识别的数据层名称列表。
     * 长度为 1 时表示与源文件一一对应（名称 = 去扩展名的文件名）；
     * 长度 > 1 时表示该包内包含多个数据集。
     */
    recognizedDataNames: string[];
    targetDb: string;
    targetTable: string;
    targetTableError?: string;
    targetAlias: string;
    targetAliasError?: string;
    isAutoCreate: boolean;
}

const MOCK_DATABASES = ['postgis_spatial_db', 'oracle_sde_production', 'mysql_geo_base'];
const MOCK_EXISTING_TABLES = ['t_hubei_points', 'res_water_line', 'admin_boundary_poly', 'osm_roads_main', 'henan_boundary_2024', 'zz_water_poly'];
const PRESET_TAGS = ['政务数据', '基础地理', '遥感影像', '实时监控', '社会经济', '生态环境'];

const SINGLE_DATA_TYPE_OPTIONS = [
    { label: '矢量', sub: '支持 shp、zip(shp)、gpkg、geojson' },
    { label: '影像', sub: '支持 tiff、tif、zip(tif、tiff)' },
    { label: '三维模型', sub: '支持 3DTiles' },
] as const;

/** 批量入库专用：标准卫星景产品包 */
const BATCH_SATELLITE_DATA_TYPE_OPTIONS = [
    { label: 'GF1标准卫星包', sub: '高分一号系列 L1A/L1B 标准景，支持 .tar.gz' },
    { label: 'GF2标准卫星包', sub: '高分二号系列标准景压缩包，支持 .tar.gz' },
    { label: 'ZY标准卫星包', sub: '资源卫星系列标准产品包，支持 .tar.gz' },
    { label: 'Sentinel标准卫星包', sub: 'Sentinel-1/2 标准产品包' },
    { label: 'Landsat标准卫星包', sub: 'Landsat 8/9 标准景产品包' },
] as const;

const SATELLITE_PACKAGE_DATA_TYPES: string[] = BATCH_SATELLITE_DATA_TYPE_OPTIONS.map((o) => o.label);

function isSatellitePackageDataType(dt: string): boolean {
    return SATELLITE_PACKAGE_DATA_TYPES.includes(dt);
}

function isRasterIngestionDataType(dt: string): boolean {
    return dt.includes('影像') || isSatellitePackageDataType(dt);
}

/** 由文件名 / 云盘类型推断所属标准卫星包（批量入库类型校验） */
function inferSatellitePackageKindFromName(name: string, typeHint = ''): string | null {
    const n = name.toLowerCase();
    const t = typeHint.toLowerCase();
    if (/gf1[a-z]?[_-]|^gf1[_\d]|高分一号|\bgf1\b/.test(n) || /\bgf1\b|高分一号/.test(t)) {
        return 'GF1标准卫星包';
    }
    if (/gf2[a-z]?[_-]|^gf2[_\d]|高分二号|\bgf2\b/.test(n) || /\bgf2\b|高分二号/.test(t)) {
        return 'GF2标准卫星包';
    }
    if (/zy\d|zy0|zy3|hj-1|hj1|资源卫星|资源三号/.test(n) || /zy\d|资源卫星/.test(t)) {
        return 'ZY标准卫星包';
    }
    if (/sentinel|s2[ab]_|s1[ab]_|哨兵/.test(n) || /sentinel|哨兵/.test(t)) {
        return 'Sentinel标准卫星包';
    }
    if (/landsat|lc0[89]|lc1[0-9]/.test(n) || /landsat/.test(t)) {
        return 'Landsat标准卫星包';
    }
    return null;
}

function fileMatchesSelectedDataType(
    file: ParsedFile,
    dataType: string,
    expectedKind: ParsedFile['dataCategory'] | null,
    cloudTypeHint?: string,
): boolean {
    if (!expectedKind) return true;
    if (file.dataCategory !== expectedKind) return false;
    if (!isSatellitePackageDataType(dataType)) return true;
    return inferSatellitePackageKindFromName(file.name, cloudTypeHint) === dataType;
}

/** 数据质检步骤：可选工具（示意） */
const QUALITY_INSPECTION_TOOLS: {
    id: string;
    name: string;
    description: string;
    corner: 'clipboard' | 'shield' | 'scan' | 'file' | 'ruler';
}[] = [
    {
        id: 'topo',
        name: '几何拓扑检查',
        description: '检测自相交、悬挂线、碎面与多边形闭合性等拓扑问题。',
        corner: 'ruler',
    },
    {
        id: 'schema',
        name: '属性规范校验',
        description: '对照数据标准校验字段类型、非空约束、值域与码表一致性。',
        corner: 'clipboard',
    },
    {
        id: 'crs',
        name: '坐标系与范围',
        description: '核对空间参考、投影参数及图幅范围是否与登记信息一致。',
        corner: 'shield',
    },
    {
        id: 'sensitive',
        name: '敏感信息扫描',
        description: '识别身份证号、手机号、坐标精度等敏感字段并提示脱敏策略。',
        corner: 'scan',
    },
    {
        id: 'raster',
        name: '影像波段与金字塔',
        description: '检查影像波段完整性、无效值域及切片金字塔是否可发布。',
        corner: 'file',
    },
    {
        id: 'naming',
        name: '命名与元数据',
        description: '校验图层命名、摘要与关键词是否符合组织内命名规范。',
        corner: 'clipboard',
    },
];

function inferDataFormat(cf: CloudFile): string {
    const n = cf.name.toLowerCase();
    const t = (cf.type || '').toLowerCase();
    if (n.endsWith('.gpkg')) return 'GPKG';
    if (n.endsWith('.geojson')) return 'JSON';
    if (n.endsWith('.csv')) return 'CSV';
    if (n.endsWith('.kml')) return 'KML';
    if (n.endsWith('.kmz')) return 'KMZ';
    if (n.endsWith('.dxf')) return 'DXF';
    if (/\.(tar\.gz|tgz)$/.test(n)) return 'ARCHIVE';
    if (/\.(tif|tiff|jp2|j2k|img)$/.test(n)) return 'TIFF';
    if (n.endsWith('.zip')) {
        if (n.includes('shp') || /shapefile/.test(t)) return 'SHP';
        if (/mapinfo|\.tab/.test(t)) return 'TAB';
        return 'ZIP';
    }
    if (n.endsWith('.shp')) return 'SHP';
    return 'FILE';
}

/** 与「数据类型」矢量 / 影像 / 三维模型 对齐的粗分类（扩展名 + 云盘 iconType + 文件名启发式） */
function inferDataCategory(cf: CloudFile): ParsedFile['dataCategory'] {
    const n = cf.name.toLowerCase();
    const t = (cf.type || '').toLowerCase();

    if (cf.iconType === 'model3d') return 'model3d';
    if (/\.(glb|gltf|b3dm|pnts|i3dm)$/.test(n)) return 'model3d';
    if (/3dtiles|三维模型|城市白膜|倾斜摄影/.test(t)) return 'model3d';

    if (cf.iconType === 'raster' || cf.iconType === 'tile_raster' || cf.iconType === 'terrain') return 'raster';
    if (/\.(tif|tiff|jp2|j2k|img|bmp|png|nc|cog)$/.test(n)) return 'raster';
    if (/\.(tar\.gz|tgz)$/.test(n)) {
        if (
            /gf\d|zy\d|zy0|hj-1|pms|landsat|sentinel|l1a|l1b|l2a|卫星影像|栅格|ortho|dom|dsm|dtm/.test(n) ||
            /卫星|影像|栅格|raw|瓦片|标准景/.test(t)
        ) {
            return 'raster';
        }
        return 'unknown';
    }
    if (n.endsWith('.zip')) {
        if (/gf|pms|landsat|sentinel|l1a|l1b|卫星|影像|raster|tif|ortho|dom/.test(n) || /卫星|影像|栅格|raw|瓦片/.test(t)) return 'raster';
        if (/shp|shapefile|矢量|vector|geojson|gpkg|kml|tab/.test(n) || /矢量|shapefile|vector/.test(t)) return 'vector';
    }

    if (cf.iconType === 'vector' || cf.iconType === 'tile_vector') return 'vector';
    if (n.endsWith('.shp') || n.endsWith('.gpkg') || n.endsWith('.geojson') || n.endsWith('.csv') || n.endsWith('.kml') || n.endsWith('.kmz') || n.endsWith('.dxf')) return 'vector';

    return 'unknown';
}

function extFromName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.endsWith('.tar.gz')) return '.tar.gz';
    if (lower.endsWith('.tgz')) return '.tgz';
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i) : '';
}

/** 生成「数据名称」：去掉 .tar.gz / .tgz / .zip 等压缩包后缀，保留卫星产品原名 */
function stripDataNameExtension(filename: string): string {
    let stem = filename.trim();
    if (/\.tar\.gz$/i.test(stem)) return stem.slice(0, -7);
    if (/\.tgz$/i.test(stem)) return stem.slice(0, -4);
    if (/\.tar$/i.test(stem)) return stem.slice(0, -4);
    if (/\.zip$/i.test(stem)) return stem.slice(0, -4);
    const dot = stem.lastIndexOf('.');
    if (dot > 0) return stem.slice(0, dot);
    return stem;
}

/** 数据名称校验：允许卫星元数据包常见字符（含小数点、连字符） */
function validateDataAliasName(name: string): string | undefined {
    const trimmed = name.trim();
    if (!trimmed) return '数据名称不能为空';
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_.-]+$/.test(trimmed)) {
        return '禁止特殊字符';
    }
    return undefined;
}

function defaultTableSlug(name: string, fallbackId: string): string {
    const stem = name.replace(/\.[^.]+$/, '');
    let slug = stem
        .replace(/[\s\u3000]+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase()
        .slice(0, 56);
    if (!slug || /^_+$/.test(slug)) {
        slug = `src_${fallbackId.replace(/-/g, '_')}`;
    }
    return slug;
}

/**
 * 从文件推断压缩包内的可识别数据层名列表。
 * - bundle zip（含多个 shp）→ 返回多个层名
 * - 其他文件 → 单项，值等于去扩展名的文件名
 */
function inferRecognizedDataNames(cf: CloudFile): string[] {
    const stem = stripDataNameExtension(cf.name);
    const n = cf.name.toLowerCase();

    // 明确是多图层 bundle zip
    if (n.endsWith('.zip') && n.includes('bundle')) {
        // 去掉 bundle / shp 后缀得到数据集前缀
        const base = stem
            .replace(/_?bundle$/i, '')
            .replace(/_?shp$/i, '')
            .replace(/_+$/, '');

        // 按常见命名拆分中文前缀
        const provinceMatch = /省界|province/i.test(stem);
        const countyMatch = /县级|county/i.test(stem);
        const cityMatch = /市界|市级|city/i.test(stem);
        const districtMatch = /区级|district/i.test(stem);

        if (provinceMatch || countyMatch) {
            const year = stem.match(/\d{4}/)?.[0] ?? '';
            return [
                `省界_Province${year ? '_' + year : ''}`,
                `县级_County${year ? '_' + year : ''}`,
            ];
        }
        if (cityMatch || districtMatch) {
            const year = stem.match(/\d{4}/)?.[0] ?? '';
            return [
                `市级_City${year ? '_' + year : ''}`,
                `区级_District${year ? '_' + year : ''}`,
            ];
        }
        // 通用 bundle：用文件名前缀 + layer1/layer2 占位
        return [`${base}_layer1`, `${base}_layer2`];
    }

    // 单数据文件：可识别名 = 文件名（去扩展名）
    return [stem];
}

/** 入库前数据完整性（mock：按云盘文件名 / 类型 / 约定 id 判定） */
function validateCloudIntegrity(cf: CloudFile): { ok: boolean; reason?: string } {
    const n = cf.name.toLowerCase();
    const t = (cf.type || '').toLowerCase();

    if (cf.id === 'v-shp-zip-bad' || n.includes('缺dbf') || n.includes('缺件') || n.includes('完整性失败')) {
        return {
            ok: false,
            reason: 'Shapefile 套装不完整：缺少 .dbf 属性表或 .shx 几何索引，无法入库',
        };
    }
    if (n.includes('_损坏') || n.includes('_corrupt') || n.includes('校验失败') || t.includes('数据损坏')) {
        return { ok: false, reason: '压缩包或矢量文件头校验失败，疑似结构损坏' };
    }

    const isShpBundleZip =
        cf.iconType === 'zip' && n.endsWith('.zip') && (n.includes('shp') || /shapefile/.test(t));
    if (isShpBundleZip) {
        return { ok: true };
    }
    if (n.endsWith('.shp')) {
        return { ok: true };
    }
    if (
        cf.iconType === 'vector' &&
        (n.endsWith('.gpkg') || n.endsWith('.geojson') || n.endsWith('.csv') || n.endsWith('.kml'))
    ) {
        return { ok: true };
    }
    if (n.endsWith('.kmz') || (cf.iconType === 'zip' && /kml/.test(t))) {
        return { ok: true };
    }
    if (cf.iconType === 'zip' && /mapinfo|tab/.test(t)) {
        return { ok: true };
    }
    if (n.endsWith('.dxf')) {
        return { ok: true };
    }
    return { ok: true };
}

function cloudFilesToParsedRows(files: CloudFile[], defaultDb: string): ParsedFile[] {
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    const usedSlugs = new Set<string>();
    // 每个 recognizedDataName 展开为独立行
    return files.flatMap((cf) => {
        const fmt = inferDataFormat(cf);
        const integrity = validateCloudIntegrity(cf);
        const extension = extFromName(cf.name);
        const allNames = inferRecognizedDataNames(cf);

        return allNames.map((recognizedName, idx) => {
            let baseSlug = defaultTableSlug(recognizedName, `${cf.id}_${idx}`);
            let candidate = baseSlug;
            let bump = 0;
            while (usedSlugs.has(candidate)) {
                bump += 1;
                candidate = `${baseSlug}_${bump}`;
            }
            usedSlugs.add(candidate);
            const slug = candidate;
            const targetTableError = nameRegex.test(slug) ? undefined : '仅限英文、数字和下划线';
            const aliasStem = recognizedName || stripDataNameExtension(cf.name) || cf.name;
            const targetAliasError = validateDataAliasName(aliasStem);

            return {
                id: allNames.length > 1 ? `${cf.id}-layer${idx}` : cf.id,
                name: cf.name,
                extension,
                format: fmt,
                dataCategory: inferDataCategory(cf),
                size: cf.size === '-' ? '—' : cf.size,
                integrityStatus: integrity.ok ? 'ready' : 'fail',
                integrityReason: integrity.reason,
                recognizedDataNames: [recognizedName],
                targetDb: defaultDb,
                targetTable: slug,
                targetTableError,
                targetAlias: aliasStem,
                targetAliasError,
                isAutoCreate: !MOCK_EXISTING_TABLES.includes(slug),
            };
        });
    });
}

function subTaskToPrefillCloudFile(task: IngestionBatchSubTaskEditContext['task']): CloudFile {
    const isRaster = isIngestionRasterDataType(task.dataType);
    return {
        id: `edit-cloud-${task.id}`,
        name: isRaster ? `${task.name}.tar.gz` : `${task.name}.zip`,
        size: '—',
        type: isRaster ? '卫星影像 / tar.gz' : 'Shapefile / zip',
        date: task.createTime,
        iconType: 'zip',
    };
}

const CREATE_INGESTION_FEATURE_POINTS: FeaturePoint[] = [
    { key: 'page-header', label: '页面头部', description: '标题与返回按钮' },
    { key: 'step-nav', label: '左侧步骤导航', description: '步骤 1-4 进度指示器' },
    { key: 'step1-data-type', label: '步骤1：数据类型选择', description: '矢量 / 影像 / GF1标准卫星包 等下拉' },
    { key: 'step1-execution', label: '步骤1：执行方式', description: '离线任务 / 实时任务 单选' },
    { key: 'step1-theme', label: '步骤1：数据主题绑定', description: '绑定到已有数据主题节点' },
    { key: 'step1-task-name', label: '步骤1：任务名称', description: '自动生成或手动填写入库任务名' },
    { key: 'step2-upload', label: '步骤2：本地文件上传', description: '拖拽 / 点击上传区域' },
    { key: 'step2-cloud-disk', label: '步骤2：从云盘选择', description: '跳转至云盘文件选择页' },
    { key: 'step2-file-list', label: '步骤2：已选文件列表', description: '解析后的批量文件行，含完整性校验状态' },
    { key: 'step3-validation', label: '步骤3：数据校验', description: '格式校验、坐标系检查、完整性检查' },
    { key: 'step4-metadata', label: '步骤4：元数据填写', description: '数据集名称、标签、描述等元数据字段' },
    { key: 'step4-finish', label: '步骤4：完成并提交', description: '"完成并返回" / "重新提交子任务" 按钮' },
    { key: 'edit-subtask', label: '编辑子任务模式', description: '从列表页编辑已有批量子任务时的表单' },
];

export const CreateIngestionTaskPanel: React.FC<CreateIngestionTaskPanelProps> = ({
    onBack,
    onNavigate,
    onOpenCloudDisk,
    pendingCloudPick,
    onPendingCloudPickConsumed,
    createMode = 'single',
    editSubTask = null,
    onResubmitSubTask,
}) => {
    const isEditSubTaskMode = !!editSubTask;
    const [sourceType, setSourceType] = useState<'cloud' | 'datasource'>('cloud');
    const [selectedCloudFiles, setSelectedCloudFiles] = useState<CloudFile[]>([]);
    const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    
    // 批量选库状态
    const [batchDb, setBatchDb] = useState<string>(MOCK_DATABASES[0]);
    
    // 表单状态
    const [taskName, setTaskName] = useState('上传离线任务-20251229152602');
    const [taskNameError, setTaskNameError] = useState('');
    const [subTaskName, setSubTaskName] = useState('');
    const [subTaskNameError, setSubTaskNameError] = useState('');
    const [dataType, setDataType] = useState<string>('');
    const [metadataModel, setMetadataModel] = useState<string>('');
    const [dataTheme, setDataTheme] = useState<string>('');
    const [dataLabels, setDataLabels] = useState<string[]>([]);
    /** 勾选后允许在存在类型不符文件时继续，但仅处理与「数据类型」一致的条目 */
    const [ignoreDataTypeMismatch, setIgnoreDataTypeMismatch] = useState(false);
    const [cloudOpenHint, setCloudOpenHint] = useState('');

    // 映射表格分页状态
    const [mappingPage, setMappingPage] = useState(1);
    const MAPPING_PAGE_SIZE = 5;

    const steps = [
        { id: 1, label: '数据注册与上传' },
        { id: 2, label: '数据质检' },
        { id: 3, label: '服务注册与发布' },
    ];

    const [activeStep, setActiveStep] = useState(1);
    const [specDrawerOpen, setSpecDrawerOpen] = useState(false);
    const [selectedQualityToolIds, setSelectedQualityToolIds] = useState<string[]>([]);

    const toggleQualityTool = (id: string) => {
        setSelectedQualityToolIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const handleCloudConfirm = (files: CloudFile[]) => {
        setIgnoreDataTypeMismatch(false);
        setCloudOpenHint('');
        setSelectedCloudFiles(files);
        if (files.length === 0) {
            setParsedFiles([]);
            setIsParsing(false);
            return;
        }
        setIsParsing(true);
        setParsedFiles([]);
        setMappingPage(1);
        window.setTimeout(() => {
            setParsedFiles(cloudFilesToParsedRows(files, batchDb));
            setIsParsing(false);
        }, 400);
    };

    useEffect(() => {
        if (!pendingCloudPick) return;
        handleCloudConfirm(pendingCloudPick.files);
        onPendingCloudPickConsumed?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 按 token 应用一次父级传入的云盘选择
    }, [pendingCloudPick?.token]);

    useEffect(() => {
        if (!editSubTask) return;
        const { task, batchGroupName } = editSubTask;
        const dt = resolveIngestionTaskDataType(task, batchGroupName);
        setTaskName(batchGroupName);
        setTaskNameError('');
        setSubTaskName(task.name);
        setSubTaskNameError('');
        setDataType(dt);
        setMetadataModel(defaultMetadataModelForDataType(dt));
        setDataTheme(task.themeNodeId ?? 'rs-sat-s2');
        setDataLabels(
            isIngestionRasterDataType(dt)
                ? ['遥感影像', '高分系列']
                : ['政务数据', '基础地理'],
        );
        setActiveStep(1);
        setIgnoreDataTypeMismatch(false);
        const cf = subTaskToPrefillCloudFile(task);
        setSelectedCloudFiles([cf]);
        setParsedFiles(cloudFilesToParsedRows([cf], batchDb));
        setMappingPage(1);
        setIsParsing(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 切换编辑子任务时整表重置一次
    }, [editSubTask?.task.id]);

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIgnoreDataTypeMismatch(false);
        setSelectedCloudFiles([]);
        setParsedFiles([]);
    };

    const handleDeleteParsedFile = (id: string) => {
        setParsedFiles((prev) => {
            const next = prev.filter((f) => f.id !== id);
            const maxPage = Math.ceil(next.length / MAPPING_PAGE_SIZE);
            if (mappingPage > maxPage && maxPage > 0) {
                setMappingPage(maxPage);
            }
            return next;
        });
        setSelectedCloudFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const handleRemoveFailedFiles = () => {
        const failedIds = new Set(parsedFiles.filter((f) => f.integrityStatus === 'fail').map((f) => f.id));
        setParsedFiles((prev) => {
            const next = prev.filter((f) => !failedIds.has(f.id));
            const maxPage = Math.ceil(next.length / MAPPING_PAGE_SIZE);
            if (mappingPage > maxPage && maxPage > 0) setMappingPage(maxPage);
            return next;
        });
        setSelectedCloudFiles((prev) => prev.filter((f) => !failedIds.has(f.id)));
    };

    const updateFileInfo = (id: string, key: keyof ParsedFile, value: any) => {
        setParsedFiles(prev => prev.map(f => {
            if (f.id === id) {
                const updated = { ...f, [key]: value };
                // 目标表名称校验：英文字母、数字、下划线
                if (key === 'targetTable') {
                    updated.isAutoCreate = !MOCK_EXISTING_TABLES.includes(value);
                    const nameRegex = /^[a-zA-Z0-9_]*$/;
                    if (!nameRegex.test(value)) {
                        updated.targetTableError = '仅限英文、数字和下划线';
                    } else {
                        updated.targetTableError = undefined;
                    }
                }
                // 目标表别名校验：中文、英文、数字、下划线
                if (key === 'targetAlias') {
                    updated.targetAliasError = validateDataAliasName(value);
                }
                return updated;
            }
            return f;
        }));
    };

    // 批量同步数据库逻辑
    const handleBatchSyncDb = () => {
        if (!batchDb) return;
        setParsedFiles(prev => prev.map(f => ({ ...f, targetDb: batchDb })));
    };

    // 任务名称校验 - 严格不支持特殊字符
    const nameFieldRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;

    const handleTaskNameChange = (val: string) => {
        if (isEditSubTaskMode) return;
        setTaskName(val);
        if (!val) {
            setTaskNameError('任务名称不能为空');
            return;
        }
        if (!nameFieldRegex.test(val)) {
            setTaskNameError('任务名称不支持特殊字符，仅限中文、字母、数字和下划线');
        } else {
            setTaskNameError('');
        }
    };

    const handleSubTaskNameChange = (val: string) => {
        setSubTaskName(val);
        if (!val.trim()) {
            setSubTaskNameError('子任务名称不能为空');
            return;
        }
        setSubTaskNameError('');
    };

    // 计算分页
    const totalMappingPages = Math.ceil(parsedFiles.length / MAPPING_PAGE_SIZE);
    const displayedMappingFiles = parsedFiles.slice(
        (mappingPage - 1) * MAPPING_PAGE_SIZE,
        mappingPage * MAPPING_PAGE_SIZE
    );

    // 计算匹配到的 shp 文件数量
    const matchedShpCount = parsedFiles.filter((f) => f.format === 'SHP').length;
    const integrityReadyCount = parsedFiles.filter((f) => f.integrityStatus === 'ready').length;
    const integrityFailCount = parsedFiles.filter((f) => f.integrityStatus === 'fail').length;

    const effectiveCreateMode = isEditSubTaskMode ? 'batch' : createMode;

    const dataTypeOptions = useMemo(
        () =>
            effectiveCreateMode === 'batch'
                ? [...SINGLE_DATA_TYPE_OPTIONS, ...BATCH_SATELLITE_DATA_TYPE_OPTIONS]
                : [...SINGLE_DATA_TYPE_OPTIONS],
        [effectiveCreateMode],
    );

    const cloudTypeByFileId = useMemo(() => {
        const m = new Map<string, string>();
        selectedCloudFiles.forEach((cf) => m.set(cf.id, cf.type || ''));
        return m;
    }, [selectedCloudFiles]);

    const expectedKind = useMemo((): ParsedFile['dataCategory'] | null => {
        const dt = dataType || '';
        if (dt.includes('矢量')) return 'vector';
        if (isRasterIngestionDataType(dt)) return 'raster';
        if (dt.includes('三维')) return 'model3d';
        return null;
    }, [dataType]);

    const filesTypeEligible = useMemo(
        () =>
            parsedFiles.filter((f) =>
                fileMatchesSelectedDataType(
                    f,
                    dataType,
                    expectedKind,
                    cloudTypeByFileId.get(f.id),
                ),
            ),
        [parsedFiles, expectedKind, dataType, cloudTypeByFileId],
    );

    const typeMismatchCount = useMemo(() => {
        if (!expectedKind) return 0;
        return parsedFiles.filter(
            (f) =>
                !fileMatchesSelectedDataType(
                    f,
                    dataType,
                    expectedKind,
                    cloudTypeByFileId.get(f.id),
                ),
        ).length;
    }, [parsedFiles, expectedKind, dataType, cloudTypeByFileId]);

    /** 数据类型为「影像」：不入物理库表映射，仅维护数据名称（原目标表别名） */
    const isRasterImageryType = expectedKind === 'raster';
    const mappingTableColCount = isRasterImageryType ? 5 : 7;

    const dataTypeBlocksNext =
        !!expectedKind &&
        parsedFiles.length > 0 &&
        ((!ignoreDataTypeMismatch && typeMismatchCount > 0) ||
            (ignoreDataTypeMismatch && filesTypeEligible.length === 0));

    const rowsForStepValidation = useMemo(() => {
        if (expectedKind && ignoreDataTypeMismatch && filesTypeEligible.length > 0) return filesTypeEligible;
        return parsedFiles;
    }, [expectedKind, ignoreDataTypeMismatch, filesTypeEligible, parsedFiles]);

    const step1FieldErrors = useMemo(
        () =>
            rowsForStepValidation.some((f) => {
                if (f.integrityStatus === 'fail' || !!f.targetAliasError) return true;
                if (isRasterImageryType) return false;
                return !!f.targetTableError;
            }),
        [rowsForStepValidation, isRasterImageryType],
    );

    const subTaskNameOk =
        !isEditSubTaskMode || (!subTaskNameError && subTaskName.trim().length > 0);

    const step1NextEnabled =
        parsedFiles.length > 0 &&
        !!dataType.trim() &&
        !taskNameError &&
        subTaskNameOk &&
        !dataTypeBlocksNext &&
        !step1FieldErrors;

    const handleRemoveTypeMismatched = () => {
        if (!expectedKind) return;
        const keepIds = new Set(filesTypeEligible.map((f) => f.id));
        setSelectedCloudFiles((prev) => prev.filter((f) => keepIds.has(f.id)));
        setParsedFiles((prev) => {
            const next = prev.filter((f) => keepIds.has(f.id));
            const maxPage = Math.ceil(next.length / MAPPING_PAGE_SIZE);
            if (mappingPage > maxPage && maxPage > 0) setMappingPage(maxPage);
            return next;
        });
        setIgnoreDataTypeMismatch(false);
    };

    useEffect(() => {
        setIgnoreDataTypeMismatch(false);
        setCloudOpenHint('');
    }, [dataType]);

    useEffect(() => {
        if (!isSatellitePackageDataType(dataType)) return;
        const modelByType: Record<string, string> = {
            'GF1标准卫星包': 'GF卫星元数据标准',
            'GF2标准卫星包': 'GF卫星元数据标准',
            'ZY标准卫星包': 'ZY卫星元数据标准',
            'Sentinel标准卫星包': 'Sentinel卫星元数据标准',
            'Landsat标准卫星包': 'Landsat卫星元 metadata标准',
        };
        const next = modelByType[dataType];
        if (next) setMetadataModel(next);
    }, [dataType]);

    const pageTitle = isEditSubTaskMode
        ? '编辑子任务'
        : createMode === 'batch'
          ? '创建批量时空数据入库任务'
          : '创建单次时空数据入库任务';

    const handleFinish = () => {
        if (isEditSubTaskMode && editSubTask) {
            onResubmitSubTask?.({
                subTaskName: subTaskName.trim(),
                taskId: editSubTask.task.id,
            });
        }
        onBack();
    };

    return (
        <div className="flex-1 flex flex-col bg-[#f0f4f8] h-full overflow-hidden animate-fadeIn font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-slate-800 rounded-full"></div>
                    <h2 className="text-[17px] font-bold text-slate-800">{pageTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSpecDrawerOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300"
                        title="需求规格说明（仅研发可见）"
                    >
                        <BookOpen size={14} />
                        需求规格说明
                    </button>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1.5 px-5 py-1.5 bg-white border border-slate-200 text-blue-600 rounded-full text-[13px] font-medium hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                    >
                        <Undo2 size={16} />
                        返回
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-10">
                
                {/* Left Stepper */}
                <div className="w-44 flex flex-col pt-32 items-end pr-6 flex-shrink-0">
                    <div className="flex flex-col items-center gap-0 relative">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex flex-col items-center relative">
                                <div className="flex flex-col items-center group">
                                    <div className={`
                                        w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold transition-all z-10
                                        ${activeStep === step.id 
                                            ? 'bg-blue-600 text-white shadow-lg' 
                                            : 'bg-white border-2 border-slate-200 text-slate-400'}
                                    `}>
                                        {step.id}
                                    </div>
                                    <div className={`
                                        mt-3 mb-16 text-[13px] font-bold transition-colors whitespace-nowrap text-center w-36 leading-tight
                                        ${activeStep === step.id ? 'text-blue-600' : 'text-slate-500'}
                                    `}>
                                        {step.label}
                                    </div>
                                    {activeStep === step.id && (
                                        <div className="absolute -right-[34px] top-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-white/90"></div>
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="absolute top-7 h-16 w-px border-l-2 border-dashed border-slate-300"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Form Card */}
                <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar p-12">
                    <div className="max-w-[1100px] mx-auto space-y-10">
                    {activeStep === 1 && (
                    <>
                        {/* Form Grid */}
                        <div className="grid grid-cols-2 gap-x-14 gap-y-7">
                            <FormItem
                                label={isEditSubTaskMode ? '任务名称（任务组）' : '任务名称'}
                                required
                            >
                                <div className="flex flex-col gap-1.5">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={taskName}
                                            readOnly={isEditSubTaskMode}
                                            onChange={(e) => handleTaskNameChange(e.target.value)}
                                            placeholder={
                                                isEditSubTaskMode ? '任务组名称' : '请输入任务名称'
                                            }
                                            className={`w-full h-10 px-4 border rounded-lg text-[14px] outline-none transition-all ${
                                                isEditSubTaskMode
                                                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500'
                                                    : taskNameError
                                                      ? 'border-red-500 bg-white text-slate-700 focus:ring-4 focus:ring-red-50 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]'
                                                      : 'border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 hover:border-slate-300'
                                            }`}
                                        />
                                        {!isEditSubTaskMode && taskNameError && (
                                            <AlertCircle
                                                size={14}
                                                className="absolute right-3 top-3 text-red-500 animate-in zoom-in-50"
                                            />
                                        )}
                                    </div>
                                    {!isEditSubTaskMode && taskNameError && (
                                        <span className="text-[11px] text-red-500 font-bold px-1 flex items-center gap-1 animate-fadeIn">
                                            {taskNameError}
                                        </span>
                                    )}
                                    {isEditSubTaskMode && (
                                        <span className="px-1 text-[11px] font-medium text-slate-400">
                                            取自批量任务组名称，不可修改
                                        </span>
                                    )}
                                </div>
                            </FormItem>

                            {isEditSubTaskMode ? (
                                <FormItem label="子任务名称" required>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={subTaskName}
                                                onChange={(e) => handleSubTaskNameChange(e.target.value)}
                                                placeholder="请输入子任务名称"
                                                className={`w-full h-10 px-4 bg-white border rounded-lg text-[14px] text-slate-700 outline-none transition-all ${
                                                    subTaskNameError
                                                        ? 'border-red-500 focus:ring-4 focus:ring-red-50'
                                                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 hover:border-slate-300'
                                                }`}
                                            />
                                            {subTaskNameError && (
                                                <AlertCircle
                                                    size={14}
                                                    className="absolute right-3 top-3 text-red-500"
                                                />
                                            )}
                                        </div>
                                        {subTaskNameError && (
                                            <span className="text-[11px] text-red-500 font-bold px-1">
                                                {subTaskNameError}
                                            </span>
                                        )}
                                    </div>
                                </FormItem>
                            ) : (
                                <FormItem label="数据分层" required>
                                    <Select value="贴源层" />
                                </FormItem>
                            )}

                            {isEditSubTaskMode ? (
                                <FormItem label="数据分层" required>
                                    <Select value="贴源层" />
                                </FormItem>
                            ) : null}

                            <FormItem label="数据类型" required>
                                <Select 
                                    value={dataType} 
                                    placeholder="请选择" 
                                    options={dataTypeOptions.map((o) => ({
                                        label: o.label,
                                        sub: o.sub,
                                    }))}
                                    onSelect={setDataType}
                                />
                            </FormItem>

                            <FormItem label="选择数据标准模型" required>
                                <Select 
                                    value={metadataModel}
                                    placeholder="请选择数据标准，可选，若无请前往数据治理平台创建" 
                                    options={[
                                        { label: '矢量元数据标准' },
                                        { label: 'GF卫星元数据标准' },
                                        { label: 'Landsat卫星元 metadata标准' },
                                        { label: 'JL卫星元数据标准' },
                                        { label: 'SVN卫星元数据标准' },
                                        { label: '遥感专题数据标准' },
                                        { label: 'ZY卫星元数据标准' },
                                        { label: 'Sentinel卫星元数据标准' }
                                    ]}
                                    onSelect={setMetadataModel}
                                />
                            </FormItem>

                            <FormItem label="数据主题" required>
                                <Select
                                    value={dataTheme}
                                    placeholder="请选择已在「数据主题」中维护的主题"
                                    options={DATA_THEME_BIND_OPTIONS.map((o) => ({
                                        label: o.path,
                                        sub: o.id,
                                        value: o.id,
                                    }))}
                                    onSelect={setDataTheme}
                                />
                            </FormItem>

                            <FormItem label="数据标签" required>
                                <TagInputSelect 
                                    values={dataLabels}
                                    placeholder="请选择或输入创建新标签（仅根节点）"
                                    onChange={setDataLabels}
                                    options={PRESET_TAGS}
                                />
                            </FormItem>

                            <div className="col-span-2">
                                <div className="space-y-2.5">
                                    <label className="text-[14px] font-bold text-slate-700 flex items-center gap-2">
                                        <span className="flex items-center">
                                            <span className="text-red-500 mr-1">*</span>源数据选择
                                        </span>
                                        <div className="relative group flex items-center">
                                            <HelpCircle size={14} className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
                                            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-[12px] font-medium rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-[110] w-64 leading-relaxed ring-1 ring-white/10 origin-left">
                                                支持从个人/公共云盘中选择文件，或从已登记的数据源（如 PostgreSQL, MySQL 等）中直接提取数据。目前云盘模式主要支持压缩包或要素文件夹上传。
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-800"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="flex items-center gap-10 mt-3 pl-1">
                                        <Radio 
                                            label="云盘数据" 
                                            checked={sourceType === 'cloud'} 
                                            onChange={() => setSourceType('cloud')} 
                                        />
                                        <Radio 
                                            label="选择数据源" 
                                            checked={sourceType === 'datasource'} 
                                            onChange={() => setSourceType('datasource')} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div className="col-span-2">
                                <div 
                                    onClick={() => {
                                        if (selectedCloudFiles.length) return;
                                        if (!dataType.trim()) {
                                            setCloudOpenHint('请先选择「数据类型」，系统才能与云盘文件做类型一致性校验。');
                                            return;
                                        }
                                        setCloudOpenHint('');
                                        onOpenCloudDisk?.();
                                    }}
                                    className={`
                                        mt-2 rounded-2xl h-44 flex flex-col items-center justify-center transition-all group relative
                                        ${selectedCloudFiles.length > 0 
                                            ? 'bg-blue-50/40 border border-blue-100' 
                                            : 'bg-blue-50/10 border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-50/30 hover:border-blue-300'}
                                    `}
                                >
                                    {selectedCloudFiles.length > 0 ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-white px-8 py-5 rounded-2xl border border-blue-100 flex items-center gap-8 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-100">
                                                        <CloudUpload size={22} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[15px] font-black text-slate-700">
                                                            {selectedCloudFiles.length === 1 ? selectedCloudFiles[0].name : `${selectedCloudFiles[0].name} 等 ${selectedCloudFiles.length} 个项目`}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-bold mt-1">源：云盘主目录</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={removeFile}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            {isParsing && (
                                                <div className="flex items-center gap-2 text-blue-500 font-bold text-xs animate-pulse">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    正在智能提取要素元数据与坐标参考...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-slate-500 group-hover:scale-105 transition-transform duration-300">
                                            <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-md">
                                                <CloudUpload size={18} />
                                            </div>
                                            <span className="text-[15px] font-bold">点击选择云盘文件夹或文件</span>
                                        </div>
                                    )}
                                </div>
                                {cloudOpenHint && (
                                    <p className="mt-2 pl-1 text-[12px] font-bold text-amber-700 flex items-center gap-1.5">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        {cloudOpenHint}
                                    </p>
                                )}
                            </div>

                            {/* Spatial Mapping Table */}
                            {(isParsing || parsedFiles.length > 0) && (
                                <div className="col-span-2 mt-4 space-y-4 animate-slideUp">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <Settings2 size={18} className="text-blue-600" />
                                            <span className="text-[15px] font-bold text-slate-800">
                                                {isRasterImageryType ? '批量映射' : '目标库选择批量设置'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {!isRasterImageryType && (
                                            <>
                                            {/* 批量选库组件 */}
                                            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-lg p-1 animate-fadeIn">
                                                <div className="relative group/batch">
                                                    <Database size={13} className="absolute left-2.5 top-2.5 text-blue-400" />
                                                    <select 
                                                        className="h-8 pl-8 pr-8 bg-white border border-blue-200 rounded-md outline-none text-[12px] font-bold text-slate-700 appearance-none hover:border-blue-400 transition-colors shadow-sm cursor-pointer"
                                                        value={batchDb}
                                                        onChange={(e) => setBatchDb(e.target.value)}
                                                    >
                                                        {MOCK_DATABASES.map(db => <option key={db} value={db}>{db}</option>)}
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-blue-400 pointer-events-none" />
                                                </div>
                                                <button 
                                                    onClick={handleBatchSyncDb}
                                                    className="flex items-center gap-1.5 px-3 h-8 bg-blue-600 text-white rounded-md text-[11px] font-black hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-100"
                                                >
                                                    <RefreshCw size={12} />
                                                    一键同步到所有行
                                                </button>
                                            </div>

                                            {integrityFailCount > 0 && (
                                                <div className="relative group/rmfail">
                                                    <button
                                                        type="button"
                                                        onClick={handleRemoveFailedFiles}
                                                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-600 text-[12px] font-medium hover:bg-red-100 hover:border-red-300 transition-all"
                                                    >
                                                        <FilterX size={14} />
                                                        移除失败项（{integrityFailCount}）
                                                    </button>
                                                </div>
                                            )}
                                            </>
                                            )}
                                            {isRasterImageryType && (
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">
                                                    <HelpCircle size={12} className="text-blue-500 shrink-0" />
                                                    <span>
                                                        {isSatellitePackageDataType(dataType)
                                                            ? '标准卫星包入库无需指定目标库与物理表，请为每条景数据填写「数据名称」。'
                                                            : '影像入库无需指定目标库与物理表，请为每条数据填写「数据名称」。'}
                                                    </span>
                                                    {onNavigate && (
                                                        <>
                                                            <span className="text-slate-300 shrink-0" aria-hidden>
                                                                ·
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => onNavigate('datasource_mgmt')}
                                                                className="shrink-0 font-bold text-blue-600 hover:underline"
                                                            >
                                                                数据源管理
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            
                                        </div>
                                    </div>
                                    
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white ring-1 ring-slate-900/5">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className={`w-full text-left text-[13px] border-collapse ${isRasterImageryType ? 'min-w-[920px]' : 'min-w-[1400px]'}`}>
                                            <thead className="bg-[#f8fbfd] text-slate-500 font-bold border-b border-slate-100 uppercase tracking-tight">
                                                <tr>
                                                    <th className="p-4 pl-8 w-[260px]">源文件名</th>
                                                    <th className="p-4 w-[220px]">可识别数据名</th>
                                                    <th className="p-4 w-32">数据格式</th>
                                                    {!isRasterImageryType && (
                                                        <>
                                                            <th className="p-4 w-72">目标数据库</th>
                                                            <th className="p-4 w-[300px]">目标表名称</th>
                                                        </>
                                                    )}
                                                    <th className="p-4 w-[300px]">
                                                        {isRasterImageryType ? '数据名称' : '目标表别名'}
                                                    </th>
                                                    <th className="p-4 text-center w-20">校验状态</th>
                                                    <th className="p-4 text-center w-24 pr-8">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {displayedMappingFiles.map((file) => {
                                                    const typeRowMismatch =
                                                        !!expectedKind &&
                                                        !fileMatchesSelectedDataType(
                                                            file,
                                                            dataType,
                                                            expectedKind,
                                                            cloudTypeByFileId.get(file.id),
                                                        );
                                                    return (
                                                    <tr
                                                        key={file.id}
                                                        className={`hover:bg-slate-50/50 transition-colors group ${typeRowMismatch ? 'bg-red-50/50 ring-1 ring-inset ring-red-100' : ''}`}
                                                    >
                                                        <td className="p-4 pl-8">
                                                            <div className="flex items-center gap-3">
                                                                <FileIcon format={file.format} />
                                                                <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-[200px]" title={file.name}>{file.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-[13px] text-slate-700 font-medium truncate block max-w-[190px]" title={file.recognizedDataNames[0]}>
                                                                {file.recognizedDataNames[0]}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-sm border ${getFormatStyle(file.format)}`}>
                                                                {file.format}
                                                            </span>
                                                        </td>
                                                        {!isRasterImageryType && (
                                                            <>
                                                                <td className="p-4">
                                                                    <div className="relative group/db">
                                                                        <Database size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none group-focus-within/db:text-blue-500 transition-colors" />
                                                                        <select
                                                                            className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-8 pr-8 outline-none text-[12px] font-medium appearance-none focus:border-blue-400 transition-all shadow-sm"
                                                                            value={file.targetDb}
                                                                            onChange={(e) => updateFileInfo(file.id, 'targetDb', e.target.value)}
                                                                        >
                                                                            {MOCK_DATABASES.map(db => <option key={db} value={db}>{db}</option>)}
                                                                        </select>
                                                                        <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <TableSelector
                                                                        value={file.targetTable}
                                                                        isAutoCreate={file.isAutoCreate}
                                                                        error={file.targetTableError}
                                                                        onChange={(val) => updateFileInfo(file.id, 'targetTable', val)}
                                                                    />
                                                                </td>
                                                            </>
                                                        )}
                                                        <td className="p-4">
                                                            <div className="relative group/alias">
                                                                <div className={`flex items-center h-9 px-3 bg-white border rounded-lg transition-all focus-within:ring-4 ${file.targetAliasError ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-50' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50'}`}>
                                                                    <TableIcon size={14} className={`mr-2 shrink-0 transition-colors ${file.targetAliasError ? 'text-red-400' : 'text-slate-400 group-focus-within/alias:text-blue-500'}`} />
                                                                    <input
                                                                        type="text"
                                                                        value={file.targetAlias}
                                                                        onChange={(e) => updateFileInfo(file.id, 'targetAlias', e.target.value)}
                                                                        placeholder={isRasterImageryType ? '数据名称' : '表别名'}
                                                                        className="flex-1 bg-transparent border-none outline-none text-[12px] text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-normal h-full min-w-0"
                                                                    />
                                                                    {file.targetAliasError && <AlertCircle size={12} className="text-red-500 ml-1 shrink-0" />}
                                                                </div>
                                                                {file.targetAliasError && (
                                                                    <div className="absolute top-full left-0 mt-0.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap animate-in fade-in zoom-in-95">
                                                                        {file.targetAliasError}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {file.integrityStatus === 'ready' ? (
                                                                <CheckCircle2
                                                                    size={20}
                                                                    className="text-emerald-500 mx-auto"
                                                                    strokeWidth={2.5}
                                                                    title="校验通过"
                                                                />
                                                            ) : (
                                                                <div className="relative group/vfail inline-flex">
                                                                    <XCircle size={20} className="text-red-500 cursor-default" strokeWidth={2.5} />
                                                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-slate-800/95 px-3 py-2.5 text-[12px] text-white shadow-xl opacity-0 group-hover/vfail:opacity-100 transition-opacity duration-150 z-50 whitespace-pre-wrap leading-relaxed">
                                                                        <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/10">
                                                                            <XCircle size={12} className="text-red-400 shrink-0" />
                                                                            <span className="font-bold text-red-300 text-[11px]">校验失败</span>
                                                                        </div>
                                                                        {file.integrityReason ?? '数据完整性校验未通过'}
                                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800/95" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center pr-8">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteParsedFile(file.id); }}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="移除该行"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                                {isParsing && (
                                                    <tr>
                                                        <td colSpan={mappingTableColCount} className="p-20 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="relative">
                                                                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                                                                    <Database size={16} className="absolute inset-0 m-auto text-blue-300" />
                                                                </div>
                                                                <span className="text-[12px] font-bold text-slate-400 tracking-widest animate-pulse">正在提取要素图层及坐标参考...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>{/* /overflow-x-auto */}

                                    {/* 分页 footer — 在表格容器内 */}
                                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
                                        <div className="flex items-center gap-4 text-[13px] text-slate-500">
                                            {isRasterImageryType && (
                                                <div className="flex items-center gap-2">
                                                    <Info size={12} className="text-blue-500" />
                                                    <span>
                                                        {isSatellitePackageDataType(dataType)
                                                            ? '标准卫星包请确认每条景「数据名称」与产品号一致。'
                                                            : '影像数据请确认每条「数据名称」准确无误。'}
                                                    </span>
                                                </div>
                                            )}
                                            <span className="font-medium">
                                                共 <span className="font-bold text-slate-800">{parsedFiles.length}</span> 条
                                                {integrityFailCount > 0 && (
                                                    <span className="text-red-600 font-bold">
                                                        {' '}· {integrityFailCount} 条校验未通过
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <PaginationBar
                                            controlsOnly
                                            total={parsedFiles.length}
                                            page={mappingPage}
                                            pageSize={MAPPING_PAGE_SIZE}
                                            onPageChange={setMappingPage}
                                        />
                                    </div>
                                    </div>{/* /rounded-2xl outer */}

                                    {/* 类型不匹配警告 — 在列表下方 */}
                                    {expectedKind && parsedFiles.length > 0 && typeMismatchCount > 0 && (
                                        <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-[12px] text-red-900 shadow-sm">
                                            <div className="flex flex-wrap items-start gap-2">
                                                <AlertTriangle size={16} className="shrink-0 text-red-500 mt-0.5" />
                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <p className="font-bold leading-snug">
                                                        当前任务数据类型为「{dataType}」，检测到 {typeMismatchCount}{' '}
                                                        条云盘条目与推断类型不符。请删除不符文件，或一键移除后重新选择。
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <label className="flex cursor-pointer items-center gap-2 font-bold text-red-800">
                                                            <input
                                                                type="checkbox"
                                                                className="h-3.5 w-3.5 rounded border-red-300 text-red-600 focus:ring-red-400"
                                                                checked={ignoreDataTypeMismatch}
                                                                onChange={(e) => setIgnoreDataTypeMismatch(e.target.checked)}
                                                            />
                                                            忽略类型差异，仅对推断为「{dataType}」的 {filesTypeEligible.length}{' '}
                                                            条继续后续步骤
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveTypeMismatched}
                                                            className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-black text-red-700 ring-1 ring-red-300 transition hover:bg-red-50"
                                                        >
                                                            一键移除不匹配
                                                        </button>
                                                    </div>
                                                    {ignoreDataTypeMismatch && filesTypeEligible.length === 0 && (
                                                        <p className="text-[11px] font-bold text-red-700">
                                                            没有与「{dataType}」一致的条目，无法继续；请更换云盘文件或调整数据类型。
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="mt-16 flex justify-end">
                            <button
                                type="button"
                                disabled={!step1NextEnabled}
                                onClick={() => {
                                    if (step1NextEnabled) {
                                        setActiveStep(2);
                                    }
                                }}
                                className={`
                                    px-14 py-3 rounded-xl text-[14px] font-bold transition-all active:scale-95 shadow-xl
                                    ${step1NextEnabled
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                                        : 'bg-white border border-blue-100 text-blue-300 cursor-not-allowed'}
                                `}
                            >
                                下一步：数据质检
                            </button>
                        </div>
                    </>
                    )}

                    {activeStep === 2 && (
                    <>
                        <div className="mb-8">
                            <h3 className="text-lg font-black text-slate-800">数据质检</h3>
                            <p className="mt-1.5 max-w-3xl text-[13px] font-medium leading-relaxed text-slate-500">
                                选择本次入库要启用的质检工具，支持多选。以下为示意项，可与后续质检引擎或规则中心对接。
                            </p>
                            {selectedQualityToolIds.length > 0 && (
                                <p className="mt-2 text-[12px] font-bold text-blue-600">
                                    已选 {selectedQualityToolIds.length} 项
                                </p>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {QUALITY_INSPECTION_TOOLS.map((tool) => {
                                const checked = selectedQualityToolIds.includes(tool.id);
                                const Corner =
                                    tool.corner === 'clipboard'
                                        ? ClipboardCheck
                                        : tool.corner === 'shield'
                                          ? ShieldCheck
                                          : tool.corner === 'scan'
                                            ? ScanSearch
                                            : tool.corner === 'file'
                                              ? FileCheck2
                                              : Ruler;
                                return (
                                    <label
                                        key={tool.id}
                                        className={`
                                            relative flex cursor-pointer flex-col rounded-xl border p-4 pb-11 text-left shadow-sm transition-all
                                            ${
                                                checked
                                                    ? 'border-blue-400 bg-gradient-to-br from-sky-50 to-blue-50 ring-2 ring-blue-100'
                                                    : 'border-blue-100/80 bg-gradient-to-br from-sky-50/90 to-blue-50/50 ring-1 ring-blue-100/60 hover:border-blue-300 hover:ring-blue-200/80'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="min-w-0 flex-1 pr-1 text-[14px] font-bold leading-snug text-blue-800">
                                                {tool.name}
                                            </span>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleQualityTool(tool.id)}
                                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-blue-300 text-blue-600 focus:ring-2 focus:ring-blue-400"
                                            />
                                        </div>
                                        <p className="mt-2 text-[11px] font-medium leading-relaxed text-blue-700/85">
                                            {tool.description}
                                        </p>
                                        <Corner
                                            className="pointer-events-none absolute bottom-2.5 right-2.5 h-9 w-9 text-blue-200/95"
                                            strokeWidth={1.25}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                        <div className="mt-16 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(1)}
                                className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-[14px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
                            >
                                上一步
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveStep(3)}
                                className="rounded-xl bg-blue-600 px-12 py-3 text-[14px] font-bold text-white shadow-xl shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
                            >
                                下一步：服务注册与发布
                            </button>
                        </div>
                    </>
                    )}

                    {activeStep === 3 && (
                    <>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 rounded-2xl bg-slate-100 p-5 text-slate-400">
                                <Settings2 size={40} strokeWidth={1.25} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">服务注册与发布</h3>
                            <p className="mt-2 max-w-md text-[13px] font-medium leading-relaxed text-slate-500">
                                用于登记服务元数据、预览地址与发布策略。完整表单可在后续版本中扩展。
                            </p>
                        </div>
                        <div className="mt-10 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(2)}
                                className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-[14px] font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-[0.99]"
                            >
                                上一步
                            </button>
                            <button
                                type="button"
                                onClick={handleFinish}
                                className="rounded-xl bg-emerald-600 px-10 py-3 text-[14px] font-bold text-white shadow-lg transition hover:bg-emerald-700 active:scale-95"
                            >
                                {isEditSubTaskMode ? '重新提交子任务' : '完成并返回'}
                            </button>
                        </div>
                    </>
                    )}
                    </div>
                </div>

            </div>

            <RequirementsSpecDrawer
                open={specDrawerOpen}
                onClose={() => setSpecDrawerOpen(false)}
                pageKey="create-ingestion-task"
                pageTitle="新建入库任务"
                featurePoints={CREATE_INGESTION_FEATURE_POINTS}
            />
        </div>
    );
};

// --- Subcomponents ---

const FileIcon: React.FC<{ format: string }> = ({ format }) => {
    switch (format) {
        case 'JSON':
            return <FileJson size={18} className="text-indigo-500" />;
        case 'CSV':
            return <TableIcon size={18} className="text-emerald-500" />;
        case 'GPKG':
            return <Layers size={18} className="text-sky-600" />;
        case 'SHP':
            return <FileCode size={18} className="text-amber-600" />;
        case 'TIFF':
            return <ImageIcon size={18} className="text-violet-500" />;
        case 'ARCHIVE':
            return <FileArchive size={18} className="text-slate-600" />;
        default:
            return <FileCode size={18} className="text-blue-500" />;
    }
};

const getFormatStyle = (format: string) => {
    switch (format) {
        case 'SHP':
            return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'JSON':
            return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        case 'CSV':
            return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'GPKG':
            return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'TIFF':
            return 'bg-violet-50 text-violet-700 border-violet-100';
        case 'ARCHIVE':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'TAB':
        case 'ZIP':
            return 'bg-orange-50 text-orange-700 border-orange-100';
        default:
            return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};

const TableSelector: React.FC<{ 
    value: string; 
    isAutoCreate: boolean; 
    error?: string;
    onChange: (val: string) => void;
}> = ({ value, isAutoCreate, error, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = MOCK_EXISTING_TABLES.filter(t => t.toLowerCase().includes(value.toLowerCase()));

    return (
        <div className="relative group" ref={containerRef}>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <div className={`flex items-center h-9 bg-white border rounded-lg transition-all shadow-sm ${error ? 'border-red-500 ring-4 ring-red-50' : (isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 group-hover:border-slate-300')}`}>
                        <TableIcon size={12} className={`ml-2.5 shrink-0 transition-colors ${error ? 'text-red-400' : (isOpen ? 'text-blue-500' : 'text-slate-400')}`} />
                        <input 
                            type="text" 
                            value={value}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => onChange(e.target.value)}
                            className="flex-1 px-2 bg-transparent border-none outline-none text-[12px] font-medium h-full min-w-0"
                            placeholder="物理表名"
                        />
                        {error && <AlertCircle size={12} className="text-red-500 mr-2 shrink-0" />}
                        {isAutoCreate && !error && (
                            <div className="mr-2 shrink-0 bg-blue-50 text-blue-600 p-0.5 rounded shadow-sm animate-in zoom-in-50 duration-200" title="该表将自动创建">
                                <Plus size={10} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="absolute top-full left-0 mt-0.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap animate-in fade-in zoom-in-95">
                    {error}
                </div>
            )}

            {isOpen && !error && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 max-h-56 overflow-y-auto custom-scrollbar">
                    <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 flex items-center justify-between">
                        <span>候选物理表</span>
                        {value && !MOCK_EXISTING_TABLES.includes(value) && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                        )}
                    </div>
                    {filtered.map(t => (
                        <div 
                            key={t}
                            onClick={() => { onChange(t); setIsOpen(false); }}
                            className="px-4 py-2 text-[12px] text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center justify-between group/item transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-300 group-hover/item:bg-blue-500"></div>
                                <span className="font-medium">{t}</span>
                            </div>
                            {value === t && <Check size={12} className="text-blue-600" />}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-5 text-center">
                            <p className="text-[11px] text-slate-400 font-medium">未找到匹配项，回车将 <b>自动建表</b>。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const FormItem: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div className="space-y-2.5">
        <label className="text-[14px] font-bold text-slate-700 block">
            {required && <span className="text-red-500 mr-1">*</span>}
            {label}
        </label>
        {children}
    </div>
);

const Select: React.FC<{
    value?: string;
    placeholder?: string;
    options?: { label: string; sub?: string; value?: string }[];
    onSelect?: (val: string) => void;
    icon?: React.ReactNode;
}> = ({ value, placeholder, options, onSelect, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const optionKey = (opt: { label: string; value?: string }) => opt.value ?? opt.label;
    const selectedLabel =
        options?.find((o) => optionKey(o) === value)?.label ?? (value || '');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative group" ref={containerRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-4 transition-all hover:border-slate-300
                    ${isOpen ? 'border-blue-500 ring-4 ring-blue-50' : ''}
                    ${!value ? 'font-normal text-slate-400' : 'font-bold text-slate-700'}
                `}
            >
                <div className="flex min-w-0 flex-1 items-center gap-2 truncate">
                    {icon}
                    <span className="truncate text-[14px]">{selectedLabel || placeholder}</span>
                </div>
                <ChevronDown
                    size={18}
                    className={`shrink-0 text-slate-400 transition-all group-hover:text-slate-600 ${isOpen ? 'rotate-180' : ''}`}
                />
            </div>
            {isOpen && options && (
                <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-64 animate-in overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-2xl fade-in zoom-in-95 duration-200 custom-scrollbar">
                    {options.map((opt) => {
                        const k = optionKey(opt);
                        const picked = value === k;
                        return (
                            <div
                                key={k}
                                onClick={() => {
                                    onSelect?.(k);
                                    setIsOpen(false);
                                }}
                                className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-blue-50 ${picked ? 'bg-blue-50/50' : ''}`}
                            >
                                <div
                                    className={`min-w-0 flex-1 text-[14px] font-bold ${picked ? 'text-blue-600' : 'text-slate-800'}`}
                                >
                                    {opt.label}
                                </div>
                                {opt.sub ? (
                                    <div className="shrink-0 text-right text-[10px] font-mono text-slate-400">{opt.sub}</div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const TagInputSelect: React.FC<{
    values: string[];
    onChange: (vals: string[]) => void;
    placeholder?: string;
    options: string[];
}> = ({ values, onChange, placeholder, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    if (inputValue.trim() && !values.includes(inputValue.trim())) {
                        onChange([...values, inputValue.trim()]);
                        setInputValue('');
                    }
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, inputValue, values, onChange]);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(opt)
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                if (!values.includes(inputValue.trim())) {
                    onChange([...values, inputValue.trim()]);
                }
                setInputValue('');
            }
        } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
            onChange(values.slice(0, -1));
        }
    };

    const removeTag = (tag: string) => {
        onChange(values.filter(v => v !== tag));
    };

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                className={`
                    w-full min-h-[40px] px-3 py-1.5 flex flex-wrap items-center gap-2 bg-white border rounded-lg transition-all cursor-text
                    ${isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}
                `}
                onClick={() => inputRef.current?.focus()}
            >
                <TagIcon size={14} className={`shrink-0 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400'}`} />
                {values.map(tag => (
                    <div 
                        key={tag} 
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-md text-[12px] font-bold animate-in fade-in zoom-in-95 duration-200"
                    >
                        <span>{tag}</span>
                        <X 
                            size={12} 
                            className="cursor-pointer hover:text-red-500 transition-colors" 
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                        />
                    </div>
                ))}
                <input 
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={values.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[14px] text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-normal h-7"
                />
                <ChevronDown 
                    size={18} 
                    className={`shrink-0 text-slate-300 cursor-pointer hover:text-slate-500 transition-all ${isOpen ? 'rotate-180' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>候选标签</span>
                        {inputValue && !options.includes(inputValue) && !values.includes(inputValue) && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                        )}
                    </div>
                    {filteredOptions.map((opt) => (
                        <div 
                            key={opt}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange([...values, opt]);
                                setInputValue('');
                            }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                        >
                            <span className="text-[13px] font-medium text-slate-700">{opt}</span>
                            <Plus size={14} className="text-slate-300" />
                        </div>
                    ))}
                    {inputValue && !options.includes(inputValue) && !values.includes(inputValue) && (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange([...values, inputValue.trim()]);
                                setInputValue('');
                            }}
                            className="px-4 py-3 bg-slate-50 border-t border-slate-100 cursor-pointer group/add"
                        >
                            <div className="flex items-center gap-2 text-[12px] text-blue-600 font-bold group-hover/add:translate-x-1 transition-transform">
                                <Plus size={14} strokeWidth={3} />
                                <span>创建新标签："{inputValue}"</span>
                            </div>
                        </div>
                    )}
                    {filteredOptions.length === 0 && !inputValue && (
                        <div className="p-8 text-center text-slate-400 text-[12px] font-medium italic">
                            暂无更多可匹配标签
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Radio: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
    <div 
        onClick={onChange}
        className="flex items-center gap-3 cursor-pointer group"
    >
        <div className={`
            w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all
            ${checked ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-300 group-hover:border-slate-400'}
        `}>
            {checked && <div className="w-[8px] h-[8px] rounded-full bg-blue-600 animate-in zoom-in-50 duration-300"></div>}
        </div>
        <span className={`text-[14px] transition-colors ${checked ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'}`}>
            {label}
        </span>
    </div>
);
