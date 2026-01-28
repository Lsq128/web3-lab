"use client";

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
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  useBlock,
  useChainId,
  usePublicClient,
  useTransaction,
  useTransactionReceipt,
  useBalance,
} from "wagmi";
import { formatEther, formatGwei } from "viem";
import { wagmiConfig } from "@/lib/web3/wagmi";

type QueryKind = "tx" | "address" | "block" | "unknown";

function detectKind(raw: string): QueryKind {
  const q = raw.trim();
  if (!q) return "unknown";

  // block number
  if (/^\d+$/.test(q)) return "block";

  // 0x-prefixed hex: tx hash / block hash / address
  if (/^0x[0-9a-fA-F]+$/.test(q)) {
    if (q.length === 42) return "address";
    if (q.length === 66) return "tx";
  }

  return "unknown";
}

function shortHex(hex?: string) {
  if (!hex) return "-";
  if (hex.length <= 14) return hex;
  return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
}

function fmtDateTime(tsSeconds?: bigint) {
  if (!tsSeconds) return "-";
  const ms = Number(tsSeconds) * 1000;
  if (!Number.isFinite(ms)) return "-";
  return new Date(ms).toLocaleString();
}

function fmtEth(value?: bigint, digits = 6) {
  if (value === undefined) return "-";
  const n = Number(formatEther(value));
  if (!Number.isFinite(n)) return formatEther(value);
  return n.toFixed(digits);
}

function fmtGwei(value?: bigint, digits = 2) {
  if (value === undefined) return "-";
  const n = Number(formatGwei(value));
  if (!Number.isFinite(n)) return formatGwei(value);
  return n.toFixed(digits);
}

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"tx" | "address" | "block">("tx");
  const [addressTxPage, setAddressTxPage] = useState(1);
  const addressTxPageSize = 10;

  const kind = useMemo(() => detectKind(query), [query]);
  const hint = useMemo(() => {
    if (!query.trim()) return "支持：Tx Hash / Address / Block Number（自动识别）";
    if (kind === "tx") return "已识别为：交易哈希（Tx Hash）";
    if (kind === "address") return "已识别为：地址（Address）";
    if (kind === "block") return "已识别为：区块号（Block Number）";
    return "未识别类型：请检查输入格式";
  }, [kind, query]);

  useEffect(() => {
    if (kind === "tx" || kind === "address" || kind === "block") setActiveTab(kind);
  }, [kind]);

  const chainId = useChainId();
  const publicClient = usePublicClient({ config: wagmiConfig });

  const txHash = useMemo(() => {
    if (kind !== "tx") return undefined;
    const q = query.trim();
    return (q.length === 66 ? (q as `0x${string}`) : undefined);
  }, [kind, query]);

  const address = useMemo(() => {
    if (kind !== "address") return undefined;
    const q = query.trim();
    return (q.length === 42 ? (q as `0x${string}`) : undefined);
  }, [kind, query]);

  const normalizedAddress = address?.toLowerCase();
  // 地址变更时重置交易列表页码
  useEffect(() => {
    setAddressTxPage(1);
  }, [normalizedAddress]);

  const blockNumber = useMemo(() => {
    if (kind !== "block") return undefined;
    const q = query.trim();
    if (!/^\d+$/.test(q)) return undefined;
    try {
      return BigInt(q);
    } catch {
      return undefined;
    }
  }, [kind, query]);

  // Tx
  const tx = useTransaction({
    config: wagmiConfig,
    hash: txHash,
    query: { enabled: !!txHash },
  });
  const receipt = useTransactionReceipt({
    config: wagmiConfig,
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Block
  const block = useBlock({
    config: wagmiConfig,
    blockNumber,
    query: { enabled: blockNumber !== undefined },
  });

  // Address
  const balance = useBalance({
    config: wagmiConfig,
    address,
    query: { enabled: !!address },
  });

  const bytecodeQuery = useQuery({
    queryKey: ["bytecode", chainId, address] as const,
    enabled: !!address,
    queryFn: async () => {
      if (!publicClient || !address) return null;
      const code = await publicClient.getBytecode({ address });
      // React Query 不允许返回 undefined，这里统一成 null / "0x"
      return code ?? "0x";
    },
  });
  const isContract = !!bytecodeQuery.data && bytecodeQuery.data !== "0x";

  // 地址交易列表（通过 /api/explorer/txlist 代理 Etherscan）
  type AddressTxListItem = {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    isError?: string;
    txreceipt_status?: string;
  };

  const addressTxList = useQuery({
    queryKey: ["addressTxList", chainId, address, addressTxPage, addressTxPageSize] as const,
    enabled: !!address && activeTab === "address",
    queryFn: async () => {
      if (!address) return { items: [] as AddressTxListItem[] };
      const params = new URLSearchParams({
        address,
        chainId: String(chainId),
        page: String(addressTxPage),
        offset: String(addressTxPageSize),
        sort: "desc",
      });
      const res = await fetch(`/api/explorer/txlist?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        ok: boolean;
        items?: AddressTxListItem[];
        error?: string;
      };
      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch tx list");
      }
      return { items: data.items ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">链上查询</h1>
        <p className="mt-1 text-sm text-white/60">
          输入 Tx / 地址 / 区块号，快速查看链上数据。
        </p>
      </div>

      {/* 统一搜索框 */}
      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="text-sm font-medium text-white/70">快速查询</div>
          <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
            Auto-detect
          </Chip>
        </CardHeader>
        <Divider className="bg-white/10" />
        <CardBody className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onValueChange={setQuery}
              placeholder="输入 Tx Hash / Address / Block Number"
              variant="flat"
              classNames={{
                base: "flex-1",
                inputWrapper: "bg-white/5 border border-white/10",
              }}
            />
            <Button
              size="md"
              variant="flat"
              className="bg-white/5 text-white/90"
              onPress={() => {
                // 当前先做 UI：点击后会根据识别类型切换 tab
                const k = detectKind(query);
                if (k === "tx" || k === "address" || k === "block") setActiveTab(k);
              }}
              isDisabled={!query.trim()}
            >
              查询
            </Button>
          </div>

          <div className="text-xs text-white/50">{hint}</div>
        </CardBody>
      </Card>

      {/* 结果区 Tabs */}
      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/70">查询结果</div>
            <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
              UI Skeleton
            </Chip>
          </div>
        </CardHeader>
        <Divider className="bg-white/10" />
        <CardBody className="space-y-4">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(k) => setActiveTab(String(k) as typeof activeTab)}
            aria-label="Explorer Tabs"
            variant="underlined"
            classNames={{
              tabList: "gap-6",
              cursor: "bg-white/40",
              tab: "text-white/70 data-[selected=true]:text-white",
            }}
          >
            <Tab key="tx" title="交易 Tx">
              <div className="space-y-4 pt-2">
                <Card className="border border-white/10 bg-white/5">
                  <CardHeader className="flex items-center justify-between pb-2">
                    <div className="text-sm font-medium text-white/70">交易概要</div>
                    <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
                      {tx.isLoading || receipt.isLoading
                        ? "加载中"
                        : tx.isError || receipt.isError
                          ? "查询失败"
                          : kind === "tx"
                            ? "已识别"
                            : "占位"}
                    </Chip>
                  </CardHeader>
                  <Divider className="bg-white/10" />
                  <CardBody className="space-y-3">
                    {(tx.isError || receipt.isError) && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        查询失败：请确认 Tx Hash 是否正确，以及当前网络是否包含该交易。
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Tx Hash
                        </div>
                        <div className="mt-1 font-mono text-sm text-white/90">
                          {kind === "tx" ? query.trim() : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Status
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {receipt.data
                            ? receipt.data.status === "success"
                              ? "Success"
                              : receipt.data.status === "reverted"
                                ? "Reverted"
                                : String(receipt.data.status)
                            : tx.isLoading || receipt.isLoading
                              ? "Loading..."
                              : "Unknown"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          From → To
                        </div>
                        <div className="mt-1 font-mono text-sm text-white/70">
                          {shortHex(tx.data?.from)} → {shortHex(tx.data?.to ?? undefined)}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Value / Gas
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          <div>
                            Value: {fmtEth(tx.data?.value)} ETH
                          </div>
                          <div className="text-white/50">
                            Gas Used:{" "}
                            {receipt.data?.gasUsed !== undefined
                              ? receipt.data.gasUsed.toString()
                              : "-"}
                            {"  "}
                            | Effective Gas Price:{" "}
                            {receipt.data?.effectiveGasPrice !== undefined
                              ? `${fmtGwei(receipt.data.effectiveGasPrice)} gwei`
                              : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:col-span-2">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Block / Time / Fee
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          <div>
                            Block:{" "}
                            {receipt.data?.blockNumber !== undefined
                              ? receipt.data.blockNumber.toString()
                              : tx.data?.blockNumber !== undefined
                                ? tx.data.blockNumber.toString()
                                : "-"}
                          </div>
                          <div className="text-white/50">
                            Fee:{" "}
                            {receipt.data?.gasUsed !== undefined &&
                            receipt.data?.effectiveGasPrice !== undefined
                              ? `${fmtEth(
                                  receipt.data.gasUsed * receipt.data.effectiveGasPrice,
                                  6
                                )} ETH`
                              : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-white/10 bg-white/5">
                  <CardHeader className="flex items-center justify-between pb-2">
                    <div className="text-sm font-medium text-white/70">Input & Logs</div>
                    <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
                      后续增强
                    </Chip>
                  </CardHeader>
                  <Divider className="bg-white/10" />
                  <CardBody className="space-y-2 text-sm text-white/70">
                    <div> - Input Data 解码（方法名 + 参数）</div>
                    <div> - Events / Logs 列表（支持 raw / decoded）</div>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="address" title="地址 Address">
              <div className="space-y-4 pt-2">
                <Card className="border border-white/10 bg-white/5">
                  <CardHeader className="flex items-center justify-between pb-2">
                    <div className="text-sm font-medium text-white/70">地址概览</div>
                    <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
                      {balance.isLoading || bytecodeQuery.isLoading
                        ? "加载中"
                        : balance.isError || bytecodeQuery.isError
                          ? "查询失败"
                          : kind === "address"
                            ? "已识别"
                            : "占位"}
                    </Chip>
                  </CardHeader>
                  <Divider className="bg-white/10" />
                  <CardBody className="space-y-3">
                    {(balance.isError || bytecodeQuery.isError) && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        查询失败：请确认 Address 是否正确，以及当前网络 RPC 是否可用。
                      </div>
                    )}
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-white/40">
                        Address
                      </div>
                      <div className="mt-1 font-mono text-sm text-white/90">
                        {kind === "address" ? query.trim() : "-"}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Type
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {address
                            ? bytecodeQuery.isLoading
                              ? "Loading..."
                              : isContract
                                ? "Contract"
                                : "EOA"
                            : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Balance
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {balance.data
                            ? `${fmtEth(balance.data.value, 6)} ${balance.data.symbol}`
                            : balance.isLoading
                              ? "Loading..."
                              : "-"}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-white/10 bg-white/5">
                  <CardHeader className="flex items-center justify-between pb-2">
                    <div className="text-sm font-medium text-white/70">最近交易历史</div>
                    <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
                      {addressTxList.isLoading
                        ? "加载中"
                        : addressTxList.isError
                          ? "加载失败"
                          : `${addressTxList.data?.items.length ?? 0} 条`}
                    </Chip>
                  </CardHeader>
                  <Divider className="bg-white/10" />
                  <CardBody className="space-y-3 text-sm text-white/70">
                    {(!address || kind !== "address") && (
                      <div className="text-xs text-white/50">
                        输入一个地址（Address）后，将在这里展示该地址最近的交易记录。
                      </div>
                    )}

                    {address && addressTxList.isError && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                        加载交易历史失败：请检查当前网络是否支持（Mainnet / Sepolia），以及
                        Etherscan API Key 是否配置正确。
                      </div>
                    )}

                    {address &&
                      !addressTxList.isLoading &&
                      !addressTxList.isError &&
                      addressTxList.data?.items.length === 0 && (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                          暂无交易记录（或该地址在当前网络上还没有发生过交易）。
                        </div>
                      )}

                    {address &&
                      addressTxList.data?.items &&
                      addressTxList.data.items.length > 0 && (
                        <div className="space-y-2">
                          <div className="rounded-lg border border-white/10 bg-black/20">
                            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.5fr)] gap-2 border-b border-white/10 px-3 py-2 text-[11px] uppercase tracking-wide text-white/40">
                              <div>Tx</div>
                              <div>From → To</div>
                              <div>Value (ETH)</div>
                              <div>Time</div>
                            </div>
                            <div className="divide-y divide-white/10">
                              {addressTxList.data.items.map((txItem) => {
                                const ts = BigInt(txItem.timeStamp || "0");
                                const isError =
                                  txItem.isError === "1" || txItem.txreceipt_status === "0";
                                return (
                                  <div
                                    key={txItem.hash}
                                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.5fr)] gap-2 px-3 py-2 text-xs text-white/80"
                                  >
                                    <div className="truncate font-mono">
                                      {shortHex(txItem.hash)}
                                    </div>
                                    <div className="truncate font-mono text-[11px] text-white/70">
                                      {shortHex(txItem.from)} → {shortHex(txItem.to)}
                                    </div>
                                    <div className="truncate">
                                      {fmtEth(BigInt(txItem.value || "0"), 6)}
                                      {isError && (
                                        <span className="ml-1 rounded bg-red-500/20 px-1 text-[10px] text-red-200">
                                          Failed
                                        </span>
                                      )}
                                    </div>
                                    <div className="truncate text-[11px] text-white/60">
                                      {fmtDateTime(ts)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs text-white/50">
                            <span>
                              第 {addressTxPage} 页，每页 {addressTxPageSize} 条
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="light"
                                className="h-7 min-w-0 px-2 text-xs"
                                isDisabled={addressTxPage <= 1 || addressTxList.isFetching}
                                onPress={() => {
                                  if (addressTxPage > 1) setAddressTxPage(addressTxPage - 1);
                                }}
                              >
                                上一页
                              </Button>
                              <Button
                                size="sm"
                                variant="light"
                                className="h-7 min-w-0 px-2 text-xs"
                                isDisabled={
                                  addressTxList.isFetching ||
                                  (addressTxList.data?.items.length ?? 0) < addressTxPageSize
                                }
                                onPress={() => {
                                  if (
                                    addressTxList.data &&
                                    addressTxList.data.items.length >= addressTxPageSize
                                  ) {
                                    setAddressTxPage(addressTxPage + 1);
                                  }
                                }}
                              >
                                下一页
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="block" title="区块 Block">
              <div className="space-y-4 pt-2">
                <Card className="border border-white/10 bg-white/5">
                  <CardHeader className="flex items-center justify-between pb-2">
                    <div className="text-sm font-medium text-white/70">区块概要</div>
                    <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
                      {block.isLoading
                        ? "加载中"
                        : block.isError
                          ? "查询失败"
                          : kind === "block"
                            ? "已识别"
                            : "占位"}
                    </Chip>
                  </CardHeader>
                  <Divider className="bg-white/10" />
                  <CardBody className="space-y-3">
                    {block.isError && (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                        查询失败：请确认区块号是否存在于当前网络。
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Block Number
                        </div>
                        <div className="mt-1 font-mono text-sm text-white/90">
                          {kind === "block" ? query.trim() : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Timestamp
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {block.data ? fmtDateTime(block.data.timestamp) : block.isLoading ? "Loading..." : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Tx Count
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {block.data ? block.data.transactions.length : block.isLoading ? "Loading..." : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Gas Used / Limit
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          {block.data
                            ? `${block.data.gasUsed.toString()} / ${block.data.gasLimit.toString()}`
                            : block.isLoading
                              ? "Loading..."
                              : "-"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:col-span-2">
                        <div className="text-[11px] uppercase tracking-wide text-white/40">
                          Hash / Miner
                        </div>
                        <div className="mt-1 text-sm text-white/70">
                          <div className="font-mono text-xs text-white/70">
                            Hash: {block.data?.hash ?? "-"}
                          </div>
                          <div className="font-mono text-xs text-white/50">
                            Miner: {block.data?.miner ?? "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card className="border border-white/10 bg-white/5">
                  <CardHeader className="flex items-center justify-between pb-2">
                    <div className="text-sm font-medium text-white/70">区块内交易</div>
                    <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
                      Coming soon
                    </Chip>
                  </CardHeader>
                  <Divider className="bg-white/10" />
                  <CardBody className="space-y-2 text-sm text-white/70">
                    <div> - 展示区块内 Tx 列表（hash、from/to、value、状态）</div>
                    <div> - 点击条目跳转到 Tx 详情</div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

