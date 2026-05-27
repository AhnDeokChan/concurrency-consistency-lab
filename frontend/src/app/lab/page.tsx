"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Target = "spring" | "fastapi";
type RunState = "idle" | "running" | "stopping" | "done" | "error";
type LogStatus = number | "ERROR" | "ABORTED";

type ProductPayload = {
  id: number;
  stock: number;
};

type ProductStockOption = {
  id: number;
  apiId: string;
  name: string;
  stock: number;
  instance?: string;
};

type RequestLog = {
  index: number;
  status: LogStatus;
  durationMs: number;
  instance: string;
  message: string;
  at: string;
};

const SPRING_BASE =
  process.env.NEXT_PUBLIC_SPRING_API_URL ?? "http://localhost:5010";
const FASTAPI_BASE =
  process.env.NEXT_PUBLIC_FASTAPI_API_URL ?? "http://localhost:5020";

function p95(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const position = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(position, 0)];
}

function toInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function formatStatusLabel(status: LogStatus): string {
  if (status === "ERROR" || status === "ABORTED") {
    return status;
  }
  return String(status);
}

function statusBadgeClass(status: LogStatus): string {
  if (status === 200) return "bg-[#e8f5ee] text-[#0a7a3f]";
  if (status === 409) return "bg-[#fff3d9] text-[#8f5e00]";
  if (status === 503) return "bg-[#ffe8e8] text-[#b42318]";
  if (status === "ERROR") return "bg-[#f4f4f5] text-[#52525b]";
  if (status === "ABORTED") return "bg-[#eef2ff] text-[#3730a3]";
  if (typeof status === "number" && status >= 500) {
    return "bg-[#ffe8e8] text-[#b42318]";
  }
  if (typeof status === "number" && status >= 400) {
    return "bg-[#fff3d9] text-[#8f5e00]";
  }
  return "bg-[#f4f4f5] text-[#52525b]";
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

async function readProduct(
  baseUrl: string,
  productId: string,
  signal?: AbortSignal,
): Promise<ProductPayload> {
  const res = await fetch(`${baseUrl}/api/products/${productId}`, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`상품 조회 실패 (${res.status}): ${text || "no response body"}`);
  }
  return (await res.json()) as ProductPayload;
}

async function fetchProductStockOptions(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<ProductStockOption[]> {
  const res = await fetch(`${baseUrl}/api/products/stock-options`, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `상품 목록 조회 실패 (${res.status}): ${text || "no response body"}`,
    );
  }
  return (await res.json()) as ProductStockOption[];
}

type RequestOptions = {
  index: number;
  baseUrl: string;
  productId: string;
  qty: number;
  timeoutMs: number;
  runSignal: AbortSignal;
};

async function performDecreaseRequest(
  options: RequestOptions,
): Promise<RequestLog> {
  const started = performance.now();
  const timeoutController = new AbortController();
  const timeoutHandle = window.setTimeout(() => {
    timeoutController.abort("timeout");
  }, options.timeoutMs);

  const onAbort = () => {
    timeoutController.abort("aborted");
  };
  options.runSignal.addEventListener("abort", onAbort, { once: true });

  try {
    const response = await fetch(
      `${options.baseUrl}/api/products/${options.productId}/decrease`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty: options.qty }),
        signal: timeoutController.signal,
      },
    );

    const elapsed = Math.round(performance.now() - started);
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? ((await response.json()) as
          | { instance?: string; message?: string }
          | undefined)
      : undefined;

    if (response.ok) {
      return {
        index: options.index,
        status: response.status,
        durationMs: elapsed,
        instance: payload?.instance ?? "-",
        message: "OK",
        at: new Date().toISOString(),
      };
    }

    return {
      index: options.index,
      status: response.status,
      durationMs: elapsed,
      instance: payload?.instance ?? "-",
      message: payload?.message ?? response.statusText ?? "Request failed",
      at: new Date().toISOString(),
    };
  } catch (error) {
    const elapsed = Math.round(performance.now() - started);
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const isStoppedByUser = options.runSignal.aborted;
    const message = isStoppedByUser
      ? "Stopped by user"
      : isAbort
        ? "Timeout"
        : error instanceof Error
          ? error.message
          : "Unknown network error";

    return {
      index: options.index,
      status: isStoppedByUser ? "ABORTED" : "ERROR",
      durationMs: elapsed,
      instance: "-",
      message,
      at: new Date().toISOString(),
    };
  } finally {
    window.clearTimeout(timeoutHandle);
    options.runSignal.removeEventListener("abort", onAbort);
  }
}

export default function LabPage() {
  const [target, setTarget] = useState<Target>("spring");

  const [productOptions, setProductOptions] = useState<ProductStockOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [qtyInput, setQtyInput] = useState("1");
  const [totalInput, setTotalInput] = useState("120");
  const [concurrencyInput, setConcurrencyInput] = useState("24");
  const [timeoutInput, setTimeoutInput] = useState("2500");

  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [runState, setRunState] = useState<RunState>("idle");
  const [progress, setProgress] = useState(0);
  const [initialStock, setInitialStock] = useState<number | null>(null);
  const [actualStock, setActualStock] = useState<number | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [endedAtMs, setEndedAtMs] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const optionsAbortRef = useRef<AbortController | null>(null);

  const baseUrl = useMemo(() => {
    if (target === "spring") return SPRING_BASE;
    return FASTAPI_BASE;
  }, [target]);

  const selectedProduct = useMemo(() => {
    return (
      productOptions.find((product) => String(product.id) === selectedProductId) ??
      null
    );
  }, [productOptions, selectedProductId]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => a.index - b.index);
  }, [logs]);

  const stats = useMemo(() => {
    let success = 0;
    let conflict409 = 0;
    let unavailable503 = 0;
    let aborted = 0;
    let networkError = 0;
    let other = 0;
    const durations: number[] = [];

    for (const log of logs) {
      durations.push(log.durationMs);
      if (log.status === 200) {
        success += 1;
      } else if (log.status === 409) {
        conflict409 += 1;
      } else if (log.status === 503) {
        unavailable503 += 1;
      } else if (log.status === "ABORTED") {
        aborted += 1;
      } else if (log.status === "ERROR") {
        networkError += 1;
      } else {
        other += 1;
      }
    }

    const avg =
      durations.length === 0
        ? 0
        : Math.round(
            durations.reduce((acc, cur) => acc + cur, 0) / durations.length,
          );

    return {
      success,
      conflict409,
      unavailable503,
      aborted,
      networkError,
      other,
      avgMs: avg,
      p95Ms: Math.round(p95(durations)),
    };
  }, [logs]);

  const qty = toInt(qtyInput, 1);
  const expectedStock =
    initialStock === null ? null : initialStock - stats.success * qty;
  const consistencyPass =
    expectedStock !== null &&
    actualStock !== null &&
    Number.isFinite(expectedStock) &&
    expectedStock === actualStock;

  const elapsedSeconds = useMemo(() => {
    if (startedAtMs === null) return 0;
    const end = endedAtMs ?? startedAtMs;
    return Math.max((end - startedAtMs) / 1000, 0);
  }, [startedAtMs, endedAtMs]);

  const throughput = elapsedSeconds <= 0 ? 0 : logs.length / elapsedSeconds;
  const isRunning = runState === "running" || runState === "stopping";

  async function loadProductOptions() {
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    if (!normalizedBaseUrl) {
      setProductsError("대상 API URL이 비어 있습니다.");
      setProductOptions([]);
      setSelectedProductId("");
      return;
    }

    optionsAbortRef.current?.abort();
    const controller = new AbortController();
    optionsAbortRef.current = controller;

    setProductsLoading(true);
    setProductsError(null);

    try {
      const options = await fetchProductStockOptions(
        normalizedBaseUrl,
        controller.signal,
      );
      setProductOptions(options);

      if (options.length === 0) {
        setSelectedProductId("");
      } else {
        setSelectedProductId((prev) => {
          const exists = options.some((item) => String(item.id) === prev);
          return exists ? prev : String(options[0].id);
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setProductOptions([]);
      setSelectedProductId("");
      setProductsError(
        error instanceof Error
          ? error.message
          : "상품 목록을 가져오는 중 오류가 발생했습니다.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setProductsLoading(false);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    return () => {
      optionsAbortRef.current?.abort();
      abortRef.current?.abort();
    };
  }, []);

  async function runLoadTest() {
    if (isRunning) return;

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    const productId = selectedProductId.trim();

    if (!productId) {
      setRunError("테스트할 상품을 선택하세요.");
      setRunState("error");
      return;
    }

    const totalRequests = Math.max(toInt(totalInput, 0), 1);
    const concurrentWorkers = Math.max(
      1,
      Math.min(toInt(concurrencyInput, 1), totalRequests),
    );
    const requestTimeoutMs = Math.max(toInt(timeoutInput, 200), 200);
    const requestQty = Math.max(toInt(qtyInput, 1), 1);

    const controller = new AbortController();
    abortRef.current = controller;

    setRunError(null);
    setRunState("running");
    setLogs([]);
    setProgress(0);
    setInitialStock(null);
    setActualStock(null);
    setStartedAtMs(performance.now());
    setEndedAtMs(null);

    let doneCount = 0;
    let cursor = 1;

    try {
      const before = await readProduct(normalizedBaseUrl, productId, controller.signal);
      setInitialStock(before.stock);

      async function worker() {
        while (true) {
          if (controller.signal.aborted) return;

          const current = cursor;
          cursor += 1;

          if (current > totalRequests) {
            return;
          }

          const log = await performDecreaseRequest({
            index: current,
            baseUrl: normalizedBaseUrl,
            productId,
            qty: requestQty,
            timeoutMs: requestTimeoutMs,
            runSignal: controller.signal,
          });

          doneCount += 1;
          setLogs((prev) => [...prev, log]);
          setProgress((doneCount / totalRequests) * 100);
        }
      }

      await Promise.all(
        Array.from({ length: concurrentWorkers }, () => worker()),
      );

      if (!controller.signal.aborted) {
        const after = await readProduct(normalizedBaseUrl, productId, controller.signal);
        setActualStock(after.stock);
        await loadProductOptions();
      }

      setRunState("done");
    } catch (error) {
      if (controller.signal.aborted) {
        setRunState("done");
      } else {
        setRunState("error");
        setRunError(error instanceof Error ? error.message : "실행 중 오류");
      }
    } finally {
      setEndedAtMs(performance.now());
      abortRef.current = null;
    }
  }

  function stopLoadTest() {
    const controller = abortRef.current;
    if (!controller) return;
    setRunState("stopping");
    controller.abort();
  }

  function resetResult() {
    if (isRunning) return;
    setLogs([]);
    setProgress(0);
    setInitialStock(null);
    setActualStock(null);
    setStartedAtMs(null);
    setEndedAtMs(null);
    setRunState("idle");
    setRunError(null);
  }

  const runDisabled =
    isRunning || productsLoading || !selectedProductId || Boolean(productsError);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <div className="h-11 bg-black/95 px-4">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between">
          <p className="text-[12px] tracking-[0.12em] text-white/70 uppercase">
            Concurrency Lab
          </p>
          <Link
            href="/"
            className="text-[12px] text-white/70 transition-colors hover:text-white"
          >
            Home
          </Link>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:gap-6">
        <section className="overflow-hidden rounded-[24px] border border-[#d9d9dd] bg-white">
          <div className="grid gap-6 p-5 sm:grid-cols-[1.1fr_0.9fr] sm:p-8">
            <div>
              <p className="text-[12px] tracking-[0.2em] text-[#7a7a7a] uppercase">
                Async Consistency Dashboard
              </p>
              <h1 className="mt-3 text-3xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-5xl">
                재고 동시 요청 시뮬레이터
              </h1>
              <p className="mt-4 max-w-xl text-[16px] leading-7 text-[#4d4d53]">
                상품 목록 API에서 대상을 선택한 뒤 요청 수와 동시성을 조절해
                200/409/503 분포와 최종 재고 정합성을 검증합니다.
              </p>
            </div>

            <div className="rounded-[20px] border border-[#1d1d1f]/10 bg-[#101113] p-5 text-white">
              <p className="text-[12px] tracking-[0.12em] text-white/70 uppercase">
                Result
              </p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-sm text-white/65">정합성</span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    consistencyPass
                      ? "bg-[#143820] text-[#84f0b4]"
                      : actualStock !== null && expectedStock !== null
                        ? "bg-[#3b1010] text-[#ffb4b4]"
                        : "bg-white/10 text-white/75"
                  }`}
                >
                  {consistencyPass
                    ? "PASS"
                    : actualStock !== null && expectedStock !== null
                      ? "FAIL"
                      : "PENDING"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white/6 p-3">
                  <p className="text-white/60">Expected</p>
                  <p className="mt-1 text-lg font-semibold">
                    {expectedStock ?? "-"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/6 p-3">
                  <p className="text-white/60">Actual</p>
                  <p className="mt-1 text-lg font-semibold">
                    {actualStock ?? "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-[#d9d9dd] bg-white p-5 sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              테스트 설정
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-sm text-[#56565b]">대상 서버</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "spring", label: "Spring LB", url: SPRING_BASE },
                    { key: "fastapi", label: "FastAPI LB", url: FASTAPI_BASE },
                  ] as const).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTarget(item.key)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        target === item.key
                          ? "border-[#0066cc] bg-[#0066cc] text-white"
                          : "border-[#d2d2d7] bg-white text-[#1d1d1f] hover:border-[#bcbcc2]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#71717a]">
                  Active URL: {normalizeBaseUrl(baseUrl)}
                </p>
              </div>

              <div className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm text-[#56565b]">테스트 상품</label>
                  <button
                    type="button"
                    onClick={() => void loadProductOptions()}
                    disabled={productsLoading || isRunning}
                    className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1 text-xs text-[#1d1d1f] transition hover:bg-[#f7f7fa] disabled:cursor-not-allowed disabled:text-[#a1a1aa]"
                  >
                    {productsLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  disabled={productsLoading || productOptions.length === 0}
                  className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#0066cc] disabled:bg-[#f5f5f7] disabled:text-[#a1a1aa]"
                >
                  {productOptions.length === 0 ? (
                    <option value="">선택 가능한 상품이 없습니다</option>
                  ) : (
                    productOptions.map((product) => (
                      <option key={product.id} value={String(product.id)}>
                        {product.id}. {product.name} ({product.apiId}) / stock:{" "}
                        {product.stock}
                      </option>
                    ))
                  )}
                </select>

                {selectedProduct ? (
                  <p className="mt-2 text-xs text-[#71717a]">
                    선택된 상품 재고: <span className="font-semibold text-[#1d1d1f]">{selectedProduct.stock}</span>
                  </p>
                ) : null}

                {productsError ? (
                  <p className="mt-3 rounded-lg border border-[#f8d3d3] bg-[#fff2f2] px-3 py-2 text-xs text-[#9f1f1f]">
                    {productsError}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "요청당 수량(qty)",
                    value: qtyInput,
                    setter: setQtyInput,
                    placeholder: "1",
                  },
                  {
                    label: "총 요청 수",
                    value: totalInput,
                    setter: setTotalInput,
                    placeholder: "120",
                  },
                  {
                    label: "동시성",
                    value: concurrencyInput,
                    setter: setConcurrencyInput,
                    placeholder: "24",
                  },
                  {
                    label: "타임아웃(ms)",
                    value: timeoutInput,
                    setter: setTimeoutInput,
                    placeholder: "2500",
                  },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="mb-2 block text-sm text-[#56565b]">
                      {field.label}
                    </label>
                    <input
                      value={field.value}
                      onChange={(event) => field.setter(event.target.value)}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-[#d2d2d7] px-4 py-2.5 text-sm outline-none transition focus:border-[#0066cc]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runLoadTest}
                disabled={runDisabled}
                className="rounded-full bg-[#0066cc] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0071e3] disabled:cursor-not-allowed disabled:bg-[#9cbce6]"
              >
                Run
              </button>
              <button
                type="button"
                onClick={stopLoadTest}
                disabled={!isRunning}
                className="rounded-full border border-[#d2d2d7] bg-white px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#f7f7fa] disabled:cursor-not-allowed disabled:text-[#a1a1aa]"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={resetResult}
                disabled={isRunning}
                className="rounded-full border border-[#d2d2d7] bg-white px-5 py-2.5 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#f7f7fa] disabled:cursor-not-allowed disabled:text-[#a1a1aa]"
              >
                Reset
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs text-[#71717a]">
                <span>Status: {runState.toUpperCase()}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#ececf0]">
                <div
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  className="h-full rounded-full bg-[#0066cc] transition-all"
                />
              </div>
            </div>

            {runError ? (
              <p className="mt-4 rounded-xl border border-[#f8d3d3] bg-[#fff2f2] px-4 py-3 text-sm text-[#9f1f1f]">
                {runError}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[#d9d9dd] bg-white p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                실시간 지표
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: "200", value: stats.success, tone: "text-[#0a7a3f]" },
                  {
                    label: "409",
                    value: stats.conflict409,
                    tone: "text-[#8f5e00]",
                  },
                  {
                    label: "503",
                    value: stats.unavailable503,
                    tone: "text-[#b42318]",
                  },
                  {
                    label: "ERROR",
                    value: stats.networkError,
                    tone: "text-[#52525b]",
                  },
                  {
                    label: "ABORTED",
                    value: stats.aborted,
                    tone: "text-[#3730a3]",
                  },
                  { label: "OTHER", value: stats.other, tone: "text-[#52525b]" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] px-3 py-2.5"
                  >
                    <p className="text-xs text-[#71717a]">{item.label}</p>
                    <p className={`mt-1 text-xl font-semibold ${item.tone}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] px-3 py-2.5">
                  <p className="text-xs text-[#71717a]">Avg</p>
                  <p className="mt-1 text-lg font-semibold">{stats.avgMs} ms</p>
                </div>
                <div className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] px-3 py-2.5">
                  <p className="text-xs text-[#71717a]">P95</p>
                  <p className="mt-1 text-lg font-semibold">{stats.p95Ms} ms</p>
                </div>
                <div className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] px-3 py-2.5">
                  <p className="text-xs text-[#71717a]">Throughput</p>
                  <p className="mt-1 text-lg font-semibold">
                    {throughput.toFixed(1)} req/s
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#d9d9dd] bg-white p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                요청 로그
              </h2>
              <div className="mt-4 max-h-[440px] overflow-auto rounded-xl border border-[#ececf0]">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#fafafc] text-[#71717a]">
                    <tr>
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Latency</th>
                      <th className="px-3 py-2 font-medium">Instance</th>
                      <th className="px-3 py-2 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-8 text-center text-[#8a8a93]"
                        >
                          아직 실행 기록이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sortedLogs.map((log) => (
                        <tr
                          key={`${log.index}-${log.at}`}
                          className="border-t border-[#f1f1f4]"
                        >
                          <td className="px-3 py-2 text-[#6b6b74]">
                            {log.index}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(log.status)}`}
                            >
                              {formatStatusLabel(log.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2">{log.durationMs} ms</td>
                          <td className="px-3 py-2">{log.instance}</td>
                          <td className="px-3 py-2 text-[#5f5f66]">
                            {log.message}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
