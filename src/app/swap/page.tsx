"use client";

import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";

export default function SwapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">币币交易</h1>
        <p className="mt-1 text-sm text-white/60">
          代币兑换 / Swap（基础页面占位）。
        </p>
      </div>

      <Card className="border border-white/10 bg-white/5">
        <CardHeader className="flex items-center justify-between">
          <div className="text-sm font-medium text-white/70">功能规划</div>
          <Chip size="sm" variant="flat" className="bg-white/5 text-white/70">
            Coming soon
          </Chip>
        </CardHeader>
        <Divider className="bg-white/10" />
        <CardBody className="space-y-3">
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/70">
            <li>选择 Token A / Token B + 输入数量</li>
            <li>自动获取报价与滑点设置</li>
            <li>发起交易并展示交易状态</li>
          </ul>
          <div className="text-xs text-white/50">
            备注：后续可接 Uniswap SDK / 0x API / 1inch API 等。
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

