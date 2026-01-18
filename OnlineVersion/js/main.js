/**
 * main.js
 * 应用入口：负责 DOM 事件监听、UI 同步及跨模块协调。
 */

// --- 1. 应用程序初始化 ---

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

/**
 * 初始化应用程序入口
 */
function initApp() {
  initStats(true); // 初始化属性卡片 DOM
  renderCards();

  // 安全绑定事件监听，防止 DOM 缺失导致脚本中断
  const safeBind = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  safeBind("btnReset", "click", resetApp);
  safeBind("btnTraj", "click", openTrajectoryModal);
  safeBind("btnExport", "click", () => ConfigManager.export());
  safeBind("btnImport", "change", (e) => ConfigManager.import(e.target));
  safeBind("btnSimImport", "click", openSimImportModal); 
  safeBind("btnApplySim", "click", applySimData);
  safeBind("langToggle", "click", toggleLanguage);

  // 执行初始计算并渲染 UI
  Solver.runSolver();
  updateLanguageUI();
  updateUI();
}

/**
 * 初始化属性配置，并渲染公式
 * @param {boolean} [useDefaults=true] - 是否填充默认分段区间
 */
function initStats(useDefaults = true) {
  const el = document.getElementById("footer-formula");
  if (el) {
    katex.render("Gain = a_2 X^2 + a_1 X + a_0", el, {
      throwOnError: false,
    });
  }

  ["c", "h", "m", "v"].forEach((k) => {
    if (useDefaults && state.stats[k].intervals.length === 0) {
      addInterval(k, STAT_CONFIG[k].base_limit, POLY_DEFAULT.a2, POLY_DEFAULT.a1, POLY_DEFAULT.a0);
    }
  });
  updateLanguageUI();
}

// --- 2. 核心 UI 更新与渲染逻辑 ---

/**
 * 更新页面所有数据展示（核心驱动函数）
 * 包含属性卡片内部数值、公式渲染、总得分及图表更新
 */
function updateUI() {
  let tm = 1.0;
  ["c", "h", "m", "v"].forEach((k) => {
    const val = Math.round(state.optResults[k]);
    const ctr = document.getElementById(`container_${k}`);
    if (!ctr) return;

    // 若未锁定，则将最优解同步到输入框显示
    if (!state.stats[k].locked) {
      ctr.querySelector(".lock-input").value = val;
    }

    // 动态渲染当前数值所在的区间公式
    const fC = document.getElementById(`formula_${k}`);
    if (fC) {
      fC.innerHTML = "";
      const inv = Utils.getActiveInterval(k, val);
      if (inv) {
        const { a2, a1, a0 } = inv;
        const L = STAT_CONFIG[k].letter, v = STAT_CONFIG[k].var;
        let f = `${L} = `;
        if (a2 !== 0) f += `${a2}${v}^2 + `;
        f += `${a1}${v} + ${a0}`;
        try {
          katex.render(f, fC, { throwOnError: false });
        } catch (e) {}
      }
    }

    // 更新各属性展示面板
    const m = Utils.getMultiplier(k, val);
    ctr.querySelector(".stat-mult-display").innerText = m.toFixed(4);
    ctr.querySelector(".panel-percent-display").innerText =
      Utils.getPanelPercent(k, val).toFixed(1) + "%";
    
    // 累计总收益
    tm *= m;
  });

  state.optResults.score = tm;
  document.getElementById("maxScore").innerText = tm.toFixed(4) + "x";

  // 同步更新自定义对比区 and 图表
  renderCustomInputs();
  ChartManager.updateCharts();
  updateComparison();
}

/**
 * 设置当前的绿字预算
 * @param {number|string} v - 预算数值
 */
function setBudget(v) {
  const budgetVal = parseInt(v);
  state.budget = budgetVal;
  
  const sl = document.getElementById("budgetSlider");
  const inp = document.getElementById("budgetInput");
  if (sl) sl.value = budgetVal;
  if (inp) inp.value = budgetVal;

  document.getElementById("budgetDisplay").innerText = budgetVal.toLocaleString();
  
  Solver.runSolver();
  updateUI();
}

// 绑定预算输入事件
const budgetSl = document.getElementById("budgetSlider");
const budgetInp = document.getElementById("budgetInput");
if (budgetSl) budgetSl.addEventListener("input", (e) => setBudget(e.target.value));
if (budgetInp) budgetInp.addEventListener("input", (e) => setBudget(e.target.value));

/**
 * 渲染自定义对比输入区域
 */
function renderCustomInputs() {
  const ctr = document.getElementById("customInputsContainer");
  if (!ctr) return;
  
  ctr.innerHTML = "";
  ["c", "h", "m", "v"].forEach((k) => {
    const name = state.lang === "zh" ? STAT_CONFIG[k].name_zh : STAT_CONFIG[k].name_en;
    let pre = "";
    if (state.displayMode === "total") {
      pre = `<span class="base-prefix">${state.stats[k].statBase} +</span>`;
    }
    ctr.innerHTML += `
      <div class="flex items-center gap-3">
        <span class="w-1.5 h-6 rounded-full" style="background:${STAT_CONFIG[k].color}"></span>
        <div class="flex-1">
          <label class="text-[10px] text-gray-500 block uppercase font-bold">${name}</label>
          <div class="custom-input-wrapper">
            ${pre}
            <input type="number" id="curr_${k}" value="${state.customValues[k]}" 
                   class="custom-input-clean" oninput="updateComparisonLogic(this.value,'${k}')">
          </div>
        </div>
      </div>`;
  });
  updateComparison();
}

/**
 * 渲染四个属性卡片
 */
function renderCards() {
  ["c", "h", "m", "v"].forEach((k) => renderStatCard(k));
}

/**
 * 渲染单个属性配置卡片 (Critical/Haste/Mastery/Versatility)
 * @param {string} key - 属性键名
 */
function renderStatCard(key) {
  const config = STAT_CONFIG[key];
  const tText = I18N[state.lang];
  const container = document.getElementById(`container_${key}`);
  if (!container) return;

  const tpl = document.getElementById("stat-card-template").content.cloneNode(true);
  
  // A. 标题与图标渲染
  tpl.querySelector(".stat-header").classList.add(config.class);
  tpl.querySelector(".stat-bg-icon").classList.add(config.icon);
  tpl.querySelector(".stat-name").innerText = state.lang === "zh" ? config.name_zh : config.name_en;
  tpl.querySelector(".stat-name").style.color = config.color;

  // B. 国际化文本填充
  const labels = {
    lock: "lock-label", alloc: "alloc-label", base: "base-label", 
    conv: "conv-label", add: "add-label", mult: "mult-label", 
    sbase: "stat_base_label", set: "set_btn_label", cap: "card_cap"
  };
  for (let k in labels) {
    const el = tpl.querySelector("." + labels[k]);
    if (el) el.innerText = tText["card_" + k] || tText[labels[k].replace(/-/g, "_")] || tText[k];
  }

  // C. 锁定逻辑处理
  const lockCheck = tpl.querySelector(".lock-check");
  const lockInput = tpl.querySelector(".lock-input");
  lockCheck.checked = state.stats[key].locked;
  lockInput.disabled = !state.stats[key].locked;
  lockInput.value = state.stats[key].lockVal;
  
  if (state.stats[key].locked) {
    tpl.querySelector(".glass-panel").classList.add("locked");
  }

  lockCheck.addEventListener("change", (e) => {
    state.stats[key].locked = e.target.checked;
    if (e.target.checked) {
      state.stats[key].lockVal = Math.round(state.optResults[key]);
    }
    renderStatCard(key);
    Solver.runSolver();
    updateUI();
  });

  lockInput.addEventListener("input", (e) => {
    state.stats[key].lockVal = parseInt(e.target.value) || 0;
    Solver.runSolver();
    updateUI();
  });

  // D. 基础参数 (转换率 & 基础百分比)
  const baseInp = tpl.querySelector(".base-input");
  const convInp = tpl.querySelector(".conv-input");
  baseInp.value = state.stats[key].basePct;
  convInp.value = state.stats[key].conv;

  baseInp.addEventListener("change", (e) => {
    state.stats[key].basePct = parseFloat(e.target.value) || 0;
    updateUI();
  });
  convInp.addEventListener("change", (e) => {
    state.stats[key].conv = parseFloat(e.target.value) || 700;
    updateUI();
  });

  // E. 属性起始基准值 (Stat Base)
  tpl.querySelector(".base-rating-display").innerText = state.stats[key].statBase;
  tpl.querySelector(".set-base-btn").addEventListener("click", openBaseModal);

  // F. 拟合分段区间列表渲染
  const list = tpl.querySelector(".intervals-list");
  list.innerHTML = "";
  state.stats[key].intervals.forEach((inv) => {
    const r = document.createElement("div");
    r.className = "grid grid-cols-12 gap-1 items-center bg-[#020617] p-2 rounded border border-slate-700/50 mb-1";
    const canDel = state.stats[key].intervals.length > 1;
    
    r.innerHTML = `
      <div class="col-span-3"><input type="number" data-f="limit" class="tiny-input w-full text-center text-gray-300" value="${inv.limit}"></div>
      <div class="col-span-2"><input type="number" step="0.000001" data-f="a2" class="tiny-input w-full text-center text-blue-300" value="${inv.a2}"></div>
      <div class="col-span-3"><input type="number" step="0.00001" data-f="a1" class="tiny-input w-full text-center text-green-300" value="${inv.a1}"></div>
      <div class="col-span-3"><input type="number" step="0.01" data-f="a0" class="tiny-input w-full text-center text-purple-300" value="${inv.a0}"></div>
      <div class="col-span-1 flex justify-center">
        ${canDel ? '<button class="text-red-500 hover:text-red-400 text-xs del-btn"><i class="fa-solid fa-times"></i></button>' : ""}
      </div>`;
    
    r.querySelectorAll("input").forEach((i) =>
      i.addEventListener("change", (e) => {
        inv[e.target.dataset.f] = parseFloat(e.target.value);
        if (e.target.dataset.f === "limit") {
          state.stats[key].intervals.sort((a, b) => a.limit - b.limit);
          renderStatCard(key);
        }
        Solver.runSolver();
        updateUI();
      }),
    );

    if (canDel) {
      r.querySelector(".del-btn").addEventListener("click", () => {
        state.stats[key].intervals = state.stats[key].intervals.filter((i) => i.id !== inv.id);
        renderStatCard(key);
        Solver.runSolver();
        updateUI();
      });
    }
    list.appendChild(r);
  });

  // 新增区间按钮
  tpl.querySelector(".add-interval-btn").addEventListener("click", () => {
    const last = state.stats[key].intervals[state.stats[key].intervals.length - 1];
    addInterval(
      key,
      last ? last.limit + 7000 : 21000,
      POLY_DEFAULT.a2,
      POLY_DEFAULT.a1,
      last ? last.a0 : POLY_DEFAULT.a0,
    );
    renderStatCard(key);
    Solver.runSolver();
    updateUI();
  });

  // 绑定动态 ID
  tpl.querySelector(".katex-formula-container").id = `formula_${key}`;
  tpl.querySelector(".stat-mult-display").id = `mult_display_${key}`;
  tpl.querySelector(".panel-percent-display").id = `percent_display_${key}`;
  
  container.innerHTML = "";
  container.appendChild(tpl);
}

/**
 * 为指定属性添加一个新的计算分段区间
 */
function addInterval(k, lim, a2, a1, a0) {
  state.stats[k].intervals.push({
    id: Date.now() + Math.random(),
    limit: lim,
    a2, a1, a0,
  });
  state.stats[k].intervals.sort((a, b) => a.limit - b.limit);
}

// --- 3. 模态框交互逻辑 ---

/**
 * 打开属性基准值 (Stat Base) 设定模态框
 */
function openBaseModal() {
  const container = document.getElementById("base-inputs-container");
  if (!container) return;
  
  container.innerHTML = "";
  ["c", "h", "m", "v"].forEach((k) => {
    const conf = STAT_CONFIG[k];
    const row = document.createElement("div");
    row.className = "flex items-center gap-3";
    row.innerHTML = `
      <div class="w-2 h-8 rounded" style="background:${conf.color}"></div>
      <div class="flex-1">
        <label class="text-xs text-gray-400 block">${state.lang === "zh" ? conf.name_zh : conf.name_en}</label>
        <input type="number" id="modal_base_${k}" value="${state.stats[k].statBase}" 
               class="tiny-input w-full text-base py-1 font-mono text-white bg-[#020617] border border-slate-700 rounded">
      </div>`;
    container.appendChild(row);
  });
  
  document.getElementById("baseModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("baseModalContent").classList.remove("scale-95", "opacity-0"), 10);
}

/**
 * 关闭属性基准值设定模态框
 */
function closeBaseModal() {
  document.getElementById("baseModalContent").classList.add("scale-95", "opacity-0");
  setTimeout(() => document.getElementById("baseModal").classList.add("hidden"), 200);
}

/**
 * 保存属性基准值设置，并自动平移现有的分段区间限制
 */
function saveBaseSettings() {
  ["c", "h", "m", "v"].forEach((k) => {
    const newVal = parseInt(document.getElementById(`modal_base_${k}`).value) || 0;
    const oldVal = state.stats[k].statBase;
    const diff = newVal - oldVal;
    
    state.stats[k].statBase = newVal;

    // 自动平移区间：当基准值增加时，现有的 RANGEMAX 应当相应减少以保持物理意义上的“绿字上限”一致
    const intervals = state.stats[k].intervals;
    if (intervals.length > 0) {
      intervals.forEach((inv) => {
        inv.limit = Math.max(0, inv.limit - diff);
      });
      intervals.sort((a, b) => a.limit - b.limit);
    }
  });

  renderCards();
  closeBaseModal();
  renderCustomInputs();
  Solver.runSolver();
  updateUI();
}

/**
 * 切换显示模式：增量分配 (Gain) vs 总体分配 (Total)
 * @param {string} mode - 'gain' 或 'total'
 */
function setMode(mode) {
  state.displayMode = mode;
  const btnGain = document.getElementById("btn-mode-gain");
  const btnTotal = document.getElementById("btn-mode-total");
  const labels = document.querySelectorAll(".mode-label-text");
  const t = I18N[state.lang];

  if (mode === "gain") {
    btnGain.className = "px-3 py-1 text-[10px] font-bold rounded transition bg-indigo-600 text-white";
    btnTotal.className = "px-3 py-1 text-[10px] font-bold rounded transition text-gray-400 hover:text-white";
    labels.forEach((l) => (l.innerText = t.mode_gain_text));
  } else {
    btnGain.className = "px-3 py-1 text-[10px] font-bold rounded transition text-gray-400 hover:text-white";
    btnTotal.className = "px-3 py-1 text-[10px] font-bold rounded transition bg-indigo-600 text-white";
    labels.forEach((l) => (l.innerText = t.mode_total_text));
  }

  ChartManager.updateCharts();
  renderCustomInputs();
}

/**
 * 打开 SimC 文件导入模态框
 */
function openSimImportModal() {
  document.getElementById("simImportModal").classList.remove("hidden");
  setTimeout(() => document.getElementById("simImportContent").classList.remove("scale-95", "opacity-0"), 10);
  
  updateSimBaseInputs();
  document.getElementById("btnApplySim").disabled = true;
  document.getElementById("importLog").innerText = "Waiting for file...";
  document.getElementById("simFitTable").innerHTML = '<tr><td colspan="2" class="text-center py-4 text-gray-600">No data loaded</td></tr>';
  
  if (ChartManager.instances.simPreviewChart) {
    ChartManager.instances.simPreviewChart.destroy();
    ChartManager.instances.simPreviewChart = null;
  }
}

/**
 * 关闭 SimC 文件导入模态框
 */
function closeSimImportModal() {
  document.getElementById("simImportContent").classList.add("scale-95", "opacity-0");
  setTimeout(() => document.getElementById("simImportModal").classList.add("hidden"), 200);
}

/**
 * 渲染导入模态框内的基准值输入项
 */
function updateSimBaseInputs() {
  const c = document.getElementById("simBaseInputs");
  if (!c) return;
  c.innerHTML = "";
  ["c", "h", "m", "v"].forEach((k) => {
    const cf = STAT_CONFIG[k], nm = state.lang === "zh" ? cf.name_zh : cf.name_en;
    c.innerHTML += `
      <div class="flex justify-between items-center bg-slate-800/50 p-2 rounded">
        <span class="text-[10px] font-bold" style="color:${cf.color}">${nm}</span>
        <input type="number" id="sim_base_${k}" value="${state.stats[k].statBase}" class="tiny-input w-20 text-right">
      </div>`;
  });
}

/**
 * 响应 SimC 文件选择并触发解析拟合
 */
function handleSimFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  const log = document.getElementById("importLog");
  log.innerText = "Processing...";

  reader.onload = (e) => {
    try {
      Solver.processSimData(e.target.result);
      updatePreviewSelect();
      ChartManager.updateSimPreviewChart();
      document.getElementById("btnApplySim").disabled = false;
      log.innerText = "Successfully parsed: " + Object.keys(Solver.simImportTempData).map(k => STAT_CONFIG[k].name_en).join(", ");
    } catch (err) {
      console.error("SimC Parsing Error:", err);
      log.innerText = "Error: " + err.message;
    }
  };
  reader.readAsText(file);
}

/**
 * 更新拟合预览中的属性下拉框
 */
function updatePreviewSelect() {
  const s = document.getElementById("previewStatSelect");
  if (!s || !Solver.simImportTempData) return;

  s.innerHTML = "";
  Object.keys(Solver.simImportTempData).forEach((k) => {
    const o = document.createElement("option");
    o.value = k;
    o.innerText = state.lang === "zh" ? STAT_CONFIG[k].name_zh : STAT_CONFIG[k].name_en;
    s.appendChild(o);
  });
}

/**
 * 应用拟合结果到全局配置
 */
function applySimData() {
  if (!Solver.simImportTempData) return;

  Object.keys(Solver.simImportTempData).forEach((k) => {
    state.stats[k].intervals = Solver.simImportTempData[k].intervals;
    state.stats[k].statBase = parseInt(document.getElementById(`sim_base_${k}`).value) || 0;
    renderStatCard(k);
  });

  Solver.runSolver();
  updateUI();
  closeSimImportModal();
  Solver.simImportTempData = null;
}

/**
 * 打开成长轨迹图模态框
 */
function openTrajectoryModal() {
  const { labels, d } = Solver.generateTrajectory();
  ChartManager.renderPercentTrajChart(labels, d.pcts);
  ChartManager.renderTrajectoryChart(labels, d);
  ChartManager.renderYieldTrajChart(labels, d.scores);
  ChartManager.renderDeltaTrajChart(labels, d.scores);
  document.getElementById("trajectoryModal").classList.remove("hidden");
}

/**
 * 关闭成长轨迹图模态框
 */
function closeTrajectoryModal() {
  document.getElementById("trajectoryModal").classList.add("hidden");
}

// --- 4. 辅助与对比逻辑 ---

/**
 * 切换多语言并刷新 UI
 */
function toggleLanguage() {
  state.lang = state.lang === "zh" ? "en" : "zh";
  updateLanguageUI();
  initStats(false); 
  updateUI();
}

/**
 * 根据当前语言更新所有带 [data-i18n] 的 DOM 文本
 */
function updateLanguageUI() {
  const t = I18N[state.lang];
  const langLabel = document.getElementById("langLabel");
  if (langLabel) langLabel.innerText = state.lang === "zh" ? "ZH" : "EN";
  
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (t[el.dataset.i18n]) el.innerText = t[el.dataset.i18n];
  });
  
  const modeLabels = document.querySelectorAll(".mode-label-text");
  const modeT = state.displayMode === "gain" ? t.mode_gain_text : t.mode_total_text;
  modeLabels.forEach((l) => (l.innerText = modeT));
  
  renderCards();
  renderCustomInputs();
  Solver.runSolver();
  updateUI();
  
  const labels = Object.values(STAT_CONFIG).map((c) => state.lang === "zh" ? c.name_zh : c.name_en);
  if (ChartManager.instances.distChart) {
    ChartManager.instances.distChart.data.labels = labels;
    ChartManager.instances.distChart.update();
  }
}

/**
 * 重置整个应用（刷新页面）
 */
function resetApp() {
  if (confirm("Reset all settings?")) {
    location.reload();
  }
}

/**
 * 更新用户自定义绿字数值逻辑
 */
function updateComparisonLogic(v, k) {
  state.customValues[k] = parseFloat(v) || 0;
  updateComparison();
}

/**
 * 计算最优解得分与自定义组合得分的差异，并更新对比进度条
 */
function updateComparison() {
  const { c, h, m, v } = state.customValues;
  const currTotalEl = document.getElementById("currTotal");
  if (currTotalEl) currTotalEl.innerText = (c + h + m + v).toLocaleString();
  
  const s = Utils.getMultiplier("c", c) * Utils.getMultiplier("h", h) *
            Utils.getMultiplier("m", m) * Utils.getMultiplier("v", v);
  
  const currYieldEl = document.getElementById("currYield");
  if (currYieldEl) currYieldEl.innerText = s.toFixed(4);
  
  const max = state.optResults.score || 1;
  const diff = (s / max - 1) * 100;
  
  const bar = document.getElementById("yieldBar");
  if (bar) {
    const ratio = (s / max) * 100;
    bar.style.width = `${Math.min(ratio, 100)}%`;
    bar.className = `h-full transition-all duration-300 ${diff > -0.1 ? "bg-emerald-500" : diff > -2 ? "bg-yellow-500" : "bg-red-500"}`;
  }
  
  const dEl = document.getElementById("yieldDiff");
  if (dEl) {
    dEl.innerText = (diff > 0 ? "+" : "") + diff.toFixed(2) + "%";
    dEl.className = `text-xs font-bold font-mono ${diff > -0.1 ? "text-emerald-400" : "text-red-400"}`;
  }
  ChartManager.updateCharts();
}

/**
 * 一键同步最优分配数值到自定义对比区
 */
function syncOptimal() {
  ["c", "h", "m", "v"].forEach((k) => (state.customValues[k] = Math.round(state.optResults[k])));
  renderCustomInputs();
}