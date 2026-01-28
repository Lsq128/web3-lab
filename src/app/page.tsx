"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Spinner,
} from "@heroui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConnection, useBalance, useChainId, useChains } from "wagmi";
import { formatEther } from "viem";
import { useMemo } from "react";


export default function Home() {
  const { address, isConnected } = useConnection();
  const chains = useChains();
  const chainId = useChainId();
  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
    isRefetching: isBalanceRefetching,
  } = useBalance({
    address,
    query: {
      enabled: !!address,
    },
  });

  const chainName = useMemo(() => {
    return chains.find((chain) => chain.id === chainId)?.name || `Chain ID: ${chainId}`;
  }, [chainId, chains]);

  const formattedAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const formattedBalance = useMemo(() => {
    if (!balance) return "0.00";
    return parseFloat(formatEther(balance.value)).toFixed(4);
  }, [balance]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold">钱包未连接</h1>
          <p className="text-white/60">
            请连接钱包以查看账户信息和余额
          </p>
        </div>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">账户概览</h1>
        <p className="mt-1 text-sm text-white/60">
          查看您的钱包账户信息和余额
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {/* 账户地址卡片 */}
        <Card className="border border-white/10 bg-white/5">
          <CardHeader className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium text-white/70">账户地址</h2>
            <Chip size="sm" variant="flat" color="primary">
              已连接
            </Chip>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="font-mono text-lg font-semibold">
                  {formattedAddress}
                </p>
                <p className="mt-1 font-mono text-xs text-white/50">
                  {address}
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  if (address) {
                    navigator.clipboard.writeText(address);
                  }
                }}
              >
                复制
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* 网络信息卡片 */}
        <Card className="border border-white/10 bg-white/5">
          <CardHeader className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium text-white/70">当前网络</h2>
          </CardHeader>
          <CardBody className="pt-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-lg font-semibold">{chainName}</p>
            </div>
            <p className="mt-1 text-xs text-white/50">Chain ID: {chainId}</p>
          </CardBody>
        </Card>

        {/* 余额卡片 */}
        <Card className="border border-white/10 bg-white/5 sm:col-span-1 lg:col-span-2">
          <CardHeader className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-medium text-white/70">账户余额</h2>
            <Button
              size="sm"
              variant="flat"
              onPress={() => refetchBalance()}
              isLoading={isBalanceRefetching}
              isDisabled={isBalanceLoading || isBalanceRefetching}
            >
              {isBalanceRefetching ? "刷新中..." : "刷新余额"}
            </Button>
          </CardHeader>
          <CardBody className="pt-2">
            {isBalanceLoading ? (
              <div className="flex items-center gap-3">
                <Spinner size="sm" />
                <span className="text-white/60">加载余额中...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{formattedBalance}</p>
                <p className="text-lg text-white/60">
                  {balance?.symbol || "ETH"}
                </p>
              </div>
            )}
            {balance && (
              <p className="mt-2 text-xs text-white/50">
                可用余额: {formattedBalance} {balance.symbol}
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

