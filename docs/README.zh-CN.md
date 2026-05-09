<h1 align="center">animo</h1>
<p align="center">让编程 Agent 循环运行，每次迭代生成一个提交。</p>

<p align="center">
  <a href="https://www.npmjs.com/package/animo"
    ><img
      alt="npm"
      src="https://img.shields.io/npm/v/animo?style=flat-square"
  /></a>
  <a href="https://github.com/zhujjotw/animo/actions/workflows/ci.yml"
    ><img
      alt="CI"
      src="https://img.shields.io/github/actions/workflow/status/zhujjotw/animo/ci.yml?style=flat-square&label=ci"
  /></a>
  <a
    href="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square"
    ><img
      alt="Platform"
      src="https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue?style=flat-square"
  /></a>
</p>

<p align="center">
  <img src="docs/splash.png" alt="animo — Good Night, Have Fun" width="800">
</p>

**animo** 是 [gnhf](https://github.com/kunchenguid/gnhf) 的一个增强分支，保留了 gnhf 的核心编排能力（循环驱动 Agent、自动提交/回滚、多 Agent 支持、worktree 并发），并在此基础上增加了丰富的终端视觉效果，让长时间的自动化编码过程更加有趣。

> gnhf 的完整文档请参考 [原项目 README](https://github.com/kunchenguid/gnhf#readme)。

## 相比 gnhf 的主要改造

### 终端宠物系统 (Pet)

每次启动时，animo 会在终端中展示一个像素风格的宠物。宠物从一颗蛋开始，经过抖动、裂纹、孵化动画，最终诞生为一只小动物（鸭子、猫咪、兔子等），随后以空闲动画陪伴整个运行过程。

- 孵化动画随机选择宠物种类
- 支持 ASCII 像素帧动画
- 宠物显示在 TUI 的状态面板中

### 主题背景动画

animo 提供三种动态终端背景主题，在 Agent 运行期间持续渲染：

- **Mario** — 经典超级马里奥风格的云朵、砖块、管道，从右向左滚动
- **Tetris** — 俄罗斯方块风格的方块下落与堆叠动画
- **Retro** — 复古游戏风格，包含龙、太空侵略者、吃豆人、塞尔达等像素精灵，随机切换场景

背景主题可通过配置选择，与原有流星雨效果共存。

### 渲染器增强

- 改进了 TUI 帧差分算法，支持宠物和背景动画的单元格级渲染
- 优化了终端刷新性能，减少闪烁
- 宠物、背景、流星雨三套动画系统可同时运行

### 其他改进

- 项目重命名为 `animo`（npm 包名、CLI 命令、配置目录 `~/.animo/`）
- 同步跟踪 gnhf 上游的所有 bug 修复和功能更新

## 快速开始

```sh
# 安装
npm install -g animo

# 运行（使用默认 Agent Claude Code）
animo "重构代码，降低复杂度但不改变功能"
```

```sh
# 指定迭代次数和 token 上限
animo "为所有模块添加单元测试" \
    --max-iterations 10 \
    --max-tokens 5000000
```

```sh
# 使用 worktree 并行运行多个 Agent
animo --worktree "实现功能 X" &
animo --worktree "添加模块 Y 的测试" &
animo --worktree "重构 API 层" &
```

从源码安装：

```sh
git clone https://github.com/zhujjotw/animo.git
cd animo
npm install
npm run build
npm link
```

## 配置

配置文件位于 `~/.animo/config.yml`，首次运行时自动创建。

```yaml
# 默认 Agent（支持 claude, codex, rovodev, opencode, copilot, pi, 或 acp:<target>）
agent: claude

# 防止系统休眠
preventSleep: true

# 连续失败上限
maxConsecutiveFailures: 3
```

更多配置项（Agent 路径覆盖、参数覆盖、提交消息格式等）请参考 [原项目文档](https://github.com/kunchenguid/gnhf#configuration)。

## CLI 参考

| 命令 | 说明 |
|------|------|
| `animo "<prompt>"` | 启动新的自动化运行 |
| `animo` | 恢复已有运行（在 animo/ 分支上） |
| `echo "<prompt>" \| animo` | 通过管道传入 prompt |
| `cat prd.md \| animo` | 通过管道传入大型需求文档 |

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--agent <agent>` | 选择 Agent | config 文件（`claude`） |
| `--max-iterations <n>` | 最大迭代次数 | 无限制 |
| `--max-tokens <n>` | 最大 token 用量 | 无限制 |
| `--stop-when <cond>` | 满足条件时停止 | 无限制 |
| `--worktree` | 在独立 worktree 中运行 | `false` |
| `--current-branch` | 在当前分支上运行 | `false` |
| `--push` | 每次成功迭代后推送 | `false` |
| `--prevent-sleep <mode>` | 防止系统休眠 | config 文件（`on`） |
| `--meteor-frequency <n>` | 流星频率 (0-5) | `3` |

## 支持的 Agent

animo 继承了 gnhf 对以下 Agent 的支持：

| Agent | 标记 |
|-------|------|
| Claude Code | `--agent claude` |
| Codex | `--agent codex` |
| GitHub Copilot CLI | `--agent copilot` |
| Pi | `--agent pi` |
| Rovo Dev | `--agent rovodev` |
| OpenCode | `--agent opencode` |
| ACP 目标 | `--agent acp:<target>` |

## 致谢

animo 基于 [kunchenguid/gnhf](https://github.com/kunchenguid/gnhf) 开发，感谢原作者的工作。

## 许可证

继承自 gnhf 上游项目。
