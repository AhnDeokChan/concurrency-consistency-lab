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
  remainingStock: number | null;
  at: string;
};

type TestRunRequestLogCreate = {
  requestIndex: number;
  statusLabel: string;
  statusCode: number | null;
  durationMs: number;
  instanceId: string | null;
  message: string | null;
  remainingStock: number | null;
  requestAt: string;
};

type TestRunCreatePayload = {
  target: string;
  baseUrl: string;
  productId: number;
  productApiId: string | null;
  productName: string | null;
  requestQty: number;
  totalRequests: number;
  concurrency: number;
  timeoutMs: number;
  runState: string;
  startStock: number | null;
  endStock: number | null;
  successCount: number;
  conflict409Count: number;
  unavailable503Count: number;
  networkErrorCount: number;
  abortedCount: number;
  otherCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  throughputRps: number;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  runErrorMessage: string | null;
  requestLogs: TestRunRequestLogCreate[];
};

type SavedRunSummary = {
  id: number;
  target: string;
  runState: string;
  productId: number;
  productApiId?: string;
  productName?: string;
  requestQty: number;
  totalRequests: number;
  concurrency: number;
  startStock?: number;
  endStock?: number;
  successCount: number;
  conflict409Count: number;
  unavailable503Count: number;
  networkErrorCount: number;
  abortedCount: number;
  otherCount: number;
  durationMs?: number;
  createdAt: string;
};

type SavedRunRequestLog = {
  id: number;
  requestIndex: number;
  statusLabel: string;
  statusCode?: number;
  durationMs: number;
  instanceId?: string;
  message?: string;
  remainingStock?: number;
  requestAt?: string;
  createdAt: string;
};

type SavedRunDetail = {
  id: number;
  target: string;
  baseUrl: string;
  runState: string;
  productId: number;
  productApiId?: string;
  productName?: string;
  requestQty: number;
  totalRequests: number;
  concurrency: number;
  timeoutMs: number;
  startStock?: number;
  endStock?: number;
  successCount: number;
  conflict409Count: number;
  unavailable503Count: number;
  networkErrorCount: number;
  abortedCount: number;
  otherCount: number;
  avgLatencyMs?: number;
  p95LatencyMs?: number;
  throughputRps?: number;
  durationMs?: number;
  startedAt?: string;
  finishedAt?: string;
  runErrorMessage?: string;
  createdAt: string;
  updatedAt: string;
  requestLogs: SavedRunRequestLog[];
};

type AggregatedStats = {
  success: number;
  conflict409: number;
  unavailable503: number;
  aborted: number;
  networkError: number;
  other: number;
  avgMs: number;
  p95Ms: number;
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

function toDisplayDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ko-KR", { hour12: false });
}

function calculateStats(logs: RequestLog[]): AggregatedStats {
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
      : Math.round(durations.reduce((acc, cur) => acc + cur, 0) / durations.length);

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

function toSavedLogStatus(log: SavedRunRequestLog): LogStatus {
  if (typeof log.statusCode === "number") {
    return log.statusCode;
  }
  if (log.statusLabel === "ERROR" || log.statusLabel === "ABORTED") {
    return log.statusLabel;
  }
  const asNumber = Number.parseInt(log.statusLabel, 10);
  return Number.isNaN(asNumber) ? "ERROR" : asNumber;
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
    throw new Error(`상품 조회 실패 (${res.status}): ${text || "응답 본문 없음"}`);
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
      `상품 목록 조회 실패 (${res.status}): ${text || "응답 본문 없음"}`,
    );
  }
  return (await res.json()) as ProductStockOption[];
}

async function createTestRun(
  baseUrl: string,
  payload: TestRunCreatePayload,
): Promise<SavedRunSummary> {
  const res = await fetch(`${baseUrl}/api/test-runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `실행 로그 저장 실패 (${res.status}): ${text || "응답 본문 없음"}`,
    );
  }
  return (await res.json()) as SavedRunSummary;
}

async function fetchSavedRuns(
  baseUrl: string,
  limit: number,
  signal?: AbortSignal,
): Promise<SavedRunSummary[]> {
  const res = await fetch(`${baseUrl}/api/test-runs?limit=${limit}`, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `실행 이력 조회 실패 (${res.status}): ${text || "응답 본문 없음"}`,
    );
  }
  return (await res.json()) as SavedRunSummary[];
}

async function fetchSavedRunDetail(
  baseUrl: string,
  runId: number,
  signal?: AbortSignal,
): Promise<SavedRunDetail> {
  const res = await fetch(`${baseUrl}/api/test-runs/${runId}`, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `실행 상세 조회 실패 (${res.status}): ${text || "응답 본문 없음"}`,
    );
  }
  return (await res.json()) as SavedRunDetail;
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
          | { instance?: string; message?: string; remainingStock?: number }
          | undefined)
      : undefined;

    if (response.ok) {
      return {
        index: options.index,
        status: response.status,
        durationMs: elapsed,
        instance: payload?.instance ?? "-",
        message: "OK",
        remainingStock:
          typeof payload?.remainingStock === "number"
            ? payload.remainingStock
            : null,
        at: new Date().toISOString(),
      };
    }

    return {
      index: options.index,
      status: response.status,
      durationMs: elapsed,
      instance: payload?.instance ?? "-",
      message: payload?.message ?? response.statusText ?? "요청 실패",
      remainingStock: null,
      at: new Date().toISOString(),
    };
  } catch (error) {
    const elapsed = Math.round(performance.now() - started);
    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const isStoppedByUser = options.runSignal.aborted;
    const message = isStoppedByUser
      ? "사용자가 중지함"
      : isAbort
        ? "요청 시간 초과"
        : error instanceof Error
          ? error.message
          : "알 수 없는 네트워크 오류";

    return {
      index: options.index,
      status: isStoppedByUser ? "ABORTED" : "ERROR",
      durationMs: elapsed,
      instance: "-",
      message,
      remainingStock: null,
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
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedRuns, setSavedRuns] = useState<SavedRunSummary[]>([]);
  const [savedRunsLoading, setSavedRunsLoading] = useState(false);
  const [savedRunsError, setSavedRunsError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedRunDetail, setSelectedRunDetail] = useState<SavedRunDetail | null>(
    null,
  );
  const [selectedRunLoading, setSelectedRunLoading] = useState(false);
  const [selectedRunError, setSelectedRunError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const optionsAbortRef = useRef<AbortController | null>(null);
  const savedRunsAbortRef = useRef<AbortController | null>(null);
  const savedRunDetailAbortRef = useRef<AbortController | null>(null);

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

  const stats = useMemo(() => calculateStats(logs), [logs]);

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

  async function loadSavedRunSummaries(preferredRunId?: number) {
    if (target !== "spring") {
      savedRunDetailAbortRef.current?.abort();
      setSavedRuns([]);
      setSelectedRunId(null);
      setSelectedRunDetail(null);
      setSelectedRunLoading(false);
      setSavedRunsError("현재는 Spring 대상 서버에서만 실행 로그 저장/조회가 가능합니다.");
      return;
    }

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    savedRunsAbortRef.current?.abort();
    const controller = new AbortController();
    savedRunsAbortRef.current = controller;

    setSavedRunsLoading(true);
    setSavedRunsError(null);

    try {
      const runs = await fetchSavedRuns(normalizedBaseUrl, 30, controller.signal);
      setSavedRuns(runs);
      setSelectedRunId((prev) => {
        if (typeof preferredRunId === "number") {
          return preferredRunId;
        }
        if (prev !== null && runs.some((run) => run.id === prev)) {
          return prev;
        }
        return runs[0]?.id ?? null;
      });
      if (runs.length === 0) {
        savedRunDetailAbortRef.current?.abort();
        setSelectedRunDetail(null);
        setSelectedRunError(null);
        setSelectedRunLoading(false);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setSavedRuns([]);
      setSelectedRunId(null);
      setSelectedRunDetail(null);
      setSavedRunsError(
        error instanceof Error
          ? error.message
          : "실행 이력을 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setSavedRunsLoading(false);
      }
    }
  }

  async function loadSavedRunDetail(runId: number) {
    if (target !== "spring") {
      setSelectedRunDetail(null);
      return;
    }

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    savedRunDetailAbortRef.current?.abort();
    const controller = new AbortController();
    savedRunDetailAbortRef.current = controller;

    setSelectedRunLoading(true);
    setSelectedRunError(null);

    try {
      const detail = await fetchSavedRunDetail(
        normalizedBaseUrl,
        runId,
        controller.signal,
      );
      setSelectedRunDetail(detail);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setSelectedRunDetail(null);
      setSelectedRunError(
        error instanceof Error
          ? error.message
          : "실행 상세를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setSelectedRunLoading(false);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductOptions();
    void loadSavedRunSummaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    if (selectedRunId === null || target !== "spring") {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSavedRunDetail(selectedRunId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId, target]);

  useEffect(() => {
    return () => {
      optionsAbortRef.current?.abort();
      abortRef.current?.abort();
      savedRunsAbortRef.current?.abort();
      savedRunDetailAbortRef.current?.abort();
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
    const selectedProductSnapshot = selectedProduct;

    const controller = new AbortController();
    abortRef.current = controller;
    const startedPerf = performance.now();
    const startedAtIso = new Date().toISOString();

    setRunError(null);
    setSaveState("idle");
    setSaveMessage(null);
    setRunState("running");
    setLogs([]);
    setProgress(0);
    setInitialStock(null);
    setActualStock(null);
    setStartedAtMs(startedPerf);
    setEndedAtMs(null);

    let doneCount = 0;
    let cursor = 1;
    const runLogs: RequestLog[] = [];
    let startStockValue: number | null = null;
    let endStockValue: number | null = null;
    let finalRunState = "DONE";
    let finalRunErrorMessage: string | null = null;

    try {
      const before = await readProduct(normalizedBaseUrl, productId, controller.signal);
      startStockValue = before.stock;
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

          runLogs.push(log);
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
        endStockValue = after.stock;
        setActualStock(after.stock);
        await loadProductOptions();
      } else {
        finalRunState = "ABORTED";
      }

      setRunState("done");
    } catch (error) {
      if (controller.signal.aborted) {
        finalRunState = "ABORTED";
        setRunState("done");
      } else {
        finalRunState = "ERROR";
        finalRunErrorMessage =
          error instanceof Error ? error.message : "실행 중 오류";
        setRunState("error");
        setRunError(finalRunErrorMessage);
      }
    } finally {
      const endedPerf = performance.now();
      const finishedAtIso = new Date().toISOString();
      setEndedAtMs(endedPerf);
      abortRef.current = null;

      const runDurationMs = Math.max(Math.round(endedPerf - startedPerf), 0);
      const runStats = calculateStats(runLogs);
      const elapsedSecondsSafe = Math.max((endedPerf - startedPerf) / 1000, 0);
      const throughputRps =
        elapsedSecondsSafe <= 0 ? 0 : runLogs.length / elapsedSecondsSafe;

      if (target === "spring" && runLogs.length > 0) {
        const numericProductId = Number.parseInt(productId, 10);
        if (Number.isNaN(numericProductId)) {
          setSaveState("error");
          setSaveMessage("실행 로그 저장을 위한 상품 ID 변환에 실패했습니다.");
          return;
        }

        const payload: TestRunCreatePayload = {
          target,
          baseUrl: normalizedBaseUrl,
          productId: numericProductId,
          productApiId: selectedProductSnapshot?.apiId ?? null,
          productName: selectedProductSnapshot?.name ?? null,
          requestQty,
          totalRequests,
          concurrency: concurrentWorkers,
          timeoutMs: requestTimeoutMs,
          runState: finalRunState,
          startStock: startStockValue,
          endStock: endStockValue,
          successCount: runStats.success,
          conflict409Count: runStats.conflict409,
          unavailable503Count: runStats.unavailable503,
          networkErrorCount: runStats.networkError,
          abortedCount: runStats.aborted,
          otherCount: runStats.other,
          avgLatencyMs: runStats.avgMs,
          p95LatencyMs: runStats.p95Ms,
          throughputRps,
          durationMs: runDurationMs,
          startedAt: startedAtIso,
          finishedAt: finishedAtIso,
          runErrorMessage: finalRunErrorMessage,
          requestLogs: runLogs.map((log) => ({
            requestIndex: log.index,
            statusLabel:
              typeof log.status === "number" ? String(log.status) : log.status,
            statusCode: typeof log.status === "number" ? log.status : null,
            durationMs: log.durationMs,
            instanceId: log.instance === "-" ? null : log.instance,
            message: log.message || null,
            remainingStock: log.remainingStock,
            requestAt: log.at,
          })),
        };

        setSaveState("saving");
        setSaveMessage("실행 로그를 저장하는 중입니다...");
        try {
          const savedRun = await createTestRun(normalizedBaseUrl, payload);
          setSaveState("saved");
          setSaveMessage(`실행 로그 저장 완료 (ID: ${savedRun.id})`);
          await loadSavedRunSummaries(savedRun.id);
        } catch (error) {
          setSaveState("error");
          setSaveMessage(
            error instanceof Error
              ? error.message
              : "실행 로그 저장 중 오류가 발생했습니다.",
          );
        }
      } else if (target !== "spring") {
        setSaveState("idle");
        setSaveMessage(
          "현재는 Spring 대상 서버에서만 실행 로그 저장을 지원합니다.",
        );
      }
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
    setSaveState("idle");
    setSaveMessage(null);
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
                    {productsLoading ? "불러오는 중..." : "새로고침"}
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
                <span>상태: {runState.toUpperCase()}</span>
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
            {saveMessage ? (
              <p
                className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                  saveState === "error"
                    ? "border-[#f8d3d3] bg-[#fff2f2] text-[#9f1f1f]"
                    : "border-[#d7e7ff] bg-[#f2f7ff] text-[#1f4f8f]"
                }`}
              >
                {saveMessage}
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

            <div className="rounded-[24px] border border-[#d9d9dd] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  저장된 실행 로그
                </h2>
                <button
                  type="button"
                  onClick={() => void loadSavedRunSummaries()}
                  disabled={savedRunsLoading}
                  className="rounded-full border border-[#d2d2d7] bg-white px-3 py-1 text-xs text-[#1d1d1f] transition hover:bg-[#f7f7fa] disabled:cursor-not-allowed disabled:text-[#a1a1aa]"
                >
                  {savedRunsLoading ? "불러오는 중..." : "새로고침"}
                </button>
              </div>

              {savedRunsError ? (
                <p className="mt-3 rounded-lg border border-[#f8d3d3] bg-[#fff2f2] px-3 py-2 text-xs text-[#9f1f1f]">
                  {savedRunsError}
                </p>
              ) : null}

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] p-3">
                  <p className="mb-2 text-xs text-[#71717a]">
                    실행 이력 목록 (행 클릭 시 아래 상세 표시)
                  </p>
                  <div className="max-h-[240px] overflow-auto rounded-lg border border-[#ececf0] bg-white">
                    <table className="min-w-[620px] w-full text-left text-sm">
                      <thead className="sticky top-0 bg-[#fafafc] text-[#71717a]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Run ID</th>
                          <th className="px-3 py-2 font-medium">상태</th>
                          <th className="px-3 py-2 font-medium">성공</th>
                          <th className="px-3 py-2 font-medium">생성시각</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedRuns.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-8 text-center text-[#8a8a93]"
                            >
                              저장된 실행 로그가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          savedRuns.map((run) => (
                            <tr
                              key={run.id}
                              onClick={() => setSelectedRunId(run.id)}
                              className={`cursor-pointer border-t border-[#f1f1f4] transition ${
                                selectedRunId === run.id
                                  ? "bg-[#eef5ff]"
                                  : "hover:bg-[#f8faff]"
                              }`}
                            >
                              <td className="px-3 py-2 font-medium text-[#1d1d1f]">
                                {run.id}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    run.runState === "DONE"
                                      ? "bg-[#e8f5ee] text-[#0a7a3f]"
                                      : run.runState === "ERROR"
                                        ? "bg-[#ffe8e8] text-[#b42318]"
                                        : "bg-[#eef2ff] text-[#3730a3]"
                                  }`}
                                >
                                  {run.runState}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[#4b4b54]">
                                {run.successCount}/{run.totalRequests}
                              </td>
                              <td className="px-3 py-2 text-[#4b4b54]">
                                {toDisplayDateTime(run.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-xl border border-[#ececf0] bg-[#fcfcfd] p-4">
                  {selectedRunLoading ? (
                    <p className="text-sm text-[#6b6b74]">
                      실행 상세를 불러오는 중입니다...
                    </p>
                  ) : selectedRunError ? (
                    <p className="rounded-lg border border-[#f8d3d3] bg-[#fff2f2] px-3 py-2 text-sm text-[#9f1f1f]">
                      {selectedRunError}
                    </p>
                  ) : !selectedRunDetail ? (
                    <p className="text-sm text-[#6b6b74]">
                      위 실행 이력에서 항목을 선택하세요.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border border-[#ececf0] bg-white px-3 py-2">
                          <p className="text-xs text-[#71717a]">Run ID</p>
                          <p className="mt-1 font-semibold">{selectedRunDetail.id}</p>
                        </div>
                        <div className="rounded-lg border border-[#ececf0] bg-white px-3 py-2">
                          <p className="text-xs text-[#71717a]">상품</p>
                          <p className="mt-1 font-semibold">
                            {selectedRunDetail.productName ?? "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#ececf0] bg-white px-3 py-2">
                          <p className="text-xs text-[#71717a]">상태</p>
                          <p className="mt-1 font-semibold">
                            {selectedRunDetail.runState}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#ececf0] bg-white px-3 py-2">
                          <p className="text-xs text-[#71717a]">총 요청</p>
                          <p className="mt-1 font-semibold">
                            {selectedRunDetail.totalRequests}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#ececf0] bg-white px-3 py-2">
                          <p className="text-xs text-[#71717a]">성공</p>
                          <p className="mt-1 font-semibold text-[#0a7a3f]">
                            {selectedRunDetail.successCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[#ececf0] bg-white px-3 py-2">
                          <p className="text-xs text-[#71717a]">소요시간</p>
                          <p className="mt-1 font-semibold">
                            {selectedRunDetail.durationMs ?? 0} ms
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 max-h-[260px] overflow-auto rounded-xl border border-[#ececf0] bg-white">
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
                            {selectedRunDetail.requestLogs.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-3 py-6 text-center text-[#8a8a93]"
                                >
                                  저장된 요청 로그가 없습니다.
                                </td>
                              </tr>
                            ) : (
                              selectedRunDetail.requestLogs.map((log) => {
                                const status = toSavedLogStatus(log);
                                return (
                                  <tr
                                    key={log.id}
                                    className="border-t border-[#f1f1f4]"
                                  >
                                    <td className="px-3 py-2 text-[#6b6b74]">
                                      {log.requestIndex}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span
                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}
                                      >
                                        {formatStatusLabel(status)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      {log.durationMs} ms
                                    </td>
                                    <td className="px-3 py-2">
                                      {log.instanceId ?? "-"}
                                    </td>
                                    <td className="px-3 py-2 text-[#5f5f66]">
                                      {log.message ?? "-"}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
