/**
 * 统一读取环境变量（客户端代码不要直接引用敏感变量）
 */
export const env = {
  // Next.js 仅会向客户端暴露以 NEXT_PUBLIC_ 开头的变量
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "web3-lab",

  // WalletConnect Cloud 项目 ID（RainbowKit / wagmi 连接钱包需要）
  // 申请： https://cloud.walletconnect.com/
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",

  // Etherscan API Key
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY ?? "",
} as const;
