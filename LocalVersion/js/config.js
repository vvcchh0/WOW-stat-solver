/**
 * @file config.js
 * @description 
 * [单一数据源]
 * 此文件负责定义应用的所有静态配置（常量）和运行时状态（State）。
 * 不包含任何业务逻辑函数，仅提供数据结构。
 */

// ==================================================================================
// 1. 多语言配置 (I18N)
// ==================================================================================
/**
 * UI 文本字典
 * 结构：{ [langCode]: { [key]: "Text Content" } }
 *用于 main.js 中的 updateLanguageUI() 进行 DOM 文本替换。
 */
const I18N = {
  zh: {
    app_title: "WoW Stat Solver",
    app_subtitle: "贪心算法 & 分段拟合",
    reset_btn: "重置",
    traj_btn: "成长模拟",
    export_btn: "导出",
    import_btn: "导入",
    sim_import_btn: "导入 SimC 数据",
    pool_label: "总属性预算",
    remaining_label: "余量:",
    max_score_title: "理论最优解总收益",
    max_score_desc: "基于当前参数的最大收益倍率",
    opt_dist_title: "最优属性分布",
    custom_title: "自定义配装对比",
    sync_btn: "同步最优解",
    stat_c: "爆击",
    stat_h: "急速",
    stat_m: "精通",
    stat_v: "全能",
    custom_sum: "自定义总和",
    custom_yield: "自定义绿字组合收益",
    card_lock: "锁定",
    card_alloc: "分配数值",
    card_base: "基础 %",
    card_conv: "1% 转化比",
    card_cap: "上限",
    card_add: "添加区间",
    card_mult: "当前倍率",
    stat_base_label: "Simc 模拟起点",
    set_btn_label: "设置",
    save_btn: "保存并计算",
    traj_modal_title: "绿字成长曲线模拟",
    sim_import_title: "导入 SimC 原始数据",
    import_process_btn: "解析并应用",
    base_modal_desc:
      "输入模拟开始时的基础属性值（Base Rating）。该数值不计入可分配预算，但会计入递减区间计算。",
    mode_label: "显示模式",
    mode_gain_text: "分配数值",
    mode_total_text: "最终百分比 (基础+分配)",
  },
  en: {
    app_title: "WoW Stat Solver",
    app_subtitle: "Greedy Algorithm & Segmented Fit",
    reset_btn: "Reset",
    traj_btn: "Trajectory",
    export_btn: "Export",
    import_btn: "Import",
    sim_import_btn: "Import SimC Data",
    pool_label: "Total Rating Pool",
    remaining_label: "Remaining:",
    max_score_title: "Theoretical Max",
    max_score_desc: "Max multiplier based on current params",
    opt_dist_title: "Optimal Distribution",
    custom_title: "Custom Build",
    sync_btn: "Sync Optimal",
    stat_c: "Crit",
    stat_h: "Haste",
    stat_m: "Mastery",
    stat_v: "Versatility",
    custom_sum: "Custom Sum",
    custom_yield: "Custom Yield",
    card_lock: "LOCK",
    card_alloc: "ALLOCATED",
    card_base: "BASE %",
    card_conv: "1% CONV",
    card_cap: "CAP",
    card_add: "ADD TIER",
    card_mult: "MULT",
    stat_base_label: "SIM BASE RATING",
    set_btn_label: "SET",
    save_btn: "Save & Recalculate",
    traj_modal_title: "Stat Growth Trajectory",
    sim_import_title: "Import SimC Raw Data",
    import_process_btn: "Process & Apply",
    base_modal_desc:
      "Enter base rating (from Sim) that does NOT count towards budget but DOES count towards DR.",
    mode_label: "View Mode",
    mode_gain_text: "ALLOCATED RATING",
    mode_total_text: "TOTAL % (BASE + ALLOC)",
  },
};

// ==================================================================================
// 2. 默认拟合参数
// ==================================================================================
/**
 * 默认多项式系数 (兜底逻辑)
 * 当用户未导入 SimC 数据或手动删除所有区间时，系统自动应用此线性微增模型，
 * 防止除以零错误并提供基础的收益反馈。
 * 模型: y = 0*x^2 + 0.00001*x + 1.0
 */
const POLY_DEFAULT = {
  a2: 0,
  a1: 0.00001,
  a0: 1.0,
};

// ==================================================================================
// 3. 绿字静态属性 (STAT_CONFIG)
// ==================================================================================
/**
 * 属性元数据配置表
 * 包含每个属性的 UI 表现（颜色、图标）和数学特性（转化率、递减阈值）。
 * 
 * 关键字段说明：
 * - def_conv: N等级 = 1% 面板属性
 * - base_limit: 进入 10% 递减前的阈值 (如 30%)
 * - step_limit: 每个递减阶段的跨度 (如 10%)
 */
const STAT_CONFIG = {
  c: {
    name_zh: "爆击",
    name_en: "Critical Strike",
    export_name: "Critical Strike",
    color: "#ef4444",
    class: "stat-header-c",
    icon: "fa-fire",
    def_conv: 700,
    def_base: 5.0,
    base_limit: 21000, // 30% * 700
    step_limit: 7000, // 10% * 700
    letter: "C",
    var: "c",
  },
  h: {
    name_zh: "急速",
    name_en: "Haste",
    export_name: "Haste",
    color: "#22c55e",
    class: "stat-header-h",
    icon: "fa-bolt",
    def_conv: 660,
    def_base: 0.0,
    base_limit: 19600,
    step_limit: 6600,
    letter: "H",
    var: "h",
  },
  m: {
    name_zh: "精通",
    name_en: "Mastery",
    export_name: "Mastery",
    color: "#a855f7",
    class: "stat-header-m",
    icon: "fa-crown",
    def_conv: 700,
    def_base: 0.0,
    base_limit: 21000,
    step_limit: 7000,
    letter: "M",
    var: "m",
  },
  v: {
    name_zh: "全能",
    name_en: "Versatility",
    export_name: "Versatility",
    color: "#3b82f6",
    class: "stat-header-v",
    icon: "fa-shield-halved",
    def_conv: 780,
    def_base: 0.0,
    base_limit: 23400,
    step_limit: 6600,
    letter: "V",
    var: "v",
  },
};

// ==================================================================================
// 4. 全局运行时状态 (State)
// ==================================================================================
/**
 * 核心状态对象 (Reactive Source)
 * 存储应用运行时的所有动态数据。修改此对象后需调用 updateUI() 刷新界面。
 * 
 * @property {string} lang - 当前语言 'zh' | 'en'
 * @property {number} budget - 当前可分配的总绿字预算 (Rating)
 * @property {Object} customValues - 右侧"自定义配装"区域的手动输入值
 * @property {Object} stats - 四大属性的详细配置（含区间数据 intervals、锁定状态 locked 等）
 * @property {Object} optResults - 算法计算出的最优解缓存
 */
let state = {
  lang: "zh",
  budget: 28000,
  displayMode: "gain",
  customValues: { c: 6000, h: 6000, m: 6000, v: 6000 },
  stats: {
    c: {
      id: "c",
      locked: false,
      lockVal: 0,
      basePct: 5,
      statBase: 0,
      conv: 700,
      intervals: [],
    },
    h: {
      id: "h",
      locked: false,
      lockVal: 0,
      basePct: 0,
      statBase: 0,
      conv: 660,
      intervals: [],
    },
    m: {
      id: "m",
      locked: false,
      lockVal: 0,
      basePct: 0,
      statBase: 0,
      conv: 700,
      intervals: [],
    },
    v: {
      id: "v",
      locked: false,
      lockVal: 0,
      basePct: 0,
      statBase: 0,
      conv: 780,
      intervals: [],
    },
  },
  optResults: { c: 0, h: 0, m: 0, v: 0, score: 0 },
};