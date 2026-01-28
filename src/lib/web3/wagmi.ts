import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia } from "wagmi/chains";
import { env } from "@/lib/env";

/**
 * wagmi + RainbowKit 的统一配置（App Router / Client Providers 使用）
 *
 * 注意：
 * - WalletConnect 必须提供 projectId，否则部分钱包连接不可用
 * - 这里先默认 mainnet + sepolia，后续你学 BSC/Polygon/Arbitrum 再加进来即可
 */
export const wagmiConfig = getDefaultConfig({
  appName: env.NEXT_PUBLIC_APP_NAME,
  projectId: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, sepolia],
  ssr: true,
});

