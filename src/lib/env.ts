/**
 * 统一读取环境变量（客户端代码不要直接引用敏感变量）
 */
export const env = {
  // Next.js 仅会向客户端暴露以 NEXT_PUBLIC_ 开头的变量
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "web3-front",
} as const;

