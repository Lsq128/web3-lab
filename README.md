## Web3 Lab Frontend

一个基于 Next.js App Router 的 Web3 学习 / 实验前端项目，用来练习钱包连接、链上查询、简单转账等常见场景。

> 仓库地址：[`https://github.com/Lsq128/web3-lab`](https://github.com/Lsq128/web3-lab)

---

## 功能概览

- **概览 / Dashboard**
  - 项目首页与整体入口。

- **交易 / Trade**
  - 从当前连接钱包发送主币（ETH / 原生货币）到任意地址。
  - 使用 wagmi + viem，支持：
    - 主币转账：`useSendTransaction`。
    - ERC20 转账：`useWriteContract + ERC20_ABI.transfer`。
  - ERC20 Token：
    - 通过预置列表选择常用 Token。
    - 或输入任意 ERC20 合约地址。

- **链上查询 / Explorer**
  - 根据输入自动识别类型：
    - 交易哈希（Tx Hash）
    - 地址（Address）
    - 区块号（Block Number）
  - 使用 wagmi / viem 查询：
    - 交易详情（Tx + Receipt）
    - 地址余额、是否合约地址
    - 区块信息
  - 通过本地 API Route 代理 Etherscan，获取地址的最近交易列表。

---

## 技术栈

- **框架**：Next.js (App Router)
- **UI**：[@heroui/react](https://heroui.dev/) + 自定义 Tailwind 风格
- **Web3**：
  - [`wagmi`](https://wagmi.sh/)：钱包连接、读写合约、交易发送
  - [`@rainbow-me/rainbowkit`](https://www.rainbowkit.com/)：钱包选择与连接按钮
  - [`viem`](https://viem.sh/)：类型安全的 EVM RPC & 工具方法（`parseEther` / `formatUnits` 等）
- **数据请求**：`@tanstack/react-query`（主要用于 explorer 页面）

---

## 本地开发

### 1. 安装依赖

项目使用 pnpm，

```bash
pnpm install
```

### 2. 环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_APP_NAME="Web3 Lab"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"
ETHERSCAN_API_KEY_MAINNET="your_mainnet_etherscan_key"
ETHERSCAN_API_KEY_SEPOLIA="your_sepolia_etherscan_key"
```

具体变量请参考 `src/lib/env.ts` 中的定义。

### 3. 启动开发服务器

```bash
pnpm dev
```

浏览器打开 `http://localhost:3000`，即可看到前端页面。

---

## 目录结构（简要）

```text
src/
  app/
    page.tsx          // 首页 / Dashboard
    trade/page.tsx    // 交易（主币 + ERC20 转账）
    explorer/page.tsx // 链上查询
    api/
      explorer/txlist/route.ts // 代理 Etherscan 的地址交易列表接口
    layout.tsx        // App Shell 布局
    providers.tsx     // 全局 Provider（wagmi / RainbowKit / React Query 等）

  components/
    layout/AppShell.tsx // 顶部导航 + 侧边栏布局

  lib/
    env.ts           // 环境变量读取与校验
    logger.ts        // 简单日志工具
    web3/
      wagmi.ts       // wagmi + RainbowKit 统一配置
      abi/erc20.ts   // 通用 ERC20 ABI
```

---

## 开源与贡献

该项目主要用于个人学习

- 仓库地址：`https://github.com/Lsq128/web3-lab`

