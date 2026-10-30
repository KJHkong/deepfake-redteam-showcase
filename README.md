# DeepFake Redteam Attacker — Public Showcase

A research-oriented framework integrating face swapping, source-aware facial editing, modular image refinement, and detector-based evaluation.

这是 Dual-Branch Generation Pipeline v0.2 的独立静态展示项目，保留原 Demo 的深色 UI、最终架构图与已批准案例。网站只读取本目录的静态 JSON 和图片，无上传、实时推理、密钥或模型依赖。

## 功能与页面

- `/`：原架构图的12个可点击热点；Swapping / Editing 预计算交互；方法引用。
- `/swapping/`：InSwapper、SimSwap、BlendFace 与真实历史案例。
- `/source-analyzer/`：HOG / LivePortrait / NISP CPU 的历史Source观测。
- `/editing/`：五类动作、Source Rule Filter 与冻结数值Profile；文本只作语义记录。
- `/modifier/`：8类图像算子的真实前后对照和参数。
- `/detector/`：历史预测与独立离线九档阈值扫描。

保留25个原展示案例、56张经元数据清理的图像，以及原架构图。交互Demo使用其中3个Swapping和5个Editing案例，**并不覆盖任意Source/Target/工具/动作组合**；未保存的组合显示 `No precomputed sample available`，不以其他结果替代。

有Modifier的案例支持查看Generator原图和实际Modified Final。选择Generator-only时，不借用Modified Final的Gate1或Detector评分。所有结果均标记 `Precomputed Demo` / `Offline-generated Sample`。

## 技术栈与运行

原生 HTML / CSS / JavaScript / SVG，Node.js 22+，无npm第三方依赖，无需安装Python或推理后端。

在本目录运行：

```bash
npm test
npm run build
npm run preview
```

预览命令会打印开发机本地访问地址；默认端口4173，`PORT`环境变量可调整。远程开发时通过编辑器端口转发访问。预览服务只用于开发，部署后不需要常驻Node进程。

生产产物：`dist/`。可将其直接交给任意静态HTTP托管；页面通过静态文件加载，直接用文件管理器打开HTML不属于支持的预览方式。

`npm run check`检查静态案例、路径与敏感内容；`npm test`覆盖精确匹配、缺失组合、分数归属、25案例完整性及字体许可。`src/_headers`为静态托管提供CSP等响应头；不包含Functions、Worker或后台接口。

## Cloudflare Pages（审核通过后操作）

1. 将**本目录内容**单独作为新GitHub仓库根目录，勿上传原实验仓库、其Git历史或工作区。
2. 在Cloudflare Pages创建项目，授权连接这个新仓库。
3. Framework preset：`None`；Build command：`npm run build`；Build output：`dist`；Node版本22（已提供`.node-version`）。
4. 查看Preview Deployment并人工验收，再决定生产发布和域名。

无需API Key、推理服务配置或Wrangler配置。当前仅完成本地准备，**尚未创建GitHub仓库、Push、关联Cloudflare或公开部署**。

官方说明：[Static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) · [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/) · [Custom headers](https://developers.cloudflare.com/pages/configuration/headers/)。

## References / Official Sources

| Method | Paper / reference | Authors | Year / venue | Official sources |
|---|---|---|---|---|
| InSwapper | Official Implementation / Model Reference；未确认独立对应论文 | InsightFace contributors | 实现/模型来源 | [Official implementation](https://github.com/deepinsight/insightface/tree/master/examples/in_swapper) |
| SimSwap | SimSwap: An Efficient Framework For High Fidelity Face Swapping | Renwang Chen, Xuanhong Chen, Bingbing Ni, Yanhao Ge | ACM Multimedia 2020；arXiv于2021年提交 | [Paper](https://arxiv.org/abs/2106.06340) · [Repo](https://github.com/neuralchen/SimSwap) |
| BlendFace | BlendFace: Re-designing Identity Encoders for Face-Swapping | Kaede Shiohara, Xingchao Yang, Takafumi Taketomi | ICCV 2023 | [Paper](https://arxiv.org/abs/2307.10854) · [Repo](https://github.com/mapooon/BlendFace) |
| LivePortrait | LivePortrait: Efficient Portrait Animation with Stitching and Retargeting Control | Jianzhu Guo, Dingyun Zhang, Xiaoqiang Liu, Zhizhou Zhong, Yuan Zhang, Pengfei Wan, Di Zhang | arXiv 2024，2025修订 | [Paper](https://arxiv.org/abs/2407.03168) · [Project](https://liveportrait.github.io/) · [Repo](https://github.com/KlingAIResearch/LivePortrait) |

LivePortrait原KwaiVGI地址现重定向至KlingAIResearch。论文引用不代表第三方代码或权重可重新分发；本项目不包含它们。Noto字体单独沿用[OFL](third_party/NotoSans-OFL.txt)，没有给整个项目添加MIT等开源许可证。

## Responsible Use

仅供授权研究、红队评估和透明的工程展示。请勿用于冒充、欺骗或未经同意的人像用途。展示素材的批准范围不构成任意再分发许可。

Detector prediction is not equivalent to attack success. 历史分数不代表身份保持、动作完成或自然度合格。实验阈值未被确认为生产阈值；Source规则仍为受控输入下的启发式，未宣称自主Agent、强化学习或通用生产校准。
