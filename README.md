# WoW Stat Solver (魔兽世界绿字收益计算器)

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A specialized calculator utilizing **Greedy Algorithm** and **Segmented Fitting** (Linear/Quadratic) to calculate the optimal secondary stat distribution for World of Warcraft.

[中文说明](#中文说明) | [English](#english)

---

## 🌟 Features (功能亮点)

*   **Greedy Solver**: Iteratively finds the highest yield stat distribution for a given budget.
*   **SimC Import**: Drag & drop SimulationCraft `dps_plot` files to auto-fit stat weights (Linear or Quadratic regression).
*   **Diminishing Returns (DR)**: Fully implements Blizzard's stat tier penalties (30%, 39%, 47%, 54%).
*   **Trajectory Mode**: Visualize how your optimal stats evolve as your gear level increases.
*   **Privacy First**: Runs entirely in your browser. No data is sent to any server.

---

## 🚀 Usage (使用方式)

This project provides two editions suitable for different scenarios.
本项目提供两个版本，适用于不同场景。

### 1. Online Version (在线版)
> Best for PC/Mobile users with internet access. Lightweight.
> 适合有网络的 PC/手机用户。体积小，加载快。

*   **[Click here to use Online Version](OnlineVersion/index.html)** 
    *   *(Note: This link works if viewed on a deployed static site or local server)*

### 2. Local Version (离线版)
> Best for playing without internet or archiving. Zero dependencies.
> 适合无网环境、副本中或通过 U盘 携带。零外部依赖。

*   **Download**: Go to [Releases](../../releases) page and download `LocalVersion.zip`.
*   **Run**: Unzip and double-click `index.html`. 

---

## 📂 Project Structure (项目结构)

*   **`OnlineVersion/`**: Relies on public CDNs (Tailwind, Chart.js, Fonts). Use this for web deployment.
*   **`LocalVersion/`**: Self-contained. All libraries, fonts, and CSS are vendorized locally.
*   **`PROJECT_STATUS.md`**: Development log and architecture notes.

## 🛠️ Tech Stack

*   **Core**: Vanilla JavaScript (ES6+)
*   **UI**: Tailwind CSS (Script/CDN)
*   **Math**: KaTeX (Formula rendering)
*   **Viz**: Chart.js (Data visualization)

---

## 📜 License

This project is open-source. Feel free to modify and distribute.
