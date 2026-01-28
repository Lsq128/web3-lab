import { NextResponse } from "next/server";

type EtherscanTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  isError?: string;
  txreceipt_status?: string;
  methodId?: string;
  functionName?: string;
};

function getEtherscanBaseUrl() {
  return "https://api.etherscan.io/v2/api";
}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") ?? "";
  const chainId = Number(searchParams.get("chainId") ?? "0");
  const page = Number(searchParams.get("page") ?? "1");
  const offset = Number(searchParams.get("offset") ?? "10");
  const sort = searchParams.get("sort") ?? "desc";

  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return NextResponse.json(
      { ok: false, error: "Invalid address" },
      { status: 400 }
    );
  }

  const baseUrl = getEtherscanBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: `Unsupported chainId: ${chainId}` },
      { status: 400 }
    );
  }

  const apiKey =
    process.env.ETHERSCAN_API_KEY ||
    process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ||
    "";

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing ETHERSCAN_API_KEY. Please set it in your environment (server-side).",
      },
      { status: 500 }
    );
  }

  const url = new URL(baseUrl);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlist");
  url.searchParams.set("address", address);
  url.searchParams.set("startblock", "0");
  url.searchParams.set("endblock", "99999999");
  url.searchParams.set("page", String(Number.isFinite(page) ? page : 1));
  url.searchParams.set("offset", String(Number.isFinite(offset) ? offset : 10));
  url.searchParams.set("sort", sort === "asc" ? "asc" : "desc");
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("chainid", chainId + '');
  console.log(url.toString())
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: `Etherscan HTTP ${res.status}` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    status: string;
    message: string;
    result: EtherscanTx[] | string;
  };

  // Etherscan: status "1" success, "0" error/no transactions
  if (data.status === "0") {
    // "No transactions found" is not an error for us
    if (typeof data.result === "string" && /No transactions found/i.test(data.result)) {
      return NextResponse.json({ ok: true, items: [] as EtherscanTx[] });
    }
    return NextResponse.json(
      { ok: false, error: data.result || data.message || "Etherscan error" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    items: Array.isArray(data.result) ? data.result : [],
  });
}

