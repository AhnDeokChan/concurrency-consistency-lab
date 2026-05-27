import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f5f7]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#ffffff_0%,transparent_55%),radial-gradient(circle_at_100%_100%,#e6eef8_0%,transparent_50%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-20">
        <div className="w-full rounded-[28px] border border-[#e0e0e0] bg-white p-8 shadow-[0_30px_80px_rgba(29,29,31,0.08)] sm:p-14">
          <p className="text-[12px] tracking-[0.2em] text-[#7a7a7a] uppercase">
            Concurrency Consistency Lab
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.06] font-semibold tracking-[-0.03em] text-[#1d1d1f] sm:text-6xl">
            재고 동시성 · 정합성 테스트 대시보드
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-8 text-[#4f4f53]">
            브라우저에서 동시 요청 시나리오를 실행하고, 성공/충돌/과부하
            상태코드와 최종 재고 정합성을 실시간으로 확인합니다.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/lab"
              className="inline-flex items-center justify-center rounded-full bg-[#0066cc] px-6 py-3 text-[17px] font-medium text-white transition-colors hover:bg-[#0071e3]"
            >
              테스트 대시보드 열기
            </Link>
            <a
              href="http://localhost:5010/health"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-6 py-3 text-[17px] font-medium text-[#0066cc] transition-colors hover:bg-[#f8f8fb]"
            >
              Spring 헬스체크
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
