import React, { useMemo, useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Trash2,
    Eye,
    Edit,
    FileText,
    RotateCw,
    CheckCircle2,
    XCircle,
    Lightbulb,
    Info,
    ChevronRight,
    ChevronDown,
    FolderOpen,
    Play,
    BookOpen,
    Copy,
    PenSquare,
    Square,
    AlertTriangle,
    X,
} from 'lucide-react';
import { PaginationBar } from './PaginationBar';
import { IngestionTaskDetailDrawer } from './IngestionTaskDetailDrawer';
import { RequirementsSpecDrawer, type FeaturePoint } from './RequirementsSpecDrawer';
import { buildIngestionTaskDetail } from '../lib/ingestionTaskDetail';
import {
  GF1C_BATCH_DIRECTORY_NAME,
  GF1C_BATCH_PARENT_ID,
  GF1C_SCENE_FILES,
} from '../gf1cBatchIngestionMock';

export interface IngestionTask {
    id: string;
    name: string;
    /** 创建任务所选数据类型（与创建页下拉一致：矢量 / 影像 / GF1标准卫星包 等） */
    dataType: string;
    /** 单次入库 / 批量入库 */
    ingestionMode: 'single' | 'batch';
    /** 离线任务 / 实时任务 */
    executionKind?: 'offline' | 'realtime';
    /** 入库绑定的数据主题节点 id */
    themeNodeId?: string;
    status: 'success' | 'failure' | 'processing' | 'pending';
    progress: number;
    log: string;
    creator: string;
    createTime: string;
}

/** 批量入库：父目录下挂多条子任务，子任务字段与单次行一致 */
interface BatchParentJob {
    id: string;
    /** 父目录（批量任务）名称 */
    directoryName: string;
    creator: string;
    createTime: string;
    children: IngestionTask[];
}

interface SpatialDataIngestionPanelProps {
    /** 页标题（侧栏三级菜单：单次入库 / 批量入库） */
    pageTitle?: string;
    /** 由菜单固定单次/批量时隐藏列表内「单次/批量」页签 */
    hideScopeTabs?: boolean;
    /** 新建任务：single 单次，batch 批量（当前均进入同一创建页，可后续按 mode 区分） */
    onCreateTask: (mode: 'single' | 'batch') => void;
    /** 点击任务名称或「查看」打开数据总库中的入库数据详情 */
    onOpenIngestedDataDetail?: (task: IngestionTask) => void;
    /** 批量子任务「编辑」：进入与新建相同的入库表单页 */
    onEditBatchSubTask?: (
        task: IngestionTask,
        parent: { id: string; directoryName: string },
    ) => void;
    scopeTab: 'single' | 'batch';
    onScopeTabChange: (tab: 'single' | 'batch') => void;
    statusTab: 'all' | 'processing' | 'success' | 'failure';
    onStatusTabChange: (tab: 'all' | 'processing' | 'success' | 'failure') => void;
    listPage: number;
    listPageSize: number;
    onListPageChange: (page: number) => void;
    onListPageSizeChange: (size: number) => void;
    /** 列表搜索（进详情返回后保留） */
    listSearchQuery: string;
    onListSearchQueryChange: (q: string) => void;
    /** 批量父目录展开 id（进详情返回后保留） */
    batchExpandedParentIds: string[];
    onToggleBatchParentExpand: (parentId: string) => void;
}

/** 单次入库任务（批量页签不使用本列表） */
const MOCK_TASKS: IngestionTask[] = [
    { id: '1', name: '上传离线任务-20251229131104', dataType: '矢量', ingestionMode: 'single', executionKind: 'offline', themeNodeId: 'geo-admin', status: 'success', progress: 100, log: '导入成功，数据量：107', creator: '光谷信息', createTime: '2025-12-29 13:11:04' },
    { id: '2', name: '【样本集导入】样本集数据_2025Q4', dataType: '矢量', ingestionMode: 'single', executionKind: 'offline', themeNodeId: 'geo-poi', status: 'success', progress: 100, log: '导入成功，数据量：107', creator: '光谷信息', createTime: '2025-12-29 11:42:15' },
    { id: '3', name: '上传离线任务-20251229110429', dataType: '矢量', ingestionMode: 'single', executionKind: 'offline', themeNodeId: 'geo-admin', status: 'failure', progress: 60, log: '数据导入失败：数据已经入库，无法重复导入...', creator: '光谷信息', createTime: '2025-12-29 11:35:04' },
    { id: '4', name: '上传离线任务-20251229111051', dataType: '影像', ingestionMode: 'single', executionKind: 'offline', themeNodeId: 'rs-sat-s2', status: 'success', progress: 100, log: '导入成功', creator: '光谷信息', createTime: '2025-12-29 11:10:51' },
    { id: '8', name: '上传离线任务-20251229105456', dataType: '矢量', ingestionMode: 'single', executionKind: 'offline', themeNodeId: 'geo-aoi', status: 'success', progress: 100, log: '导入成功，数据量：107', creator: '光谷信息', createTime: '2025-12-29 10:54:56' },
];

const GF1C_BATCH_PARENT: BatchParentJob = {
    id: GF1C_BATCH_PARENT_ID,
    directoryName: GF1C_BATCH_DIRECTORY_NAME,
    creator: '光谷信息',
    createTime: '2025-09-26 00:40:00',
    children: GF1C_SCENE_FILES.map((s, i) => ({
        id: s.id,
        name: s.productName,
        dataType: 'GF1标准卫星包',
        ingestionMode: 'batch' as const,
        executionKind: 'offline' as const,
        themeNodeId: 'rs-sat-s2' as const,
        status: 'success' as const,
        progress: 100,
        log: `导入成功，原始包 ${s.archiveName}（${s.sizeGb} GB）`,
        creator: '光谷信息',
        createTime: ['2025-09-26 00:46:00', '2025-09-26 00:50:00', '2025-09-26 00:53:00'][i],
    })),
};

/** 演示：待启动 + 失败 + 部分成功，便于测试「开始 / 批量开始」 */
const MIXED_STATUS_BATCH_PARENT: BatchParentJob = {
    id: 'bp-mixed-demo',
    directoryName: '高分卫星批量入库_待启动与失败演示',
    creator: '光谷信息',
    createTime: '2025-10-08 09:00:00',
    children: [
        {
            id: 'demo-pending-1',
            name: 'GF1C_PMS_E110.5_N30.2_20251008_L1A1022499001',
            dataType: 'GF1标准卫星包',
            ingestionMode: 'batch',
            executionKind: 'offline',
            themeNodeId: 'rs-sat-s2',
            status: 'pending',
            progress: 0,
            log: '等待启动',
            creator: '光谷信息',
            createTime: '2025-10-08 09:02:11',
        },
        {
            id: 'demo-pending-2',
            name: 'GF1C_PMS_E110.9_N30.8_20251008_L1A1022499002',
            dataType: 'GF1标准卫星包',
            ingestionMode: 'batch',
            executionKind: 'offline',
            themeNodeId: 'rs-sat-s2',
            status: 'pending',
            progress: 0,
            log: '等待启动',
            creator: '光谷信息',
            createTime: '2025-10-08 09:02:18',
        },
        {
            id: 'demo-pending-3',
            name: 'GF2_PMS1_E109.5_N31.2_20251008_L1A14703019999',
            dataType: 'GF2标准卫星包',
            ingestionMode: 'batch',
            executionKind: 'offline',
            themeNodeId: 'rs-sat-s2',
            status: 'pending',
            progress: 0,
            log: '等待启动',
            creator: '光谷信息',
            createTime: '2025-10-08 09:02:25',
        },
        {
            id: 'demo-failure-1',
            name: 'GF1C_PMS_E111.2_N32.1_20251007_L1A1022498888',
            dataType: 'GF1标准卫星包',
            ingestionMode: 'batch',
            executionKind: 'offline',
            themeNodeId: 'rs-sat-s2',
            status: 'failure',
            progress: 38,
            log: '完整性检查失败：缺少 MUX.tiff',
            creator: '光谷信息',
            createTime: '2025-10-08 08:55:40',
        },
        {
            id: 'demo-failure-2',
            name: 'GF2_PMS1_E109.7_N31.5_20251007_L1A14703018888',
            dataType: 'GF2标准卫星包',
            ingestionMode: 'batch',
            executionKind: 'offline',
            themeNodeId: 'rs-sat-s2',
            status: 'failure',
            progress: 65,
            log: '元数据校验失败：产品号与包内 XML 不一致',
            creator: '光谷信息',
            createTime: '2025-10-08 08:56:02',
        },
        {
            id: 'demo-success-1',
            name: 'ZY3_NAD_E112.0_N31.5_20251006_L1A0000123456',
            dataType: 'ZY标准卫星包',
            ingestionMode: 'batch',
            executionKind: 'offline',
            themeNodeId: 'rs-sat-s1',
            status: 'success',
            progress: 100,
            log: '导入成功',
            creator: '光谷信息',
            createTime: '2025-10-08 08:40:00',
        },
    ],
};

const MOCK_BATCH_PARENTS: BatchParentJob[] = [
    MIXED_STATUS_BATCH_PARENT,
    GF1C_BATCH_PARENT,
    {
        id: 'bp-landsat',
        directoryName: 'landsat卫星数据批量入库_202312291058',
        creator: '光谷信息',
        createTime: '2023-12-29 10:58:00',
        children: [
            {
                id: 'b5',
                name: 'LC08_L1TP_129032_20231201',
                dataType: 'Landsat标准卫星包',
                ingestionMode: 'batch',
                executionKind: 'offline',
                themeNodeId: 'rs-sat-s1',
                status: 'success',
                progress: 100,
                log: '导入成功',
                creator: '光谷信息',
                createTime: '2023-12-29 10:58:56',
            },
            {
                id: 'b6',
                name: 'LC08_L1TP_129032_20231215',
                dataType: 'Landsat标准卫星包',
                ingestionMode: 'batch',
                executionKind: 'offline',
                themeNodeId: 'rs-sat-s1',
                status: 'success',
                progress: 100,
                log: '导入成功',
                creator: '光谷信息',
                createTime: '2023-12-29 10:59:12',
            },
            {
                id: 'b7',
                name: 'LC08_L1TP_129032_20231228',
                dataType: 'Landsat标准卫星包',
                ingestionMode: 'batch',
                executionKind: 'offline',
                themeNodeId: 'rs-sat-s1',
                status: 'success',
                progress: 100,
                log: '导入成功',
                creator: '光谷信息',
                createTime: '2023-12-29 10:59:40',
            },
        ],
    },
    {
        id: 'bp-gf2',
        directoryName: 'GF2_PMS1_批量入库_陕西商洛',
        creator: '光谷信息',
        createTime: '2023-12-28 14:20:00',
        children: [
            {
                id: 'b8',
                name: 'GF2_PMS1_E119.2_N33.9_20231120_L1A0001234567',
                dataType: 'GF2标准卫星包',
                ingestionMode: 'batch',
                executionKind: 'realtime',
                themeNodeId: 'rs-sat-s2',
                status: 'processing',
                progress: 45,
                log: '正在写入空间索引…',
                creator: '光谷信息',
                createTime: '2023-12-28 14:22:01',
            },
            {
                id: 'b9',
                name: 'GF2_PMS1_E119.3_N33.8_20231120_L1A0001234568',
                dataType: 'GF2标准卫星包',
                ingestionMode: 'batch',
                executionKind: 'offline',
                themeNodeId: 'rs-sat-s2',
                status: 'failure',
                progress: 72,
                log: '校验失败：坐标系与模板不一致',
                creator: '光谷信息',
                createTime: '2023-12-28 14:25:33',
            },
        ],
    },
];

function isBatchStartable(task: IngestionTask): boolean {
    return task.status === 'pending' || task.status === 'failure';
}

function batchParentHasStartable(children: IngestionTask[]): boolean {
    return children.some(isBatchStartable);
}

function batchParentHasProcessing(children: IngestionTask[]): boolean {
    return children.some((c) => c.status === 'processing');
}

function simulateBatchChildRun(
    parentId: string,
    childId: string,
    setBatchParents: React.Dispatch<React.SetStateAction<BatchParentJob[]>>,
    startLabel: '批量' | '任务' = '批量',
) {
    const steps: { progress: number; log: string }[] = [
        { progress: 28, log: `${startLabel}启动，正在解压入库包…` },
        { progress: 62, log: '正在校验元数据与坐标系…' },
        { progress: 88, log: '正在写入空间索引…' },
        { progress: 100, log: '导入成功' },
    ];
    steps.forEach((step, i) => {
        window.setTimeout(() => {
            setBatchParents((prev) =>
                prev.map((p) => {
                    if (p.id !== parentId) return p;
                    return {
                        ...p,
                        children: p.children.map((c) => {
                            if (c.id !== childId) return c;
                            if (step.progress >= 100) {
                                return {
                                    ...c,
                                    status: 'success',
                                    progress: 100,
                                    log: step.log,
                                };
                            }
                            return {
                                ...c,
                                status: 'processing',
                                progress: step.progress,
                                log: step.log,
                            };
                        }),
                    };
                }),
            );
        }, (i + 1) * 750);
    });
}

const BATCH_INGESTION_FEATURE_POINTS: FeaturePoint[] = [
    { key: 'page-header', label: '页面头部', description: '标题、操作按钮区域' },
    { key: 'create-single', label: '新建单次入库任务', description: '右上角蓝色主按钮' },
    { key: 'create-batch', label: '新建批量入库任务', description: '右上角次级按钮' },
    { key: 'scope-tabs', label: '单次/批量页签', description: '切换单次入库任务与批量入库任务列表' },
    { key: 'status-filter', label: '状态过滤器', description: '全部 / 进行中 / 成功 / 失败 tab 切换' },
    { key: 'search-box', label: '任务名称搜索', description: '右侧搜索输入框' },
    { key: 'batch-delete', label: '批量删除', description: '多选后批量删除按钮' },
    { key: 'batch-parent-row', label: '批量父目录行', description: '可展开/折叠的批量入库目录' },
    { key: 'batch-start-all', label: '批量开始按钮', description: '父目录行右侧"批量开始"按钮，启动所有可执行子任务' },
    { key: 'child-task-row', label: '子任务行', description: '批量目录下的单条入库任务行' },
    { key: 'child-start', label: '子任务开始按钮', description: 'pending/failure 状态子任务行内"开始"按钮' },
    { key: 'task-detail-drawer', label: '任务详情抽屉', description: '点击任务名或"查看"后从右侧滑出的详情面板' },
    { key: 'progress-bar', label: '进度条', description: '任务进度可视化与状态图标' },
    { key: 'pagination', label: '分页', description: '底部分页条，支持切换页码和每页条数' },
];

export const SpatialDataIngestionPanel: React.FC<SpatialDataIngestionPanelProps> = ({
    onCreateTask,
    onOpenIngestedDataDetail,
    onEditBatchSubTask,
    pageTitle = '时空数据入库',
    hideScopeTabs = false,
    scopeTab,
    onScopeTabChange,
    statusTab: activeTab,
    onStatusTabChange: setActiveTab,
    listPage,
    listPageSize,
    onListPageChange: setListPage,
    onListPageSizeChange,
    listSearchQuery: searchQuery,
    onListSearchQueryChange: setSearchQuery,
    batchExpandedParentIds,
    onToggleBatchParentExpand: toggleBatchParentExpand,
}) => {
    const [taskDetailContext, setTaskDetailContext] = useState<{
        task: IngestionTask;
        batchGroupName?: string;
    } | null>(null);
    const taskDetailPayload = useMemo(
        () =>
            taskDetailContext
                ? buildIngestionTaskDetail(taskDetailContext.task, {
                      batchGroupName: taskDetailContext.batchGroupName,
                  })
                : null,
        [taskDetailContext],
    );

    const openTaskDetail = (task: IngestionTask, batchGroupName?: string) => {
        setTaskDetailContext({ task, batchGroupName });
    };

    const [batchParents, setBatchParents] = useState<BatchParentJob[]>(() => MOCK_BATCH_PARENTS);
    const [batchStartTip, setBatchStartTip] = useState<string | null>(null);
    const [specDrawerOpen, setSpecDrawerOpen] = useState(false);
    const [stopConfirm, setStopConfirm] = useState<
        | { type: 'child'; parentId: string; taskId: string; taskName: string }
        | { type: 'parent'; parentId: string; dirName: string }
        | null
    >(null);

    // tasks in current selection that are processing (block bulk-start)
    const [startBlockedTasks, setStartBlockedTasks] = useState<
        Array<{ parentId: string; task: IngestionTask }> | null
    >(null);

    const allBatchChildren = useMemo(
        () => batchParents.flatMap((p) => p.children),
        [batchParents],
    );

    const singleTasksInScope = useMemo(() => MOCK_TASKS, []);

    const statusCounts = useMemo(() => {
        if (scopeTab === 'single') {
            const q = searchQuery.trim().toLowerCase();
            const base = q
                ? singleTasksInScope.filter((t) => t.name.toLowerCase().includes(q))
                : singleTasksInScope;
            const processing = base.filter((t) => t.status === 'processing').length;
            const success = base.filter((t) => t.status === 'success').length;
            const failure = base.filter((t) => t.status === 'failure').length;
            return { all: base.length, processing, success, failure };
        }
        const processing = allBatchChildren.filter((t) => t.status === 'processing').length;
        const success = allBatchChildren.filter((t) => t.status === 'success').length;
        const failure = allBatchChildren.filter((t) => t.status === 'failure').length;
        return {
            all: allBatchChildren.length,
            processing,
            success,
            failure,
        };
    }, [scopeTab, singleTasksInScope, allBatchChildren, searchQuery]);

    const filteredSingleTasks = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        let list = q ? singleTasksInScope.filter((t) => t.name.toLowerCase().includes(q)) : singleTasksInScope;
        if (activeTab === 'all') return list;
        if (activeTab === 'processing') return list.filter((t) => t.status === 'processing');
        if (activeTab === 'success') return list.filter((t) => t.status === 'success');
        return list.filter((t) => t.status === 'failure');
    }, [singleTasksInScope, activeTab, searchQuery]);

    const filteredBatchParents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return batchParents.map((parent) => {
            const parentMatches = !q || parent.directoryName.toLowerCase().includes(q);
            let children = parent.children.filter(
                (c) => parentMatches || c.name.toLowerCase().includes(q),
            );
            if (activeTab !== 'all') {
                children = children.filter((c) => c.status === activeTab);
            }
            return { parent, children };
        }).filter(({ children }) => children.length > 0);
    }, [activeTab, searchQuery, batchParents]);

    const pageTasks = useMemo(() => {
        const start = (listPage - 1) * listPageSize;
        return filteredSingleTasks.slice(start, start + listPageSize);
    }, [filteredSingleTasks, listPage, listPageSize]);

    const pageBatchParents = useMemo(() => {
        const start = (listPage - 1) * listPageSize;
        return filteredBatchParents.slice(start, start + listPageSize);
    }, [filteredBatchParents, listPage, listPageSize]);

    const singleTotal = MOCK_TASKS.length;
    const batchTotal = batchParents.length;

    const runBatchChildrenStart = (
        parentId: string,
        childIds: string[],
        tip: string,
        initialLog: string,
        simulateLabel: '批量' | '任务',
        expandParent?: boolean,
    ) => {
        if (childIds.length === 0) return;

        const startIds = new Set(childIds);
        setBatchParents((prev) =>
            prev.map((p) => {
                if (p.id !== parentId) return p;
                return {
                    ...p,
                    children: p.children.map((c) => {
                        if (!startIds.has(c.id)) return c;
                        return {
                            ...c,
                            status: 'processing' as const,
                            progress: 6,
                            log: initialLog,
                        };
                    }),
                };
            }),
        );

        if (expandParent && !batchExpandedParentIds.includes(parentId)) {
            toggleBatchParentExpand(parentId);
        }

        setBatchStartTip(tip);
        window.setTimeout(() => setBatchStartTip(null), 3200);

        childIds.forEach((id) =>
            simulateBatchChildRun(parentId, id, setBatchParents, simulateLabel),
        );
    };

    const handleBatchStartParent = (parentId: string) => {
        const parent = batchParents.find((p) => p.id === parentId);
        if (!parent) return;

        const toStart = parent.children.filter(isBatchStartable);
        if (toStart.length === 0) {
            setBatchStartTip('当前任务组没有待启动的子任务（均已成功或进行中）');
            window.setTimeout(() => setBatchStartTip(null), 3200);
            return;
        }

        runBatchChildrenStart(
            parentId,
            toStart.map((c) => c.id),
            `已批量启动 ${toStart.length} 条子任务`,
            '批量启动，正在入库…',
            '批量',
            true,
        );
    };

    const handleBatchStartChild = (parentId: string, task: IngestionTask) => {
        if (!isBatchStartable(task)) {
            setBatchStartTip('该子任务无法启动（已成功或进行中）');
            window.setTimeout(() => setBatchStartTip(null), 3200);
            return;
        }

        runBatchChildrenStart(
            parentId,
            [task.id],
            `已启动子任务：${task.name}`,
            '任务启动，正在入库…',
            '任务',
            false,
        );
    };

    const handleBatchStopChild = (parentId: string, taskId: string) => {
        setBatchParents((prev) =>
            prev.map((p) => {
                if (p.id !== parentId) return p;
                return {
                    ...p,
                    children: p.children.map((c) =>
                        c.id === taskId
                            ? { ...c, status: 'failure' as const, log: '已手动停止' }
                            : c,
                    ),
                };
            }),
        );
        setBatchStartTip('已停止子任务');
        window.setTimeout(() => setBatchStartTip(null), 3200);
    };

    const handleBatchStopParent = (parentId: string) => {
        setBatchParents((prev) =>
            prev.map((p) => {
                if (p.id !== parentId) return p;
                return {
                    ...p,
                    children: p.children.map((c) =>
                        c.status === 'processing'
                            ? { ...c, status: 'failure' as const, log: '已手动停止' }
                            : c,
                    ),
                };
            }),
        );
        setBatchStartTip('已停止所有进行中的子任务');
        window.setTimeout(() => setBatchStartTip(null), 3200);
    };

    const handleConfirmStop = () => {
        if (!stopConfirm) return;
        if (stopConfirm.type === 'child') {
            handleBatchStopChild(stopConfirm.parentId, stopConfirm.taskId);
        } else {
            handleBatchStopParent(stopConfirm.parentId);
        }
        setStopConfirm(null);
    };

    const handleBulkStartSelected = () => {
        const selected: Array<{ parentId: string; task: IngestionTask }> = [];
        for (const p of batchParents) {
            for (const c of p.children) {
                if (selectedTaskIds.has(c.id)) selected.push({ parentId: p.id, task: c });
            }
        }
        const blocked = selected.filter(({ task }) => task.status === 'processing');
        if (blocked.length > 0) {
            setStartBlockedTasks(blocked);
            return;
        }
        doStartTasks(selected.filter(({ task }) => isBatchStartable(task)));
    };

    const doStartTasks = (targets: Array<{ parentId: string; task: IngestionTask }>) => {
        if (targets.length === 0) return;
        const grouped = new Map<string, string[]>();
        for (const { parentId, task } of targets) {
            if (!grouped.has(parentId)) grouped.set(parentId, []);
            grouped.get(parentId)!.push(task.id);
        }
        grouped.forEach((ids, parentId) => {
            runBatchChildrenStart(parentId, ids, `已启动 ${ids.length} 条任务`, '任务启动，正在入库…', '任务', false);
        });
    };

    const handleConfirmRemoveAndStart = () => {
        if (!startBlockedTasks) return;
        const blockedIds = new Set(startBlockedTasks.map(({ task }) => task.id));
        // remove blocked from selection
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            blockedIds.forEach((id) => next.delete(id));
            return next;
        });
        // start remaining selected startable tasks
        const remaining: Array<{ parentId: string; task: IngestionTask }> = [];
        for (const p of batchParents) {
            for (const c of p.children) {
                if (selectedTaskIds.has(c.id) && !blockedIds.has(c.id) && isBatchStartable(c)) {
                    remaining.push({ parentId: p.id, task: c });
                }
            }
        }
        doStartTasks(remaining);
        setStartBlockedTasks(null);
    };

    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        setSelectedTaskIds(new Set());
    }, [scopeTab]);

    const toggleTaskSelect = (taskId: string) => {
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const toggleBatchParentSelect = (children: IngestionTask[]) => {
        const childIds = children.map((c) => c.id);
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            const allSelected = childIds.length > 0 && childIds.every((id) => next.has(id));
            if (allSelected) {
                childIds.forEach((id) => next.delete(id));
            } else {
                childIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    const batchParentCheckState = (children: IngestionTask[]) => {
        const childIds = children.map((c) => c.id);
        if (childIds.length === 0) return { checked: false, indeterminate: false };
        const n = childIds.filter((id) => selectedTaskIds.has(id)).length;
        return {
            checked: n === childIds.length,
            indeterminate: n > 0 && n < childIds.length,
        };
    };

    const visibleBatchChildIds = useMemo(
        () => pageBatchParents.flatMap(({ children }) => children.map((c) => c.id)),
        [pageBatchParents],
    );

    const allVisibleBatchChildrenSelected =
        visibleBatchChildIds.length > 0 &&
        visibleBatchChildIds.every((id) => selectedTaskIds.has(id));
    const someVisibleBatchChildrenSelected = visibleBatchChildIds.some((id) =>
        selectedTaskIds.has(id),
    );

    const visibleSingleIds = useMemo(() => pageTasks.map((t) => t.id), [pageTasks]);
    const allVisibleSingleSelected =
        visibleSingleIds.length > 0 && visibleSingleIds.every((id) => selectedTaskIds.has(id));
    const someVisibleSingleSelected = visibleSingleIds.some((id) => selectedTaskIds.has(id));

    const toggleSelectAllOnPage = () => {
        if (scopeTab === 'single') {
            setSelectedTaskIds((prev) => {
                const next = new Set(prev);
                if (allVisibleSingleSelected) {
                    visibleSingleIds.forEach((id) => next.delete(id));
                } else {
                    visibleSingleIds.forEach((id) => next.add(id));
                }
                return next;
            });
            return;
        }
        setSelectedTaskIds((prev) => {
            const next = new Set(prev);
            if (allVisibleBatchChildrenSelected) {
                visibleBatchChildIds.forEach((id) => next.delete(id));
            } else {
                visibleBatchChildIds.forEach((id) => next.add(id));
            }
            return next;
        });
    };

    return (
        <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fadeIn">
            {/* 1. Styled Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                    <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{pageTitle}</h2>
                    <div className="relative group ml-1">
                        <div className="p-1 hover:bg-slate-100 rounded-full cursor-help transition-colors">
                            <Lightbulb size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
                        </div>
                        <div className="absolute left-0 top-full mt-2 w-[340px] bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 z-[100] ring-1 ring-white/10 origin-top-left">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                <Info size={14} className="text-blue-400" />
                                <span className="text-[14px] font-bold tracking-wide">入库功能说明</span>
                            </div>
                            <div className="space-y-2.5 text-slate-300 text-[13px]">
                                <p><strong className="text-white">栅格接入：</strong>支持卫星影像、无人机航测等高分辨率栅格数据的批量导入。</p>
                                <p><strong className="text-white">矢量接入：</strong>支持 Shapefile、GeoJSON、FileGDB 等常见空间要素格式。</p>
                                <p><strong className="text-white">自动化处理：</strong>入库过程中自动提取元数据、计算投影并建立高性能空间索引。</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSpecDrawerOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300"
                        title="需求规格说明（仅研发可见）"
                    >
                        <BookOpen size={14} />
                        需求规格说明
                    </button>
                    {(hideScopeTabs ? scopeTab === 'single' : true) && (
                      <button
                          type="button"
                          onClick={() => onCreateTask('single')}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-[14px] font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700"
                      >
                          <Plus size={16} />
                          新建单次入库任务
                      </button>
                    )}
                    {(hideScopeTabs ? scopeTab === 'batch' : true) && (
                      <button
                          type="button"
                          onClick={() => onCreateTask('batch')}
                          className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-1.5 text-[14px] font-bold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/80"
                      >
                          <Plus size={16} />
                          新建批量入库任务
                      </button>
                    )}
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50/50">
                <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                    {!hideScopeTabs ? (
                      <div className="flex shrink-0 gap-0 border-b border-slate-100 bg-slate-50/60 px-2 pt-2">
                          <ScopeTabButton
                              label="单次入库任务"
                              count={singleTotal}
                              active={scopeTab === 'single'}
                              onClick={() => onScopeTabChange('single')}
                          />
                          <ScopeTabButton
                              label="批量入库任务"
                              count={batchTotal}
                              active={scopeTab === 'batch'}
                              onClick={() => onScopeTabChange('batch')}
                          />
                      </div>
                    ) : null}

                    {/* Filter & Action Row */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <div className="bg-slate-100/80 p-1 rounded-lg flex items-center h-9">
                            <TabButton label="全部" count={statusCounts.all} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                            <TabButton label="进行中" count={statusCounts.processing} active={activeTab === 'processing'} onClick={() => setActiveTab('processing')} />
                            <TabButton label="成功" count={statusCounts.success} active={activeTab === 'success'} onClick={() => setActiveTab('success')} />
                            <TabButton label="失败" count={statusCounts.failure} active={activeTab === 'failure'} onClick={() => setActiveTab('failure')} />
                        </div>

                        <div className="flex items-center gap-3 h-9">
                            <div className="relative h-full">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="请输入任务名称搜索" 
                                    className="w-64 pl-4 pr-10 h-full bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                />
                                <Search className="absolute right-3 top-2.5 text-slate-300" size={14} />
                            </div>
                            <button className="flex items-center gap-1.5 px-3 h-full border border-slate-200 text-slate-500 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-all">
                                <Trash2 size={13} />
                                批量删除
                            </button>
                        </div>
                    </div>

                    {batchStartTip ? (
                        <div
                            className="border-b border-blue-100 bg-blue-50/80 px-4 py-2 text-[13px] font-medium text-blue-700"
                            role="status"
                        >
                            {batchStartTip}
                        </div>
                    ) : null}

                    {/* Table Area - Ensure no text wrapping */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-[14px] border-collapse min-w-[1200px] table-fixed">
                            <thead className="bg-[#f8fbfd] text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 w-12 text-center whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            className="cursor-pointer rounded border-slate-300"
                                            checked={
                                                scopeTab === 'single'
                                                    ? allVisibleSingleSelected
                                                    : allVisibleBatchChildrenSelected
                                            }
                                            ref={(el) => {
                                                if (!el) return;
                                                const indeterminate =
                                                    scopeTab === 'single'
                                                        ? someVisibleSingleSelected &&
                                                          !allVisibleSingleSelected
                                                        : someVisibleBatchChildrenSelected &&
                                                          !allVisibleBatchChildrenSelected;
                                                el.indeterminate = indeterminate;
                                            }}
                                            onChange={toggleSelectAllOnPage}
                                            aria-label="全选当前页任务"
                                        />
                                    </th>
                                    <th className="p-4 w-[240px] whitespace-nowrap">任务名称</th>
                                    <th className="p-4 w-[148px] whitespace-nowrap">数据类型</th>
                                    <th className="p-4 w-[100px] whitespace-nowrap">任务状态</th>
                                    <th className="p-4 w-[180px] whitespace-nowrap">进度</th>
                                    <th className="p-4 whitespace-nowrap">执行日志</th>
                                    <th className="p-4 w-[120px] whitespace-nowrap">创建人</th>
                                    <th className="p-4 w-[160px] whitespace-nowrap">创建时间</th>
                                    <th className="p-4 w-[210px] text-center whitespace-nowrap">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {scopeTab === 'single' ? (
                                    pageTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-blue-50/20 transition-all group">
                                            <td
                                                className="p-4 text-center whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="cursor-pointer rounded border-slate-300"
                                                    checked={selectedTaskIds.has(task.id)}
                                                    onChange={() => toggleTaskSelect(task.id)}
                                                    aria-label={`选择 ${task.name}`}
                                                />
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    type="button"
                                                    onClick={() => openTaskDetail(task)}
                                                    className="text-left w-full text-slate-800 font-bold group-hover:text-blue-600 transition-colors cursor-pointer tracking-tight truncate whitespace-nowrap"
                                                    title={`查看任务详情：${task.name}`}
                                                >
                                                    {task.name}
                                                </button>
                                            </td>
                                            <td
                                                className="p-4 whitespace-nowrap text-slate-600 font-medium"
                                                title={task.dataType}
                                            >
                                                {task.dataType}
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-left">
                                                <span
                                                    className={`
                                                px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block
                                                ${task.status === 'success' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                                                ${task.status === 'failure' ? 'bg-red-50 text-red-500 border-red-100' : ''}
                                                ${task.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                                            `}
                                                >
                                                    {task.status === 'success'
                                                        ? '成功'
                                                        : task.status === 'failure'
                                                          ? '失败'
                                                          : '进行中'}
                                                </span>
                                            </td>
                                            <IngestionProgressCell
                                                progress={task.progress}
                                                status={task.status}
                                            />
                                            <td className="p-4">
                                                <div
                                                    className="text-slate-500 truncate text-[13px] whitespace-nowrap"
                                                    title={task.log}
                                                >
                                                    {task.log}
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap text-slate-600 font-medium">{task.creator}</td>
                                            <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                                                {task.createTime}
                                            </td>
                                            <td className="p-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2 text-slate-300">
                                                    <button
                                                        type="button"
                                                        onClick={() => openTaskDetail(task)}
                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                        title="查看任务详情"
                                                    >
                                                        <Info size={17} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenIngestedDataDetail?.(task)}
                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                        title="查看入库数据"
                                                    >
                                                        <Eye size={17} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                        title="编辑"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                        title="删除"
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                        title="查看日志"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    {task.status === 'failure' && (
                                                        <button
                                                            className="p-1.5 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-all"
                                                            title="重试"
                                                        >
                                                            <RotateCw size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    pageBatchParents.map(({ parent, children }) => {
                                        const expanded = batchExpandedParentIds.includes(parent.id);
                                        const n = children.length;
                                        const canBatchStart = batchParentHasStartable(children);
                                        const canBatchStop = batchParentHasProcessing(children);
                                        const parentCheck = batchParentCheckState(children);

                                        return (
                                            <React.Fragment key={parent.id}>
                                                <tr className="hover:bg-blue-50/20 transition-all group bg-slate-50/40">
                                                    <td
                                                        className="p-4 text-center whitespace-nowrap"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="cursor-pointer rounded border-slate-300"
                                                            checked={parentCheck.checked}
                                                            ref={(el) => {
                                                                if (el) {
                                                                    el.indeterminate = parentCheck.indeterminate;
                                                                }
                                                            }}
                                                            onChange={() => toggleBatchParentSelect(children)}
                                                            aria-label={`选择任务组 ${parent.directoryName} 下全部子任务`}
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleBatchParentExpand(parent.id)}
                                                            className="flex w-full min-w-0 items-center gap-2 text-left font-bold text-slate-800 transition-colors hover:text-blue-600"
                                                            title={parent.directoryName}
                                                        >
                                                            <span className="flex shrink-0 items-center text-slate-400">
                                                                {expanded ? (
                                                                    <ChevronDown size={18} />
                                                                ) : (
                                                                    <ChevronRight size={18} />
                                                                )}
                                                            </span>
                                                            <FolderOpen size={17} className="shrink-0 text-amber-600/90" />
                                                            <span className="truncate tracking-tight">{parent.directoryName}</span>
                                                            <span className="shrink-0 text-[12px] font-medium text-slate-400">
                                                                （{n}）
                                                            </span>
                                                        </button>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-slate-500 text-[13px]">
                                                        共 {n} 条子任务
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-left text-slate-400 text-[13px]">
                                                        —
                                                    </td>
                                                    <td className="p-4 w-[180px] whitespace-nowrap text-left text-slate-400 text-[13px]">
                                                        —
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-[13px]">
                                                        展开查看子任务明细
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-slate-600 font-medium">
                                                        {parent.creator}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                                                        {parent.createTime}
                                                    </td>
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        <div className="flex items-center justify-center gap-1.5 text-slate-300">
                                                            <button
                                                                type="button"
                                                                disabled={!canBatchStart}
                                                                onClick={() => handleBatchStartParent(parent.id)}
                                                                className="p-1.5 rounded-md transition-all hover:text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                                title={
                                                                    canBatchStart
                                                                        ? '批量开始任务组内待启动/失败的子任务'
                                                                        : '无待启动子任务（均已成功或进行中）'
                                                                }
                                                            >
                                                                <Play size={17} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!canBatchStop}
                                                                onClick={() =>
                                                                    setStopConfirm({
                                                                        type: 'parent',
                                                                        parentId: parent.id,
                                                                        dirName: parent.directoryName,
                                                                    })
                                                                }
                                                                className="p-1.5 rounded-md transition-all hover:text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                                title={
                                                                    canBatchStop
                                                                        ? '停止所有进行中的子任务'
                                                                        : '无进行中的子任务'
                                                                }
                                                            >
                                                                <Square size={15} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="p-1.5 rounded-md transition-all hover:text-blue-600 hover:bg-blue-50"
                                                                title="批量编辑任务组"
                                                            >
                                                                <PenSquare size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expanded &&
                                                    children.map((task) => (
                                                        <tr
                                                            key={task.id}
                                                            className="hover:bg-blue-50/20 transition-all group bg-white"
                                                        >
                                                            <td
                                                                className="p-4 text-center whitespace-nowrap"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="cursor-pointer rounded border-slate-300"
                                                                    checked={selectedTaskIds.has(task.id)}
                                                                    onChange={() => toggleTaskSelect(task.id)}
                                                                    aria-label={`选择 ${task.name}`}
                                                                />
                                                            </td>
                                                            <td className="p-4 pl-12">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openTaskDetail(task, parent.directoryName)}
                                                                    className="text-left w-full text-slate-700 font-semibold group-hover:text-blue-600 transition-colors cursor-pointer tracking-tight truncate whitespace-nowrap text-[13px]"
                                                                    title={`查看任务详情：${task.name}`}
                                                                >
                                                                    {task.name}
                                                                </button>
                                                            </td>
                                                            <td
                                                                className="p-4 whitespace-nowrap text-slate-600 font-medium"
                                                                title={task.dataType}
                                                            >
                                                                {task.dataType}
                                                            </td>
                                                            <td className="p-4 whitespace-nowrap text-left">
                                                                <span
                                                                    className={`
                                                px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block
                                                ${task.status === 'success' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                                                ${task.status === 'failure' ? 'bg-red-50 text-red-500 border-red-100' : ''}
                                                ${task.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                                                ${task.status === 'pending' ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                                            `}
                                                                >
                                                                    {task.status === 'success'
                                                                        ? '成功'
                                                                        : task.status === 'failure'
                                                                          ? '失败'
                                                                          : task.status === 'pending'
                                                                            ? '待启动'
                                                                            : '进行中'}
                                                                </span>
                                                            </td>
                                                            <IngestionProgressCell
                                                                progress={task.progress}
                                                                status={task.status}
                                                            />
                                                            <td className="p-4">
                                                                <div
                                                                    className="text-slate-500 truncate text-[13px] whitespace-nowrap"
                                                                    title={task.log}
                                                                >
                                                                    {task.log}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 whitespace-nowrap text-slate-600 font-medium">
                                                                {task.creator}
                                                            </td>
                                                            <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                                                                {task.createTime}
                                                            </td>
                                                            <td className="p-4 text-center whitespace-nowrap">
                                                                <div className="flex items-center justify-center gap-1.5 text-slate-300">
                                                                    {isBatchStartable(task) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (selectedTaskIds.size > 0) {
                                                                                    handleBulkStartSelected();
                                                                                } else {
                                                                                    handleBatchStartChild(parent.id, task);
                                                                                }
                                                                            }}
                                                                            className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
                                                                            title={selectedTaskIds.size > 0 ? `启动选中的 ${selectedTaskIds.size} 条任务` : '开始任务'}
                                                                        >
                                                                            <Play size={16} />
                                                                        </button>
                                                                    )}
                                                                    {task.status === 'processing' && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setStopConfirm({
                                                                                    type: 'child',
                                                                                    parentId: parent.id,
                                                                                    taskId: task.id,
                                                                                    taskName: task.name,
                                                                                })
                                                                            }
                                                                            className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                                            title="停止任务"
                                                                        >
                                                                            <Square size={15} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openTaskDetail(task, parent.directoryName)}
                                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                                        title="查看任务详情"
                                                                    >
                                                                        <Info size={17} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onOpenIngestedDataDetail?.(task)}
                                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                                        title="查看入库数据"
                                                                    >
                                                                        <Eye size={17} />
                                                                    </button>
                                                                    {isBatchStartable(task) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                onEditBatchSubTask?.(task, {
                                                                                    id: parent.id,
                                                                                    directoryName: parent.directoryName,
                                                                                })
                                                                            }
                                                                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                                            title="编辑子任务"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                                        title="删除"
                                                                    >
                                                                        <Trash2 size={17} />
                                                                    </button>
                                                                    <button
                                                                        className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                                        title="查看日志"
                                                                    >
                                                                        <FileText size={16} />
                                                                    </button>
                                                                    <button
                                                                        className="p-1.5 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-all"
                                                                        title="克隆任务"
                                                                    >
                                                                        <Copy size={15} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {taskDetailPayload && (
                        <IngestionTaskDetailDrawer
                            detail={taskDetailPayload}
                            onClose={() => setTaskDetailContext(null)}
                        />
                    )}

                    {/* Pagination Footer */}
                    <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/40 p-4">
                        <PaginationBar
                            total={
                                scopeTab === 'single'
                                    ? filteredSingleTasks.length
                                    : filteredBatchParents.length
                            }
                            page={listPage}
                            pageSize={listPageSize}
                            onPageChange={setListPage}
                            onPageSizeChange={(s) => {
                                onListPageSizeChange(s);
                                setListPage(1);
                            }}
                            pageSizeOptions={[10, 20, 50]}
                        />
                    </div>
                </div>
            </div>

            {startBlockedTasks && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                        onClick={() => setStartBlockedTasks(null)}
                    />
                    <div className="relative z-10 w-[480px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                                    <AlertTriangle size={16} className="text-amber-500" />
                                </div>
                                <span className="text-[15px] font-bold text-slate-800">无法启动以下任务</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStartBlockedTasks(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-[13px] text-slate-500 mb-3">
                                以下任务正在进行中，不支持重复启动：
                            </p>
                            <div className="max-h-[200px] overflow-y-auto rounded-lg border border-amber-100 bg-amber-50/60 divide-y divide-amber-100">
                                {startBlockedTasks.map(({ task }) => (
                                    <div key={task.id} className="flex items-center gap-2 px-3 py-2">
                                        <RotateCw size={13} className="shrink-0 text-amber-500 animate-spin" />
                                        <span className="text-[13px] text-slate-700 truncate" title={task.name}>
                                            {task.name}
                                        </span>
                                        <span className="ml-auto shrink-0 text-[11px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                            进行中
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[12px] text-slate-400 mt-3">
                                可移除这些任务后，继续启动其余选中的可启动任务。
                            </p>
                        </div>
                        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 bg-slate-50/60">
                            <button
                                type="button"
                                onClick={() => setStartBlockedTasks(null)}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRemoveAndStart}
                                className="px-4 py-2 rounded-lg bg-emerald-500 text-[13px] font-bold text-white hover:bg-emerald-600 transition-colors"
                            >
                                移除并启动其余任务
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {stopConfirm && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                        onClick={() => setStopConfirm(null)}
                    />
                    <div className="relative z-10 w-[420px] rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
                        {/* Dialog header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50">
                                    <AlertTriangle size={16} className="text-red-500" />
                                </div>
                                <span className="text-[15px] font-bold text-slate-800">确认停止任务</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setStopConfirm(null)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        {/* Dialog body */}
                        <div className="px-5 py-5">
                            <p className="text-[14px] text-slate-600 leading-relaxed">
                                {stopConfirm.type === 'child' ? (
                                    <>
                                        确定要停止任务{' '}
                                        <span className="font-semibold text-slate-800 break-all">
                                            {stopConfirm.taskName}
                                        </span>{' '}
                                        吗？停止后任务状态将变为失败，可重新启动。
                                    </>
                                ) : (
                                    <>
                                        确定要停止任务组{' '}
                                        <span className="font-semibold text-slate-800 break-all">
                                            {stopConfirm.dirName}
                                        </span>{' '}
                                        中所有进行中的子任务吗？停止后可重新批量启动。
                                    </>
                                )}
                            </p>
                        </div>
                        {/* Dialog footer */}
                        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100 bg-slate-50/60">
                            <button
                                type="button"
                                onClick={() => setStopConfirm(null)}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmStop}
                                className="px-4 py-2 rounded-lg bg-red-500 text-[13px] font-bold text-white hover:bg-red-600 transition-colors"
                            >
                                确认停止
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <RequirementsSpecDrawer
                open={specDrawerOpen}
                onClose={() => setSpecDrawerOpen(false)}
                pageKey="batch-ingestion"
                pageTitle="批量入库"
                featurePoints={BATCH_INGESTION_FEATURE_POINTS}
            />
        </div>
    );
};

/** 固定宽度进度条，避免 table-fixed 下任务组行 flex-1 被压成 0 */
const IngestionProgressCell: React.FC<{
    progress: number;
    status: IngestionTask['status'];
}> = ({ progress, status }) => {
    const pct = Math.min(100, Math.max(0, progress));
    const fillClass =
        status === 'success'
            ? 'bg-emerald-500'
            : status === 'failure'
              ? 'bg-red-500'
              : status === 'pending'
                ? 'bg-slate-300'
                : 'bg-amber-400';

    return (
        <td className="p-4 w-[180px] whitespace-nowrap text-left">
            <div className="flex w-[152px] items-center justify-start gap-2">
                <div
                    className="h-1.5 w-[120px] shrink-0 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div className={`h-full transition-all duration-500 ${fillClass}`} style={{ width: `${pct}%` }} />
                </div>
                {status === 'success' ? (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                ) : status === 'failure' ? (
                    <XCircle size={14} className="shrink-0 text-red-500" />
                ) : (
                    <RotateCw size={14} className="shrink-0 animate-spin text-amber-500" />
                )}
            </div>
        </td>
    );
};

const TabButton: React.FC<{ label: string; count: number; active: boolean; onClick: () => void }> = ({ label, count, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 h-full rounded-md text-[14px] font-bold transition-all duration-300 whitespace-nowrap
            ${active 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}
        `}
    >
        <span>{label}</span>
        <span className={`px-1.5 py-0 rounded-md text-[10px] ${active ? 'bg-blue-50 text-blue-600 font-black' : 'bg-slate-200 text-slate-400'}`}>
            {count}
        </span>
    </button>
);

const ScopeTabButton: React.FC<{ label: string; count: number; active: boolean; onClick: () => void }> = ({
    label,
    count,
    active,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`
            relative flex items-center gap-2 px-5 py-3 text-[14px] font-bold transition-colors
            ${active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'}
        `}
    >
        <span>{label}</span>
        <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-black ${
                active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/80 text-slate-500'
            }`}
        >
            {count}
        </span>
        {active && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600" aria-hidden />
        )}
    </button>
);