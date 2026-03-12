/**
 * @file config.js
 * @description 
 * [单一数据源]
 * 此文件负责定义应用的所有静态配置（常量）和运行时状态（State）。
 * 不包含任何业务逻辑函数，仅提供数据结构。
 */

/**
 * @typedef {Object} Interval
 * @property {number} limit
 * @property {number} a2
 * @property {number} a1
 * @property {number} a0
 * @property {number} [id]
 * @property {number} [r2]
 * @property {string} [type]
 */

/**
 * @typedef {Object} StatConfig
 * @property {string} name_zh
 * @property {string} name_en
 * @property {string} export_name
 * @property {string} color
 * @property {string} class
 * @property {string} icon
 * @property {number} def_conv
 * @property {number} def_base
 * @property {number} base_limit
 * @property {number} step_limit
 * @property {string} letter
 * @property {string} var
 */

/**
 * @typedef {Object} StatState
 * @property {string} id
 * @property {boolean} locked
 * @property {number} lockVal
 * @property {number} basePct
 * @property {number} statBase
 * @property {number} conv
 * @property {Interval[]} intervals
 */

/**
 * @typedef {Object} State
 * @property {string} lang
 * @property {number} budget
 * @property {string} displayMode
 * @property {{c: number, h: number, m: number, v: number}} customValues
 * @property {{c: StatState, h: StatState, m: StatState, v: StatState}} stats
 * @property {{c: number, h: number, m: number, v: number, score: number}} optResults
 */

// ==================================================================================
// 1. 多语言配置 (I18N)
// ==================================================================================
/**
 * UI 文本字典
 * 结构：{ [langCode]: { [key]: "Text Content" } }
 *用于 main.js 中的 updateLanguageUI() 进行 DOM 文本替换。
 * @type {Object.<string, Object.<string, string>>}
 */
const I18N = {
  zh: {
    app_title: "WoW Stat Solver",
    app_subtitle: "",
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
    custom_title: "自定义属性组合",
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
    card_conv: "基础转化比 /1%",
    card_cap: "区间上限",
    card_add: "添加区间",
    card_mult: "相对收益乘数",
    stat_base_label: "Simc 模拟起点",
    set_btn_label: "设置",
    save_btn: "保存并计算",
    traj_modal_title: "绿字成长曲线模拟",
    sim_import_title: "导入 SimC 原始数据",
    import_process_btn: "解析并应用",
    base_modal_desc:
      "输入模拟开始时的基础属性值（Base Rating）。该数值不计入可分配预算，但会计入递减区间计算。",
    mode_label: "显示模式",
    mode_gain_text: "增量分配 (基础 + 分配)",
    mode_total_text: "最终百分比% (基础 + 分配)",
    // New
    sim_upload_guide: "上传模拟曲线数据文件",
    sim_preview_title: "多属性曲线分段拟合预览",
    sim_table_int: "递减区间",
    sim_table_func: "拟合函数",
    sim_table_r2: "$R^2$",
    card_base_tooltip: "模拟曲线基础",
    // Chart Titles
    chart_pct_traj: "绿字成长路线 (%)",
    chart_rating_traj: "绿字分配路线 (Rating)",
    chart_yield_traj: "总收益增长曲线",
    chart_delta_traj: "边际收益变化 (Delta)",
    chart_strategy_phases: "策略阶段分布",
  },
  en: {
    app_title: "WoW Stat Solver",
    app_subtitle: "",
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
    card_conv: "BASE CONV /1%",
    card_cap: "INT. CAP",
    card_add: "ADD INTERVAL",
    card_mult: "REL. GAIN",
    stat_base_label: "SIM BASE RATING",
    set_btn_label: "SET",
    save_btn: "Save & Recalculate",
    traj_modal_title: "Stat Growth Trajectory",
    sim_import_title: "Import SimC Raw Data",
    import_process_btn: "Process & Apply",
    base_modal_desc:
      "Enter base rating (from Sim) that does NOT count towards budget but DOES count towards DR.",
    mode_label: "View Mode",
    mode_gain_text: "ALLOCATED (BASE + ALLOC)",
    mode_total_text: "TOTAL %",
    // New
    sim_upload_guide: "Upload Simulation Data File",
    sim_preview_title: "Multi-Stat Curve Fit Preview",
    sim_table_int: "Interval",
    sim_table_func: "Function",
    sim_table_r2: "$R^2$",
    card_base_tooltip: "Simulation Base",
    // Chart Titles
    chart_pct_traj: "Stat Growth Trajectory (%)",
    chart_rating_traj: "Rating Allocation Trajectory",
    chart_yield_traj: "Total Yield Growth",
    chart_delta_traj: "Marginal Gain (Delta)",
    chart_strategy_phases: "Strategy Phases",
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
  a1: 0.0001,
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
 * 
 * @type {{c: StatConfig, h: StatConfig, m: StatConfig, v: StatConfig}}
 */
const STAT_CONFIG = {
  c: {
    name_zh: "爆击",
    name_en: "Critical Strike",
    export_name: "Critical Strike",
    color: "#ef4444",
    class: "stat-header-c",
    icon: "fa-fire",
    def_conv: 45.99,
    def_base: 5.0,
    base_limit: 1380, // 30% * 45.99
    step_limit: 460, // 10% * 45.99
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
    def_conv: 44.01,
    def_base: 0.0,
    base_limit: 1320, // 30% * 44.01
    step_limit: 440, // 10% * 44.01
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
    def_conv: 45.99,
    def_base: 0.0,
    base_limit: 1380, // 30% * 45.99
    step_limit: 460, // 10% * 45.99
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
    def_conv: 53.97,
    def_base: 0.0,
    base_limit: 1619, // 30% * 53.97
    step_limit: 540, // 10% * 53.97
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
 * @type {State}
 */
let state = {
  lang: "zh",
  budget: 4000,
  displayMode: "gain",
  customValues: { c: 1000, h: 1000, m: 1000, v: 1000 },
  stats: {
    c: {
      id: "c",
      locked: false,
      lockVal: 0,
      basePct: 5,
      statBase: 0,
      conv: 45.99,
      intervals: [],
    },
    h: {
      id: "h",
      locked: false,
      lockVal: 0,
      basePct: 0,
      statBase: 0,
      conv: 44.01,
      intervals: [],
    },
    m: {
      id: "m",
      locked: false,
      lockVal: 0,
      basePct: 0,
      statBase: 0,
      conv: 45.99,
      intervals: [],
    },
    v: {
      id: "v",
      locked: false,
      lockVal: 0,
      basePct: 0,
      statBase: 0,
      conv: 53.97,
      intervals: [],
    },
  },
  optResults: { c: 0, h: 0, m: 0, v: 0, score: 0 },
};
