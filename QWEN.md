## Qwen Added Memories
- WOW stat solver 项目当前版本为 v1.5.0-MID，核心算法数据包括：四绿字转化率 (爆击 45.99/急速 44.01/精通 45.99/全能 53.97)，DR 效率表 (30%@1.0, 40%@0.9, 50%@0.8, 60%@0.7, 80%@0.6, 200%@0.5)，贪婪算法步长 [20, 1]，预算滑块范围 1000-20000，成长轨迹采样步长 200，SimC 拟合 R²阈值 0.99，策略阶段识别阈值 (单一 70%/双修 85%)
- WOW stat solver 项目 TWW_backup 文件夹已创建于 D:\QwenCLI\WOW stat solver\TWW_backup，包含 13 个核心文件的.bak 备份 (LocalVersion 和 OnlineVersion 的 js 文件 + index.html)，以及 variable_to_modify.txt 配置清单文档
- SimC 导入解析逻辑保持原始版本：使用正则表达式 `/-?[\d,.]+(?:e[+-]?\d+)?/gi` 匹配数值，不处理 Excel 保存后的格式变化
