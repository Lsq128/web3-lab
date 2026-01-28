"use client";

import { Card, CardBody, CardHeader, Chip, Divider } from "@heroui/react";

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">工具 / 设置</h1>
        <p className="mt-1 text-sm text-white/60">
          常用工具与调试面板（基础页面占位）。
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
            <li>切换默认链 / RPC（开发用）</li>
            <li>格式化单位（wei ↔ ether）与地址校验</li>
            <li>日志与调试信息面板</li>
          </ul>
          <div className="text-xs text-white/50">
            备注：后续可以把环境变量/网络配置做成可视化设置页。
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

