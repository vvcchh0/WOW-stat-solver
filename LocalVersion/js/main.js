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
  /**
   * @param {string} id 
   * @param {string} event 
   * @param {EventListenerOrEventListenerObject} fn 
   */
  const safeBind = (id, event, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, fn);
  };

  safeBind("btnReset", "click", resetApp);
  safeBind("btnTraj", "click", openTrajectoryModal);
  // @ts-ignore
  safeBind("btnExport", "click", () => ConfigManager.export());
  // @ts-ignore
  safeBind("btnImport", "change", (e) => ConfigManager.import(/** @type {HTMLInputElement} */ (e.target)));
  safeBind("btnSimImport", "click", openSimImportModal); 
  safeBind("btnApplySim", "click", applySimData);
  safeBind("langToggle", "click", toggleLanguage);

  // 执行初始计算并渲染 UI
  // @ts-ignore
  Solver.runSolver();
  updateLanguageUI();
  updateUI();
}

/**
 * 初始化属性配置，并渲染公式
 * @param {boolean} [useDefaults=true] - 是否填充默认分段区间
 */
function initStats(useDefaults = true) {
  // Render damage formula (top line)
  const damageEl = document.getElementById("footer-formula-damage");
  if (damageEl) {
    katex.render("D = D_0 \\times \\prod_{i} \\text{StatGain}_i", damageEl, {
      throwOnError: false,
      displayMode: true,
    });
  }

  // Render gain formula (bottom line)
  const el = document.getElementById("footer-formula");
  if (el) {
    // @ts-ignore
    katex.render("\\text{StatGain}_i \\approx a_2 x_i^2 + a_1 x_i + a_0", el, {
      throwOnError: false,
      displayMode: true,
    });
  }

  // Initialize config import note as empty on first load only
  const noteEl = document.getElementById("configImportNote");
  const displayEl = document.getElementById("configNoteDisplay");
  if (noteEl) {
    // Only clear if not importing (i.e., no saved note in localStorage)
    const savedNote = localStorage.getItem("configImportNote");
    if (!savedNote) {
      noteEl.value = "";
      localStorage.removeItem("configImportNote");
    } else {
      // Restore saved note (from import)
      noteEl.value = savedNote;
    }

    // Auto-resize textarea
    const autoResize = () => {
      noteEl.style.height = "auto";
      const newHeight = Math.min(noteEl.scrollHeight, 180); // max ~5 lines
      noteEl.style.height = newHeight + "px";
    };

    noteEl.addEventListener("input", () => {
      localStorage.setItem("configImportNote", noteEl.value);
      autoResize();
      // Update preview if in display mode
      if (displayEl && !displayEl.classList.contains("hidden")) {
        displayEl.innerHTML = renderMarkdown(noteEl.value);
      }
    });

    // Initial resize
    setTimeout(autoResize, 0);
    
    // Update display if in preview mode and has saved note
    if (displayEl && !displayEl.classList.contains("hidden") && savedNote) {
      displayEl.innerHTML = renderMarkdown(savedNote);
    }
  }

  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => {
    // @ts-ignore
    if (useDefaults && state.stats[k].intervals.length === 0) {
      // @ts-ignore
      addInterval(k, STAT_CONFIG[k].base_limit, POLY_DEFAULT.a2, POLY_DEFAULT.a1, POLY_DEFAULT.a0);
    }
  });
  updateLanguageUI();
}

/**
 * Markdown renderer using marked.js
 * @param {string} md
 * @returns {string}
 */
function renderMarkdown(md) {
  if (!md || !md.trim()) return "";
  return marked.parse(md);
}

/**
 * Toggle between edit and preview mode for config note
 */
function toggleNoteMode() {
  const noteEl = document.getElementById("configImportNote");
  const displayEl = document.getElementById("configNoteDisplay");
  const btnEl = document.getElementById("btnToggleNoteMode");
  
  if (!noteEl || !displayEl || !btnEl) return;
  
  const isPreview = !displayEl.classList.contains("hidden");
  
  if (isPreview) {
    // Switch to edit mode
    displayEl.classList.add("hidden");
    noteEl.classList.remove("hidden");
    btnEl.innerHTML = '<i class="fa-solid fa-eye"></i>';
  } else {
    // Switch to preview mode
    displayEl.innerHTML = renderMarkdown(noteEl.value);
    noteEl.classList.add("hidden");
    displayEl.classList.remove("hidden");
    btnEl.innerHTML = '<i class="fa-solid fa-pen"></i>';
  }
}

// --- 2. 核心 UI 更新与渲染逻辑 ---

/**
 * 更新页面所有数据展示（核心驱动函数）
 * 包含属性卡片内部数值、公式渲染、总得分及图表更新
 */
function updateUI() {
  let tm = 1.0;
  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => {
    // @ts-ignore
    const val = Math.round(state.optResults[k]);
    const ctr = document.getElementById(`container_${k}`);
    if (!ctr) return;

    // 若未锁定，则将最优解同步到输入框显示
    // @ts-ignore
    if (!state.stats[k].locked) {
      /** @type {HTMLInputElement} */ (ctr.querySelector(".lock-input")).value = String(val);
    }

    // 动态渲染当前数值所在的区间公式
    const fC = document.getElementById(`formula_${k}`);
    if (fC) {
      fC.innerHTML = "";
      // @ts-ignore
      const inv = Utils.getActiveInterval(k, val);
      if (inv) {
        const { a2, a1, a0 } = inv;
        // @ts-ignore
        const L = STAT_CONFIG[k].letter, v = STAT_CONFIG[k].var;
        let f = `${L} = `;
        if (a2 !== 0) f += `${a2}${v}^2 + `;
        f += `${a1}${v} + ${a0}`;
        try {
          // @ts-ignore
          katex.render(f, fC, { throwOnError: false });
        } catch (e) {}
      }
    }

    // 更新各属性展示面板
    // @ts-ignore
    const m = Utils.getMultiplier(k, val);
    /** @type {HTMLElement} */ (ctr.querySelector(".stat-mult-display")).innerText = m.toFixed(4);
    /** @type {HTMLElement} */ (ctr.querySelector(".panel-percent-display")).innerText =
      // @ts-ignore
      "+" + Utils.getPanelPercent(k, val).toFixed(1) + "%";
    
    // 累计总收益
    tm *= m;
  });

  // @ts-ignore
  state.optResults.score = tm;
  /** @type {HTMLElement} */ (document.getElementById("maxScore")).innerText = tm.toFixed(4) + "x";

  // 同步更新自定义对比区 and 图表
  renderCustomInputs();
  // @ts-ignore
  ChartManager.updateCharts();
  updateComparison();
}

/**
 * 设置当前的绿字预算
 * @param {number|string} v - 预算数值
 */
function setBudget(v) {
  const budgetVal = parseInt(String(v));
  // @ts-ignore
  state.budget = budgetVal;
  
  const sl = /** @type {HTMLInputElement|null} */ (document.getElementById("budgetSlider"));
  const inp = /** @type {HTMLInputElement|null} */ (document.getElementById("budgetInput"));
  if (sl) sl.value = String(budgetVal);
  if (inp) inp.value = String(budgetVal);

  /** @type {HTMLElement} */ (document.getElementById("budgetDisplay")).innerText = budgetVal.toLocaleString();
  
  // @ts-ignore
  Solver.runSolver();
  updateUI();
}

// 绑定预算输入事件
const budgetSl = /** @type {HTMLInputElement|null} */ (document.getElementById("budgetSlider"));
const budgetInp = /** @type {HTMLInputElement|null} */ (document.getElementById("budgetInput"));
if (budgetSl) budgetSl.addEventListener("input", (e) => setBudget(/** @type {HTMLInputElement} */ (e.target).value));
if (budgetInp) budgetInp.addEventListener("input", (e) => setBudget(/** @type {HTMLInputElement} */ (e.target).value));

/**
 * 渲染自定义对比输入区域
 */
function renderCustomInputs() {
  const ctr = document.getElementById("customInputsContainer");
  if (!ctr) return;
  
  ctr.innerHTML = "";
  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => {
    // @ts-ignore
    const name = state.lang === "zh" ? STAT_CONFIG[k].name_zh : STAT_CONFIG[k].name_en;
    let pre = "";
    let val = state.customValues[k];
    let suffix = "";
    
    if (state.displayMode === "gain") {
      // GAIN Mode: Show Base + Allocated
      pre = `<div class="flex items-center shrink-0 mr-2"><span class="base-prefix">${state.stats[k].statBase} +</span></div>`;
    } else {
       // TOTAL Mode
       // Value is Panel Percent
       // @ts-ignore
       val = Utils.getPanelPercent(k, val).toFixed(2);
       suffix = `<span class="text-gray-500 ml-0.5 font-mono text-[10px]">%</span>`;
       
       // Prefix: Base (Gray) + Allocated (White/Bold)
       // @ts-ignore
       const allocated = Math.round(state.customValues[k]);
       // @ts-ignore
       const base = state.stats[k].statBase;
       pre = `<div class="flex items-center shrink-0 mr-1">
                <span class="text-[10px] text-gray-500 font-mono">${base} +</span>
                <span id="prefix_alloc_${k}" class="text-[10px] text-white font-bold font-mono ml-1">${allocated}</span>
              </div>`;
    }

    // @ts-ignore
    ctr.innerHTML += `
      <div class="flex items-center gap-3">
        <span class="w-1.5 h-6 rounded-full" style="background:${STAT_CONFIG[k].color}"></span>
        <div class="flex-1">
          <label class="text-[10px] text-gray-500 block uppercase font-bold">${name}</label>
          <div class="custom-input-wrapper">
            ${pre}
            <input type="number" id="curr_${k}" value="${val}" 
                   class="custom-input-clean" oninput="updateComparisonLogic(this.value,'${k}')">
            ${suffix}
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
  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => renderStatCard(k));
}

/**
 * 渲染单个属性配置卡片 (Critical/Haste/Mastery/Versatility)
 * @param {"c"|"h"|"m"|"v"} key - 属性键名
 */
function renderStatCard(key) {
  // @ts-ignore
  const config = STAT_CONFIG[key];
  // @ts-ignore
  const tText = I18N[state.lang];
  const container = document.getElementById(`container_${key}`);
  if (!container) return;

  const tplElement = /** @type {HTMLTemplateElement} */ (document.getElementById("stat-card-template"));
  const tpl = /** @type {DocumentFragment} */ (tplElement.content.cloneNode(true));
  
  // A. 标题与图标渲染
  // @ts-ignore
  tpl.querySelector(".stat-header").classList.add(config.class);
  // @ts-ignore
  tpl.querySelector(".stat-bg-icon").classList.add(config.icon);
  // @ts-ignore
  /** @type {HTMLElement} */ (tpl.querySelector(".stat-name")).innerText = state.lang === "zh" ? config.name_zh : config.name_en;
  // @ts-ignore
  /** @type {HTMLElement} */ (tpl.querySelector(".stat-name")).style.color = config.color;

  // B. 国际化文本填充
  const labels = {
    lock: "lock-label", alloc: "alloc-label", base: "base-label", 
    conv: "conv-label", add: "add-label", mult: "mult-label", 
    sbase: "stat_base_label", set: "set_btn_label", cap: "card_cap"
  };
  for (let k in labels) {
    const el = /** @type {HTMLElement} */ (tpl.querySelector("." + labels[/** @type {keyof typeof labels} */ (k)]));
    // @ts-ignore
    if (el) el.innerText = tText["card_" + k] || tText[labels[k].replace(/-/g, "_")] || tText[k];
  }

  // C. 锁定逻辑处理
  const lockCheck = /** @type {HTMLInputElement} */ (tpl.querySelector(".lock-check"));
  const lockInput = /** @type {HTMLInputElement} */ (tpl.querySelector(".lock-input"));
  // @ts-ignore
  lockCheck.checked = state.stats[key].locked;
  // @ts-ignore
  lockInput.disabled = !state.stats[key].locked;
  // @ts-ignore
  lockInput.value = String(state.stats[key].lockVal);
  
  // @ts-ignore
  if (state.stats[key].locked) {
    /** @type {HTMLElement} */ (tpl.querySelector(".glass-panel")).classList.add("locked");
  }

  lockCheck.addEventListener("change", (e) => {
    // @ts-ignore
    state.stats[key].locked = /** @type {HTMLInputElement} */ (e.target).checked;
    if (/** @type {HTMLInputElement} */ (e.target).checked) {
      // @ts-ignore
      state.stats[key].lockVal = Math.round(state.optResults[key]);
    }
    renderStatCard(key);
    // @ts-ignore
    Solver.runSolver();
    updateUI();
  });

  lockInput.addEventListener("input", (e) => {
    // @ts-ignore
    state.stats[key].lockVal = parseInt(/** @type {HTMLInputElement} */ (e.target).value) || 0;
    // @ts-ignore
    Solver.runSolver();
    updateUI();
  });

  // D. 基础参数 (转换率 & 基础百分比)
  const baseInp = /** @type {HTMLInputElement} */ (tpl.querySelector(".base-input"));
  const convInp = /** @type {HTMLInputElement} */ (tpl.querySelector(".conv-input"));
  // @ts-ignore
  baseInp.value = String(state.stats[key].basePct);
  // @ts-ignore
  convInp.value = String(state.stats[key].conv);

  baseInp.addEventListener("change", (e) => {
    // @ts-ignore
    state.stats[key].basePct = parseFloat(/** @type {HTMLInputElement} */ (e.target).value) || 0;
    updateUI();
  });
  convInp.addEventListener("change", (e) => {
    // @ts-ignore
    state.stats[key].conv = parseFloat(/** @type {HTMLInputElement} */ (e.target).value) || 700;
    updateUI();
  });

  // E. 属性起始基准值 (Stat Base)
  // @ts-ignore
  /** @type {HTMLElement} */ (tpl.querySelector(".base-rating-display")).innerText = String(state.stats[key].statBase);
  
  // Update Tooltip
  const infoIcon = tpl.querySelector(".fa-circle-info");
  if (infoIcon) {
    const separator = state.lang === "zh" ? "" : " ";
    // @ts-ignore
    infoIcon.title = (tText.card_base_tooltip || "Sim Base") + separator + (state.lang === "zh" ? config.name_zh : config.name_en);
  }

  // Render KaTeX headers
  tpl.querySelectorAll(".katex-header").forEach((el) => {
    // @ts-ignore
    katex.render(el.innerText, el, { throwOnError: false });
  });

  // @ts-ignore
  tpl.querySelector(".set-base-btn").addEventListener("click", openBaseModal);

  // F. 拟合分段区间列表渲染
  const list = /** @type {HTMLElement} */ (tpl.querySelector(".intervals-list"));
  list.innerHTML = "";
  // @ts-ignore
  state.stats[key].intervals.forEach((/** @type {any} */ inv) => {
    const r = document.createElement("div");
    r.className = "grid grid-cols-12 gap-1 items-center bg-[#020617] p-2 rounded border border-slate-700/50 mb-1";
    // @ts-ignore
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
        // @ts-ignore
        inv[e.target.dataset.f] = parseFloat(e.target.value);
        // @ts-ignore
        if (e.target.dataset.f === "limit") {
          // @ts-ignore
          state.stats[key].intervals.sort((a, b) => a.limit - b.limit);
          renderStatCard(key);
        }
        // @ts-ignore
        Solver.runSolver();
        updateUI();
      }),
    );

    if (canDel) {
      /** @type {HTMLElement} */ (r.querySelector(".del-btn")).addEventListener("click", () => {
        // @ts-ignore
        state.stats[key].intervals = state.stats[key].intervals.filter((i) => i.id !== inv.id);
        renderStatCard(key);
        // @ts-ignore
        Solver.runSolver();
        updateUI();
      });
    }
    list.appendChild(r);
  });

  // 新增区间按钮
  /** @type {HTMLElement} */ (tpl.querySelector(".add-interval-btn")).addEventListener("click", () => {
    // @ts-ignore
    const last = state.stats[key].intervals[state.stats[key].intervals.length - 1];
    // @ts-ignore
    const conf = STAT_CONFIG[key];
    addInterval(
      key,
      last ? last.limit + conf.step_limit : conf.base_limit,
      // @ts-ignore
      POLY_DEFAULT.a2,
      // @ts-ignore
      POLY_DEFAULT.a1,
      // @ts-ignore
      last ? last.a0 : POLY_DEFAULT.a0,
    );
    renderStatCard(key);
    // @ts-ignore
    Solver.runSolver();
    updateUI();
  });

  // 绑定动态 ID
  /** @type {HTMLElement} */ (tpl.querySelector(".katex-formula-container")).id = `formula_${key}`;
  /** @type {HTMLElement} */ (tpl.querySelector(".stat-mult-display")).id = `mult_display_${key}`;
  /** @type {HTMLElement} */ (tpl.querySelector(".panel-percent-display")).id = `percent_display_${key}`;
  
  container.innerHTML = "";
  container.appendChild(tpl);
}

/**
 * 为指定属性添加一个新的计算分段区间
 * @param {"c"|"h"|"m"|"v"} k
 * @param {number} lim
 * @param {number} a2
 * @param {number} a1
 * @param {number} a0
 */
function addInterval(k, lim, a2, a1, a0) {
  // @ts-ignore
  state.stats[k].intervals.push({
    id: Date.now() + Math.random(),
    limit: lim,
    a2, a1, a0,
  });
  // @ts-ignore
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
  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => {
    // @ts-ignore
    const conf = STAT_CONFIG[k];
    const row = document.createElement("div");
    row.className = "flex items-center gap-3";
    // @ts-ignore
    row.innerHTML = `
      <div class="w-2 h-8 rounded" style="background:${conf.color}"></div>
      <div class="flex-1">
        <label class="text-xs text-gray-400 block">${state.lang === "zh" ? conf.name_zh : conf.name_en}</label>
        <input type="number" id="modal_base_${k}" value="${state.stats[k].statBase}" 
               class="tiny-input w-full text-base py-1 font-mono text-white bg-[#020617] border border-slate-700 rounded">
      </div>`;
    container.appendChild(row);
  });
  
  /** @type {HTMLElement} */ (document.getElementById("baseModal")).classList.remove("hidden");
  setTimeout(() => /** @type {HTMLElement} */ (document.getElementById("baseModalContent")).classList.remove("scale-95", "opacity-0"), 10);
}

/**
 * 关闭属性基准值设定模态框
 */
function closeBaseModal() {
  /** @type {HTMLElement} */ (document.getElementById("baseModalContent")).classList.add("scale-95", "opacity-0");
  setTimeout(() => /** @type {HTMLElement} */ (document.getElementById("baseModal")).classList.add("hidden"), 200);
}

/**
 * 保存属性基准值设置，并自动平移现有的分段区间限制
 */
function saveBaseSettings() {
  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => {
    const newVal = parseInt(/** @type {HTMLInputElement} */ (document.getElementById(`modal_base_${k}`)).value) || 0;
    // @ts-ignore
    const oldVal = state.stats[k].statBase;
    const diff = newVal - oldVal;
    
    // @ts-ignore
    state.stats[k].statBase = newVal;

    // 自动平移区间：当基准值增加时，现有的 RANGEMAX 应当相应减少以保持物理意义上的“绿字上限”一致
    // @ts-ignore
    const intervals = state.stats[k].intervals;
    if (intervals.length > 0) {
      // @ts-ignore
      intervals.forEach((inv) => {
        inv.limit = Math.max(0, inv.limit - diff);
      });
      // @ts-ignore
      intervals.sort((a, b) => a.limit - b.limit);
    }
  });

  renderCards();
  closeBaseModal();
  renderCustomInputs();
  // @ts-ignore
  Solver.runSolver();
  updateUI();
}

/**
 * 切换显示模式：增量分配 (Gain) vs 总体分配 (Total)
 * @param {string} mode - 'gain' 或 'total'
 */
function setMode(mode) {
  // @ts-ignore
  state.displayMode = mode;
  const btnGain = document.getElementById("btn-mode-gain");
  const btnTotal = document.getElementById("btn-mode-total");
  const labels = document.querySelectorAll(".mode-label-text");
  // @ts-ignore
  const t = I18N[state.lang];

  if (mode === "gain") {
    /** @type {HTMLElement} */ (btnGain).className = "px-3 py-1 text-[10px] font-bold rounded transition bg-indigo-600 text-white border border-transparent";
    /** @type {HTMLElement} */ (btnTotal).className = "px-3 py-1 text-[10px] font-bold rounded transition text-gray-400 hover:text-white border border-transparent";
    labels.forEach((l) => (/** @type {HTMLElement} */ (l).innerText = t.mode_gain_text));
  } else {
    /** @type {HTMLElement} */ (btnGain).className = "px-3 py-1 text-[10px] font-bold rounded transition text-gray-400 hover:text-white border border-transparent";
    /** @type {HTMLElement} */ (btnTotal).className = "px-3 py-1 text-[10px] font-bold rounded transition bg-indigo-600 text-white border border-transparent";
    labels.forEach((l) => (/** @type {HTMLElement} */ (l).innerText = t.mode_total_text));
  }

  // @ts-ignore
  ChartManager.updateCharts();
  renderCustomInputs();
}

/**
 * 打开 SimC 文件导入模态框
 */
function openSimImportModal() {
  /** @type {HTMLElement} */ (document.getElementById("simImportModal")).classList.remove("hidden");
  setTimeout(() => /** @type {HTMLElement} */ (document.getElementById("simImportContent")).classList.remove("scale-95", "opacity-0"), 10);
  
  updateSimBaseInputs();
  /** @type {HTMLButtonElement} */ (document.getElementById("btnApplySim")).disabled = true;
  /** @type {HTMLElement} */ (document.getElementById("importLog")).innerText = "Waiting for file...";
  /** @type {HTMLElement} */ (document.getElementById("simFitTable")).innerHTML = '<tr><td colspan="2" class="text-center py-4 text-gray-600">No data loaded</td></tr>';
  
  // @ts-ignore
  if (ChartManager.instances.simPreviewChart) {
    // @ts-ignore
    ChartManager.instances.simPreviewChart.destroy();
    // @ts-ignore
    ChartManager.instances.simPreviewChart = null;
  }
}

/**
 * 关闭 SimC 文件导入模态框
 */
function closeSimImportModal() {
  /** @type {HTMLElement} */ (document.getElementById("simImportContent")).classList.add("scale-95", "opacity-0");
  setTimeout(() => /** @type {HTMLElement} */ (document.getElementById("simImportModal")).classList.add("hidden"), 200);
}

/**
 * 渲染导入模态框内的基准值输入项
 */
function updateSimBaseInputs() {
  const c = document.getElementById("simBaseInputs");
  if (!c) return;
  c.innerHTML = "";
  /** @type {Array<"c"|"h"|"m"|"v">} */
  const keys = ["c", "h", "m", "v"];
  keys.forEach((k) => {
    // @ts-ignore
    const cf = STAT_CONFIG[k], nm = state.lang === "zh" ? cf.name_zh : cf.name_en;
    // @ts-ignore
    c.innerHTML += `
      <div class="flex justify-between items-center bg-slate-800/50 p-2 rounded">
        <span class="text-[10px] font-bold" style="color:${cf.color}">${nm}</span>
        <input type="number" id="sim_base_${k}" value="${state.stats[k].statBase}" class="tiny-input w-20 text-right" oninput="handleSimBaseChange()">
      </div>`;
  });
}

/**
 * 响应 SimC 文件选择并触发解析拟合
 * @param {HTMLInputElement} input
 */
function handleSimFileSelect(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  const log = /** @type {HTMLElement} */ (document.getElementById("importLog"));
  log.innerText = "Processing...";

  reader.onload = (e) => {
    try {
      // @ts-ignore
      Solver.lastRawSimData = e.target.result;
      
      const strategyEl = /** @type {HTMLSelectElement} */ (document.getElementById("simFitStrategy"));
      const strategy = strategyEl ? strategyEl.value : 'auto';
      
      // @ts-ignore
      Solver.processSimData(e.target.result, strategy);
      updatePreviewSelect();
      // @ts-ignore
      ChartManager.updateSimPreviewChart();
      /** @type {HTMLButtonElement} */ (document.getElementById("btnApplySim")).disabled = false;
      // @ts-ignore
      log.innerText = "Successfully parsed: " + Object.keys(Solver.simImportTempData).map(k => STAT_CONFIG[k].name_en).join(", ");
    } catch (err) {
      console.error("SimC Parsing Error:", err);
      // @ts-ignore
      log.innerText = "Error: " + err.message;
    }
  };
  reader.readAsText(file);
}

/**
 * 响应 SimC 基准值输入变动，实时重算拟合
 */
function handleSimBaseChange() {
  // @ts-ignore
  if (!Solver.lastRawSimData) return;
  
  try {
    const strategyEl = /** @type {HTMLSelectElement} */ (document.getElementById("simFitStrategy"));
    const strategy = strategyEl ? strategyEl.value : 'auto';

    // @ts-ignore
    Solver.processSimData(Solver.lastRawSimData, strategy);
    // @ts-ignore
    ChartManager.updateSimPreviewChart();
  } catch (err) {
    console.error("Re-calc Error:", err);
  }
}

/**
 * 更新拟合预览中的属性下拉框
 */
function updatePreviewSelect() {
  const s = document.getElementById("previewStatSelect");
  // @ts-ignore
  if (!s || !Solver.simImportTempData) return;

  s.innerHTML = "";
  // @ts-ignore
  const keys = /** @type {Array<"c"|"h"|"m"|"v">} */ (Object.keys(Solver.simImportTempData));
  
  keys.forEach((k) => {
    const o = document.createElement("option");
    o.value = k;
    // @ts-ignore
    o.innerText = state.lang === "zh" ? STAT_CONFIG[k].name_zh : STAT_CONFIG[k].name_en;
    s.appendChild(o);
  });
}

/**
 * 应用拟合结果到全局配置
 */
function applySimData() {
  // @ts-ignore
  if (!Solver.simImportTempData) return;

  // @ts-ignore
  const keys = /** @type {Array<"c"|"h"|"m"|"v">} */ (Object.keys(Solver.simImportTempData));
  
  keys.forEach((k) => {
    // @ts-ignore
    state.stats[k].intervals = Solver.simImportTempData[k].intervals;
    // @ts-ignore
    state.stats[k].statBase = parseInt(/** @type {HTMLInputElement} */ (document.getElementById(`sim_base_${k}`)).value) || 0;
    renderStatCard(k);
  });

  // @ts-ignore
  Solver.runSolver();
  updateUI();
  closeSimImportModal();
  // @ts-ignore
  Solver.simImportTempData = null;
}

/**
 * 打开成长轨迹图模态框
 */
function openTrajectoryModal() {
  // @ts-ignore
  const { labels, d } = Solver.generateTrajectory();
    ChartManager.renderTrajectoryChart(labels, d);
    ChartManager.renderPercentTrajChart(labels, d.pcts);
    ChartManager.renderYieldTrajChart(labels, d.scores);
    // 传递完整数据对象以便访问 smoothScores
    ChartManager.renderDeltaTrajChart(labels, d);

  // 渲染策略阶段条
  // @ts-ignore
  const phases = Solver.analyzeTrajectoryPhases({ labels, d });
  const phaseContainer = document.getElementById("trajPhases");
  const legendContainer = document.getElementById("trajLegend");
  const listContainer = document.getElementById("trajPhaseList");
  const axisContainer = document.getElementById("trajAxis");
  
  if (phaseContainer && legendContainer && listContainer) {
    phaseContainer.innerHTML = "";
    legendContainer.innerHTML = "";
    listContainer.innerHTML = "";
    if (axisContainer) axisContainer.innerHTML = "";

    // MID Update: Sync with solver.js generateTrajectory range
    const minB = 1000;
    const maxB = 20000;
    const totalRange = maxB - minB;
    const uniquePhases = new Set();

    // Render Axis
    if (axisContainer) {
      const steps = 5; 
      for (let i = 0; i <= steps; i++) {
        const val = minB + (totalRange / steps) * i;
        const left = (i / steps) * 100;
        const tick = document.createElement("div");
        tick.className = "absolute top-0 transform -translate-x-1/2 flex flex-col items-center";
        tick.style.left = `${left}%`;
        tick.innerHTML = `
          <div class="h-1 w-px bg-gray-600 mb-0.5"></div>
          <span>${val >= 1000 ? (val/1000) + 'k' : val}</span>
        `;
        axisContainer.appendChild(tick);
      }
    }

    phases.forEach((p) => {
      // 1. Bar Segment
      const width = ((p.end - p.start) / totalRange) * 100;
      const el = document.createElement("div");
      el.style.width = `${width}%`;
      el.style.height = "100%";
      
      const t = I18N[state.lang];
      let localizedLabel = p.label;
      
      if (p.label === "Mixed") {
        localizedLabel = state.lang === "zh" ? "混合" : "Mixed";
      } else {
        // Handle "c" or "c + h"
        localizedLabel = p.label.split(" + ").map(key => {
           // @ts-ignore
           return t["stat_" + key] || key; 
        }).join(" + ");
      }

      /** @param {any} s */
      const fmtStats = (s) => `C:${s.c} H:${s.h} M:${s.m} V:${s.v}`;
      const rangeText = state.lang === "zh" ? "范围" : "Range";
      const startText = state.lang === "zh" ? "起点" : "Start";
      const endText = state.lang === "zh" ? "终点" : "End";

      const tooltipText = `${localizedLabel}\n${rangeText}: ${p.start} -> ${p.end}\n\n${startText}: ${fmtStats(p.startStats)}\n${endText}:   ${fmtStats(p.endStats)}`;
      el.title = tooltipText;
      
      let bgStyle = "";
      if (Array.isArray(p.color)) {
        bgStyle = `repeating-linear-gradient(45deg, ${p.color[0]}, ${p.color[0]} 10px, ${p.color[1]} 10px, ${p.color[1]} 20px)`;
      } else {
        bgStyle = p.color;
      }
      el.style.background = bgStyle;
      phaseContainer.appendChild(el);
      
      // 2. Legend Item (Unique)
      if (!uniquePhases.has(p.label)) {
        uniquePhases.add(p.label);
        const lItem = document.createElement("div");
        lItem.className = "flex items-center gap-2 text-[10px] text-gray-400";
        
        let iconStyle = "";
        if (Array.isArray(p.color)) {
           iconStyle = `background: repeating-linear-gradient(45deg, ${p.color[0]}, ${p.color[0]} 2px, ${p.color[1]} 2px, ${p.color[1]} 4px)`;
        } else {
           iconStyle = `background: ${p.color}`;
        }

        lItem.innerHTML = `<span class="w-3 h-3 rounded-full block" style="${iconStyle}"></span><span>${localizedLabel}</span>`;
        legendContainer.appendChild(lItem);
      }

      // 3. Detail List Item
      const listItem = document.createElement("div");
      listItem.className = "bg-slate-800/50 border border-slate-700/50 rounded px-3 py-2 flex items-center justify-between text-[10px] cursor-help hover:bg-slate-800 transition-colors";
      listItem.title = tooltipText;
      
      let dotStyle = "";
      if (Array.isArray(p.color)) {
         dotStyle = `background: linear-gradient(to right, ${p.color[0]}, ${p.color[1]})`;
      } else {
         dotStyle = `background: ${p.color}`;
      }

      listItem.innerHTML = `
        <div class="flex items-center gap-2">
           <span class="w-2 h-2 rounded-full" style="${dotStyle}"></span>
           <span class="font-bold text-gray-300">${localizedLabel}</span>
        </div>
        <div class="font-mono text-gray-400">
           <span class="text-indigo-400">${p.start}</span> <i class="fa-solid fa-arrow-right text-[8px] mx-1"></i> <span class="text-indigo-400">${p.end}</span>
        </div>
      `;
      listContainer.appendChild(listItem);
    });
  }

  /** @type {HTMLElement} */ (document.getElementById("trajectoryModal")).classList.remove("hidden");
}

/**
 * 关闭成长轨迹图模态框
 */
function closeTrajectoryModal() {
  /** @type {HTMLElement} */ (document.getElementById("trajectoryModal")).classList.add("hidden");
}

/**
 * 导出成长模拟报告为独立 HTML 文件
 */
function exportTrajectoryReport() {
  const t = I18N[state.lang];
  const noteEl = document.getElementById("configImportNote");
  const configNote = noteEl ? noteEl.value : "";

  // 获取轨迹数据
  const trajData = Solver.generateTrajectory();
  const phases = Solver.analyzeTrajectoryPhases(trajData);
  const { labels, d } = trajData;

  // 生成配置信息
  const statsConfig = {};
  ["c", "h", "m", "v"].forEach((k) => {
    // @ts-ignore
    const stat = state.stats[k];
    // @ts-ignore
    const conf = STAT_CONFIG[k];
    statsConfig[k] = {
      // @ts-ignore
      name: state.lang === "zh" ? conf.name_zh : conf.name_en,
      base: conf.def_base,  // Use def_base from STAT_CONFIG
      conv: conf.def_conv,
      intervals: stat.intervals.map((inv) => ({
        limit: inv.limit,
        a2: inv.a2,
        a1: inv.a1,
        a0: inv.a0,
      })),
    };
  });

  // 生成 HTML 内容
  const htmlContent = generateReportHTML({
    title: t.export_report_title,
    subtitle: t.export_report_subtitle,
    timestamp: new Date().toLocaleString(state.lang === "zh" ? "zh-CN" : "en-US"),
    configNote,
    budgetRange: { min: 1000, max: 20000, step: 200 },
    statsConfig,
    trajData: { labels, d, phases, smoothScores: d.smoothScores },
    t,
  });

  // 下载文件
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const langSuffix = state.lang === "zh" ? "_zh" : "_en";
  // Use local time to match config export format
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const timestamp = `${yy}-${mm}-${dd}-${hh}-${min}-${ss}`;
  a.download = `WoW_Stat_Trajectory_Report${langSuffix}_${timestamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- 4. 辅助与对比逻辑 ---

/**
 * 切换多语言并刷新 UI
 */
function toggleLanguage() {
  // @ts-ignore
  state.lang = state.lang === "zh" ? "en" : "zh";
  updateLanguageUI();
  initStats(false); 
  updateUI();
}

/**
 * 根据当前语言更新所有带 [data-i18n] 的 DOM 文本
 */
function updateLanguageUI() {
  // @ts-ignore
  const t = I18N[state.lang];
  const langLabel = document.getElementById("langLabel");
  // @ts-ignore
  if (langLabel) langLabel.innerText = state.lang === "zh" ? "ZH" : "EN";

  // Update innerText for [data-i18n]
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    // @ts-ignore
    if (t[el.dataset.i18n]) /** @type {HTMLElement} */ (el).innerText = t[el.dataset.i18n];
  });

  // Update placeholder for [data-i18n-placeholder]
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    // @ts-ignore
    if (t[el.dataset.i18nPlaceholder]) /** @type {HTMLInputElement|HTMLTextAreaElement} */ (el).placeholder = t[el.dataset.i18nPlaceholder];
  });
  
  const modeLabels = document.querySelectorAll(".mode-label-text");
  // @ts-ignore
  const modeT = state.displayMode === "gain" ? t.mode_gain_text : t.mode_total_text;
  modeLabels.forEach((l) => (/** @type {HTMLElement} */ (l).innerText = modeT));
  
  renderCards();
  renderCustomInputs();
  // @ts-ignore
  Solver.runSolver();
  updateUI();
  
  // @ts-ignore
  const labels = Object.values(STAT_CONFIG).map((c) => state.lang === "zh" ? c.name_zh : c.name_en);
  // @ts-ignore
  if (ChartManager.instances.distChart) {
    // @ts-ignore
    ChartManager.instances.distChart.data.labels = labels;
    // @ts-ignore
    ChartManager.instances.distChart.update();
  }
}

/**
 * 重置整个应用（刷新页面）
 */
function resetApp() {
  if (confirm("Reset all settings?")) {
    // Clear config note when resetting
    localStorage.removeItem("configImportNote");
    const noteEl = document.getElementById("configImportNote");
    const displayEl = document.getElementById("configNoteDisplay");
    if (noteEl) noteEl.value = "";
    if (displayEl) displayEl.innerHTML = "";
    location.reload();
  }
}

/**
 * 更新用户自定义绿字数值逻辑
 * @param {string} v
 * @param {string} k
 */
function updateComparisonLogic(v, k) {
  let val = parseFloat(v) || 0;
  
  // @ts-ignore
  if (state.displayMode === "total") {
     // Input is Percent -> Convert to Allocated Rating
     // @ts-ignore
     const totalRating = Utils.getPanelRating(k, val);
     // @ts-ignore
     const allocated = Math.max(0, totalRating - state.stats[k].statBase);
     
     // Update state
     // @ts-ignore
     state.customValues[k] = allocated;
     
     // Live update the allocated rating display text
     const allocDisplay = document.getElementById(`prefix_alloc_${k}`);
     if (allocDisplay) allocDisplay.innerText = Math.round(allocated).toString();
     
  } else {
     // Input is Allocated Rating
     // @ts-ignore
     state.customValues[k] = val;
  }

  updateComparison();
}

/**
 * 计算最优解得分与自定义组合得分的差异，并更新对比进度条
 */
function updateComparison() {
  // @ts-ignore
  const { c, h, m, v } = state.customValues;
  const currTotalEl = document.getElementById("currTotal");
  if (currTotalEl) currTotalEl.innerText = (c + h + m + v).toLocaleString();
  
  // @ts-ignore
  const s = Utils.getMultiplier("c", c) * Utils.getMultiplier("h", h) *
            // @ts-ignore
            Utils.getMultiplier("m", m) * Utils.getMultiplier("v", v);
  
  const currYieldEl = document.getElementById("currYield");
  if (currYieldEl) currYieldEl.innerText = s.toFixed(4);
  
  // @ts-ignore
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
  // @ts-ignore
  ChartManager.updateCharts();
}

/**
 * 一键同步最优分配数值到自定义对比区
 */
function syncOptimal() {
  // @ts-ignore
  const keys = ["c", "h", "m", "v"];
  // @ts-ignore
  keys.forEach((k) => (state.customValues[k] = Math.round(state.optResults[k])));
  renderCustomInputs();
}

/**
 * 生成成长模拟报告的 HTML 内容
 * @param {{title: string, subtitle: string, timestamp: string, configNote: string, budgetRange: {min: number, max: number, step: number}, statsConfig: Object, trajData: {labels: number[], d: any, phases: any[]}, t: any}} opts
 */
function generateReportHTML(opts) {
  const { title, subtitle, timestamp, configNote, budgetRange, statsConfig, trajData, t } = opts;
  const { labels, d, phases, smoothScores } = trajData;

  // 生成配置信息 HTML
  let statsConfigHTML = "";
  ["c", "h", "m", "v"].forEach((k) => {
    const conf = statsConfig[k];
    const intervalsHTML = conf.intervals
      .map(
        (inv, i) => `
          <tr class="border-b border-slate-700/50">
            <td class="py-2 px-3 text-xs text-gray-400">${i + 1}</td>
            <td class="py-2 px-3 text-xs font-mono text-indigo-400">${inv.limit.toFixed(0)}</td>
            <td class="py-2 px-3 text-xs font-mono text-emerald-400">${inv.a2.toExponential(4)}</td>
            <td class="py-2 px-3 text-xs font-mono text-emerald-400">${inv.a1.toExponential(4)}</td>
            <td class="py-2 px-3 text-xs font-mono text-emerald-400">${inv.a0.toFixed(6)}</td>
          </tr>`,
      )
      .join("");

    statsConfigHTML += `
      <div class="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
        <h4 class="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <i class="fa-solid fa-${k === "c" ? "fire" : k === "h" ? "bolt" : k === "m" ? "wand-magic" : "shield"}" style="color: ${STAT_CONFIG[k].color}"></i>
          ${conf.name}
        </h4>
        <div class="grid grid-cols-2 gap-4 mb-3">
          <div class="text-xs">
            <span class="text-gray-500">${t.export_base_pct}</span>
            <span class="text-white font-mono ml-2">${conf.base.toFixed(1)}%</span>
          </div>
          <div class="text-xs">
            <span class="text-gray-500">${t.export_base_conv}</span>
            <span class="text-white font-mono ml-2">${conf.conv.toFixed(2)}</span>
          </div>
        </div>
        <h5 class="text-xs font-bold text-gray-400 uppercase mb-2">${t.export_intervals}</h5>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-slate-900/50">
              <tr>
                <th class="py-2 px-3 text-left text-gray-500 font-normal">#</th>
                <th class="py-2 px-3 text-left text-gray-500 font-normal">Limit</th>
                <th class="py-2 px-3 text-left text-gray-500 font-normal">a₂</th>
                <th class="py-2 px-3 text-left text-gray-500 font-normal">a₁</th>
                <th class="py-2 px-3 text-left text-gray-500 font-normal">a₀</th>
              </tr>
            </thead>
            <tbody>${intervalsHTML}</tbody>
          </table>
        </div>
      </div>
    `;
  });

  // 生成策略阶段 HTML（带折叠功能）
  let phasesHTML = "";
  if (phases && phases.length > 0) {
    // 为每个阶段计算详细的属性分配
    const detailedPhases = phases.map((p, idx) => {
      // 找到该阶段对应的轨迹数据点
      const startIndex = labels.indexOf(p.start);
      const endIndex = labels.indexOf(p.end);
      
      // 获取该阶段内各属性的分配区间
      const statRanges = {};
      ["c", "h", "m", "v"].forEach((k) => {
        const startVal = d[k][startIndex];
        const endVal = d[k][endIndex];
        if (endVal - startVal > 0) {
          statRanges[k] = { start: Math.round(startVal), end: Math.round(endVal) };
        }
      });
      
      return { ...p, statRanges };
    });
    
    // 获取本地化的属性名称
    const getStatName = (k) => {
      // @ts-ignore
      return state.lang === "zh" 
        ? (k === "c" ? "爆击" : k === "h" ? "急速" : k === "m" ? "精通" : "全能")
        : (k === "c" ? "Crit" : k === "h" ? "Haste" : k === "m" ? "Mastery" : "Vers");
    };
    
    phasesHTML = `
      <div class="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700">
        <h4 class="text-sm font-bold text-white mb-3">${t.export_phases}</h4>
        <div class="space-y-2">
          ${detailedPhases
            .map(
              (p, i) => {
                const statItems = Object.entries(p.statRanges)
                  .map(([k, range]) => {
                    return `<div class="flex items-center gap-2 text-[10px]">
                      <span class="text-gray-500">${getStatName(k)}:</span>
                      <span class="text-indigo-400 font-mono">${range.start} → ${range.end}</span>
                    </div>`;
                  })
                  .join("");
                
                return `
                  <div class="bg-slate-900/50 rounded border border-slate-700/50 overflow-hidden">
                    <button onclick="this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.chevron-icon').classList.toggle('rotate-90')" class="w-full flex items-center justify-between px-3 py-2 bg-slate-800/50 hover:bg-slate-800/70 transition text-left">
                      <div class="flex items-center gap-2">
                        <i class="fa-solid fa-chevron-right chevron-icon text-gray-500 text-[8px] transition-transform"></i>
                        <span class="w-2 h-2 rounded-full" style="background: ${Array.isArray(p.color) ? p.color[0] : p.color}"></span>
                        <span class="text-xs font-bold text-gray-300">${p.label}</span>
                      </div>
                      <span class="text-xs font-mono text-indigo-400">${p.start} → ${p.end}</span>
                    </button>
                    ${statItems ? `<div class="hidden px-3 py-2 border-t border-slate-700/50 space-y-1 bg-slate-900/30">
                      ${statItems}
                    </div>` : ''}
                  </div>
                `;
              }
            )
            .join("")}
        </div>
      </div>
    `;
  }

  // 渲染 Markdown 注释
  const renderedNote = configNote.trim() ? marked.parse(configNote) : '<p class="text-gray-500 italic">No comments</p>';

  return `<!DOCTYPE html>
<html lang="${state.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <style>
    body { background-color: #0f172a; color: #cbd5e1; font-family: 'Inter', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600;800&display=swap');
    /* Markdown Styles */
    .markdown-content h1 { font-size: 1.75rem; font-weight: 700; color: #a5b4fc; margin: 1rem 0 0.5rem; }
    .markdown-content h2 { font-size: 1.5rem; font-weight: 700; color: #a5b4fc; margin: 1rem 0 0.5rem; }
    .markdown-content h3 { font-size: 1.25rem; font-weight: 700; color: #a5b4fc; margin: 1rem 0 0.5rem; }
    .markdown-content p { margin: 0.5rem 0; }
    .markdown-content strong { color: #ffffff; font-weight: 700; }
    .markdown-content em { color: #94a3b8; font-style: italic; }
    .markdown-content code { background: rgba(99, 102, 241, 0.2); padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; color: #a5b4fc; }
    .markdown-content pre { background: #0f172a; padding: 0.75rem; border-radius: 0.3rem; overflow-x: auto; margin: 0.75rem 0; }
    .markdown-content pre code { background: transparent; padding: 0; color: #e2e8f0; }
    .markdown-content ul, .markdown-content ol { margin: 0.5rem 0; padding-left: 1.5rem; }
    .markdown-content li { margin: 0.25rem 0; }
    .markdown-content blockquote { border-left: 3px solid #6366f1; padding-left: 0.75rem; margin: 0.75rem 0; color: #94a3b8; }
    .markdown-content a { color: #a5b4fc; text-decoration: underline; }
  </style>
</head>
<body class="min-h-screen p-8">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <header class="mb-8 pb-6 border-b border-slate-700">
      <h1 class="text-3xl font-bold text-white mb-2">${title}</h1>
      <p class="text-sm text-gray-400 mb-4">${subtitle}</p>
      <div class="flex flex-wrap gap-4 text-xs">
        <span class="text-gray-500">${t.export_timestamp}</span>
        <span class="text-white font-mono">${timestamp}</span>
      </div>
    </header>

    <!-- Config Note -->
    <section class="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <h3 class="text-sm font-bold text-indigo-400 mb-3">${t.export_config_note}</h3>
      <div id="configNoteContent" class="text-sm text-gray-300 markdown-content">
        ${configNote.trim() ? '' : '<p class="text-gray-500 italic">No comments</p>'}
      </div>
    </section>

    <!-- Budget Range -->
    <section class="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <h3 class="text-sm font-bold text-white mb-3">${t.export_budget_range}</h3>
      <div class="flex items-center gap-4 text-sm">
        <span class="text-gray-400">Min:</span>
        <span class="text-white font-mono">${budgetRange.min}</span>
        <span class="text-gray-400">Max:</span>
        <span class="text-white font-mono">${budgetRange.max}</span>
        <span class="text-gray-400">Step:</span>
        <span class="text-white font-mono">${budgetRange.step}</span>
      </div>
    </section>

    <!-- Stats Configuration -->
    <section class="mb-8">
      <h2 class="text-xl font-bold text-white mb-4">${t.export_stats_config}</h2>
      ${statsConfigHTML}
    </section>

    <!-- Strategy Phases -->
    ${phasesHTML}

    <!-- Charts -->
    <section class="mb-8">
      <h2 class="text-xl font-bold text-white mb-6">Charts</h2>
      
      <!-- Percent Trajectory Chart -->
      <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h3 class="text-sm font-bold text-purple-400 mb-4 uppercase">${t.export_chart_pct}</h3>
        <div class="h-[300px]"><canvas id="percentChart"></canvas></div>
      </div>

      <!-- Rating Trajectory Chart -->
      <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h3 class="text-sm font-bold text-blue-400 mb-4 uppercase">${t.export_chart_rating}</h3>
        <div class="h-[300px]"><canvas id="ratingChart"></canvas></div>
      </div>

      <!-- Yield Chart -->
      <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h3 class="text-sm font-bold text-yellow-500 mb-4 uppercase">${t.export_chart_yield}</h3>
        <div class="h-[300px]"><canvas id="yieldChart"></canvas></div>
      </div>

      <!-- Delta Chart -->
      <div class="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-6">
        <h3 class="text-sm font-bold text-cyan-400 mb-4 uppercase">${t.export_chart_delta}</h3>
        <div class="h-[300px]"><canvas id="deltaChart"></canvas></div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center text-xs text-gray-500 py-6 border-t border-slate-700">
      Generated by WoW Stat Solver
    </footer>
  </div>

  <script>
    // Render Markdown comments
    const configNoteContent = document.getElementById('configNoteContent');
    const configNoteText = ${JSON.stringify(configNote || '')};
    if (configNoteContent && configNoteText.trim()) {
      configNoteContent.innerHTML = marked.parse(configNoteText);
    }

    // Data from solver
    const labels = ${JSON.stringify(labels)};
    const data = {
      c: ${JSON.stringify(d.c)},
      h: ${JSON.stringify(d.h)},
      m: ${JSON.stringify(d.m)},
      v: ${JSON.stringify(d.v)},
      pcts: {
        c: ${JSON.stringify(d.pcts.c)},
        h: ${JSON.stringify(d.pcts.h)},
        m: ${JSON.stringify(d.pcts.m)},
        v: ${JSON.stringify(d.pcts.v)},
      },
      scores: ${JSON.stringify(d.scores)},
      smoothScores: ${JSON.stringify(smoothScores)},
    };

    const colors = {
      c: '#ef4444',
      h: '#22c55e',
      m: '#a855f7',
      v: '#3b82f6',
    };

    // Percent Chart
    new Chart(document.getElementById('percentChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Crit', data: data.pcts.c, borderColor: colors.c, tension: 0.3, pointRadius: 0 },
          { label: 'Haste', data: data.pcts.h, borderColor: colors.h, tension: 0.3, pointRadius: 0 },
          { label: 'Mastery', data: data.pcts.m, borderColor: colors.m, tension: 0.3, pointRadius: 0 },
          { label: 'Vers', data: data.pcts.v, borderColor: colors.v, tension: 0.3, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        },
      },
    });

    // Rating Chart
    new Chart(document.getElementById('ratingChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'Crit', data: data.c, borderColor: colors.c, tension: 0.3, pointRadius: 0 },
          { label: 'Haste', data: data.h, borderColor: colors.h, tension: 0.3, pointRadius: 0 },
          { label: 'Mastery', data: data.m, borderColor: colors.m, tension: 0.3, pointRadius: 0 },
          { label: 'Vers', data: data.v, borderColor: colors.v, tension: 0.3, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        },
      },
    });

    // Yield Chart
    new Chart(document.getElementById('yieldChart'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{ label: 'Total Yield', data: data.scores, borderColor: '#eab308', tension: 0.3, pointRadius: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        },
      },
    });

    // Delta Chart (using smoothScores for continuous delta)
    new Chart(document.getElementById('deltaChart'), {
      type: 'line',
      data: {
        labels: labels.slice(1),
        datasets: [{
          label: 'Marginal Delta',
          data: data.smoothScores.slice(1).map((v, i) => v - data.smoothScores[i]),
          borderColor: '#06b6d4',
          tension: 0.3,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#cbd5e1' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        },
      },
    });
  <\/script>
</body>
</html>`;
}
