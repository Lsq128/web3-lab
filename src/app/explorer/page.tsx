"use client";

import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";

export default function ExplorerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">链上查询</h1>
        <p className="mt-1 text-sm text-white/60">
          查询区块、交易、地址等链上数据（基础页面占位）。
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
            <li>输入 Tx Hash / Block Number / Address</li>
            <li>展示交易详情（from/to/value/gas/状态）</li>
            <li>展示地址资产与交易历史</li>
          </ul>
          <div className="text-xs text-white/50">
            备注：后续可以用区块浏览器 API 或 RPC 直连来实现。
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

