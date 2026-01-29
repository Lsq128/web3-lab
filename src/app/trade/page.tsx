"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import {
  useBalance,
  useChainId,
  useConnection,
  useReadContract,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  formatEther,
  formatUnits,
  isAddress,
  parseEther,
  parseUnits,
} from "viem";
import { wagmiConfig } from "@/lib/web3/wagmi";
import { ERC20_ABI } from "@/lib/web3/abi/erc20";

type Mode = "native" | "erc20";

type PresetToken = {
  key: string;
  address: `0x${string}`;
  symbol: string;
  name: string;
};

// 预置 Token 列表（示例：mainnet / sepolia）
// 注意：请根据你的实际需求替换为你想支持的 Token。
const PRESET_TOKENS_BY_CHAIN: Record<number, PresetToken[]> = {
  // Ethereum Mainnet
  1: [
    {
      key: "usdc-mainnet",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      name: "USD Coin",
    },
    {
      key: "usdt-mainnet",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      symbol: "USDT",
      name: "Tether USD",
    },
  ],
  // Sepolia（这里示例一个常见的 USDC 测试合约地址）
  11155111: [
    {
      key: "usdc-sepolia",
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      symbol: "USDC",
      name: "USDC (Sepolia)",
    },
  ],
};

function shortHex(addr?: string) {
  if (!addr) return "-";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isValidAddress(value: string) {
  return isAddress(value as `0x${string}`);
}

export default function TradePage() {
  const { address, isConnected } = useConnection();
  const chainId = useChainId();

  const [mode, setMode] = useState<Mode>("native");
  const [toAddress, setToAddress] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [selectedTokenKey, setSelectedTokenKey] = useState<string>("custom");
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const presetTokens = useMemo(
    () => PRESET_TOKENS_BY_CHAIN[chainId] ?? [],
    [chainId],
  );

  // 当链或预置列表变化时，默认选中第一个 Token（如果存在）
  useEffect(() => {
    if (presetTokens.length > 0) {
      setSelectedTokenKey(presetTokens[0].key);
      setTokenAddress(presetTokens[0].address);
    } else {
      setSelectedTokenKey("custom");
      setTokenAddress("");
    }
  }, [presetTokens]);

  // Native balance
  const nativeBalance = useBalance({
    config: wagmiConfig,
    address,
    query: { enabled: !!address },
  });

  // ERC20 metadata & balance（仅在 ERC20 模式时启用）
  const tokenAddressValid = useMemo(
    () => mode === "erc20" && isValidAddress(tokenAddress),
    [mode, tokenAddress],
  );

  const tokenSymbol = useReadContract({
    config: wagmiConfig,
    address: tokenAddressValid ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: tokenAddressValid },
  });

  const tokenDecimals = useReadContract({
    config: wagmiConfig,
    address: tokenAddressValid ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: tokenAddressValid },
  });

  const tokenBalance = useReadContract({
    config: wagmiConfig,
    address: tokenAddressValid ? (tokenAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: tokenAddressValid && !!address },
  });

  const {
    data: nativeTxHash,
    sendTransaction,
    isPending: isSendingNative,
    error: nativeError,
  } = useSendTransaction({ config: wagmiConfig });

  const {
    data: erc20TxHash,
    writeContract,
    isPending: isSendingErc20,
    error: erc20WriteError,
  } = useWriteContract({ config: wagmiConfig });

  const nativeReceipt = useWaitForTransactionReceipt({
    config: wagmiConfig,
    hash: nativeTxHash,
    query: { enabled: !!nativeTxHash },
  });

  const erc20Receipt = useWaitForTransactionReceipt({
    config: wagmiConfig,
    hash: erc20TxHash,
    query: { enabled: !!erc20TxHash },
  });

  const isSending = mode === "native" ? isSendingNative : isSendingErc20;
  const txHash = mode === "native" ? nativeTxHash : erc20TxHash;
  const txReceipt = mode === "native" ? nativeReceipt : erc20Receipt;
  const txError = mode === "native" ? nativeError : erc20WriteError;

  const nativeBalanceFormatted = useMemo(() => {
    if (!nativeBalance.data) return "-";
    return `${formatEther(nativeBalance.data.value)} ${nativeBalance.data.symbol}`;
  }, [nativeBalance.data]);

  const tokenBalanceFormatted = useMemo(() => {
    if (!tokenBalance.data || !tokenDecimals.data) return "-";
    return `${formatUnits(tokenBalance.data as bigint, tokenDecimals.data)} ${
      tokenSymbol.data ?? "Token"
    }`;
  }, [tokenBalance.data, tokenDecimals.data, tokenSymbol.data]);

  function validateCommon() {
    if (!isConnected) {
      setFormError("请先连接钱包");
      return false;
    }
    if (!isValidAddress(toAddress)) {
      setFormError("请输入合法的目标地址");
      return false;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError("请输入大于 0 的金额");
      return false;
    }
    return true;
  }

  async function handleSendNative() {
    setFormError(null);
    if (!validateCommon()) return;

    try {
      const value = parseEther(amount);

      await sendTransaction({
        to: toAddress as `0x${string}`,
        value,
      });
    } catch (e: any) {
      setFormError(e?.shortMessage || e?.message || "发送失败，请稍后重试");
    }
  }

  async function handleSendErc20() {
    setFormError(null);
    if (!validateCommon()) return;

    if (!tokenAddressValid) {
      setFormError("请输入合法的 Token 合约地址");
      return;
    }
    if (!tokenDecimals.data) {
      setFormError("Token 信息加载中，请稍后再试");
      return;
    }

    try {
      const value = parseUnits(amount, tokenDecimals.data);

      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [toAddress as `0x${string}`, value],
      });
    } catch (e: any) {
      setFormError(e?.shortMessage || e?.message || "发送失败，请稍后重试");
    }
  }

  function handleSubmit() {
    if (mode === "native") {
      void handleSendNative();
    } else {
      void handleSendErc20();
    }
  }

  function handleMax() {
    if (mode === "native") {
      if (!nativeBalance.data) return;
      setAmount(formatEther(nativeBalance.data.value));
    } else {
      if (!tokenBalance.data || !tokenDecimals.data) return;
      setAmount(formatUnits(tokenBalance.data as bigint, tokenDecimals.data));
    }
  }

  const canSubmit =
    isConnected && isValidAddress(toAddress) && !!amount && !isSending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">交易 / 转账</h1>
        <p className="mt-1 text-sm text-white/60">
          从当前钱包向任意地址发送主币或 ERC20 Token。
        </p>
      </div>

      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="text-sm font-medium text-white/70">发送资产</div>
          <Chip
            size="sm"
            variant="flat"
            className="bg-white/5 text-white/70"
          >
            {isConnected ? `Chain ID: ${chainId}` : "未连接钱包"}
          </Chip>
        </CardHeader>
        <Divider className="bg-white/10" />
        <CardBody className="space-y-4">
          {!isConnected && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs text-yellow-100">
              检测到当前尚未连接钱包，请在页面右上角先连接你的钱包后再发起交易。
            </div>
          )}

          <Tabs
            selectedKey={mode}
            onSelectionChange={(k) => {
              setMode(k as Mode);
              setFormError(null);
            }}
            aria-label="Transfer type"
            variant="underlined"
            classNames={{
              tabList: "gap-6",
              cursor: "bg-white/40",
              tab: "text-white/70 data-[selected=true]:text-white",
            }}
          >
            <Tab key="native" title="主币 (ETH / 原生)" />
            <Tab key="erc20" title="ERC20 Token" />
          </Tabs>

          <div className="space-y-4 pt-1">
            <div className="space-y-1 text-xs text-white/60">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white/70">From</span>
                <span className="font-mono text-[11px] text-white/60">
                  {shortHex(address)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/50">余额</span>
                <span className="text-white/70">
                  {mode === "native"
                    ? nativeBalanceFormatted
                    : tokenBalanceFormatted}
                </span>
              </div>
            </div>

            {mode === "erc20" && (
              <div className="space-y-3">
                {presetTokens.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">
                      选择常用 Token
                    </div>
                    <Tabs
                      selectedKey={selectedTokenKey}
                      onSelectionChange={(k) => {
                        const key = String(k);
                        setSelectedTokenKey(key);
                        setFormError(null);
                        if (key === "custom") {
                          setTokenAddress("");
                          return;
                        }
                        const found = presetTokens.find(
                          (t) => t.key === key,
                        );
                        if (found) {
                          setTokenAddress(found.address);
                        }
                      }}
                      aria-label="Preset tokens"
                      variant="solid"
                      classNames={{
                        tabList:
                          "gap-2 bg-black/20 rounded-xl px-1 py-1",
                        cursor: "bg-white/20",
                        tab: "text-xs text-white/60 data-[selected=true]:text-white px-3 py-2",
                      }}
                    >
                      {presetTokens.map((token) => (
                        <Tab
                          key={token.key}
                          title={
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-medium">
                                {token.symbol}
                              </span>
                              <span className="text-[10px] text-white/50">
                                {token.name}
                              </span>
                            </div>
                          }
                        />
                      ))}
                      <Tab
                        key="custom"
                        title={
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-medium">
                              自定义
                            </span>
                            <span className="text-[10px] text-white/50">
                              其他合约地址
                            </span>
                          </div>
                        }
                      />
                    </Tabs>
                  </div>
                )}

                <Input
                  label="Token 合约地址"
                  labelPlacement="outside"
                  placeholder="输入 ERC20 Token 合约地址 (0x...) "
                  value={tokenAddress}
                  onValueChange={(v) => {
                    setTokenAddress(v.trim());
                    setSelectedTokenKey("custom");
                    setFormError(null);
                  }}
                  variant="flat"
                  classNames={{
                    inputWrapper:
                      "bg-white/5 border border-white/10",
                  }}
                />
              </div>
            )}

            <Input
              label="To"
              labelPlacement="outside"
              placeholder="输入接收方地址 (0x...) "
              value={toAddress}
              onValueChange={(v) => {
                setToAddress(v.trim());
                setFormError(null);
              }}
              variant="flat"
              classNames={{
                inputWrapper: "bg-white/5 border border-white/10",
              }}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Input
                  label="Amount"
                  labelPlacement="outside"
                  placeholder={
                    mode === "native"
                      ? "输入主币数量，例如 0.01"
                      : "输入 Token 数量"
                  }
                  type="number"
                  value={amount}
                  onValueChange={(v) => {
                    setAmount(v.trim());
                    setFormError(null);
                  }}
                  step="any"
                  min={0}
                  variant="flat"
                  classNames={{
                    inputWrapper: "bg-white/5 border border-white/10",
                  }}
                />
              </div>
              <Button
                size="sm"
                variant="flat"
                className="bg-white/10 text-white/80"
                onPress={handleMax}
                isDisabled={
                  mode === "native"
                    ? !nativeBalance.data
                    : !tokenBalance.data || !tokenDecimals.data
                }
              >
                Max
              </Button>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-100">
                {formError}
              </div>
            )}

            {txError && !formError && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-100">
                {(txError as any).shortMessage ||
                  txError.message ||
                  "交易提交失败"}
              </div>
            )}

            {txHash && (
              <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">交易哈希</span>
                  <span className="font-mono">{shortHex(txHash)}</span>
                </div>
                <div className="mt-1 text-[11px] text-white/50">
                  状态：{" "}
                  {txReceipt.isLoading
                    ? "等待上链..."
                    : txReceipt.isSuccess
                      ? "Success"
                      : txReceipt.isError
                        ? "Failed"
                        : "已提交"}
                </div>
              </div>
            )}

            <Button
              color="primary"
              className="mt-2 font-medium"
              onPress={handleSubmit}
              isDisabled={!canSubmit}
              isLoading={isSending || txReceipt.isLoading}
            >
              {isSending || txReceipt.isLoading
                ? "发送中..."
                : mode === "native"
                  ? "发送主币"
                  : "发送 ERC20"}
            </Button>

            <div className="pt-1 text-[11px] text-white/40">
              提示：当前实现支持发送原生主币和任意 ERC20 Token。
              更复杂的 swap / 聚合交易可在后续接入
              Uniswap / 0x / 1inch 等协议。
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

