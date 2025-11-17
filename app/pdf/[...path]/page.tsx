'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

type ViewStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function PDFPage() {
  const params = useParams<{ path?: string | string[] }>();
  const router = useRouter();

  const pathSegments = useMemo<string[]>(() => {
    const raw = params?.path;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }, [params]);

  const publicId = pathSegments[0] ?? '';
  const labelSegment = pathSegments.slice(1).join(' / ');

  const [fileName, setFileName] = useState('PDF Document');
  const [refreshCount, setRefreshCount] = useState(0);
  const [status, setStatus] = useState<ViewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId) {
      setStatus('error');
      setErrorMessage('유효하지 않은 PDF ID입니다.');
      return;
    }

    const label = labelSegment || publicId;
    try {
      setFileName(decodeURIComponent(label));
    } catch (error) {
      setFileName(label);
    }

    setStatus('loading');
    setErrorMessage(null);
  }, [publicId, labelSegment]);

  useEffect(() => {
    if (!publicId) return;
    setRefreshCount(0);
  }, [publicId]);

  const baseStreamUrl = publicId
    ? `/api/pdfs/${encodeURIComponent(publicId)}`
    : null;
  const viewerSrc = baseStreamUrl
    ? `${baseStreamUrl}?inline=1&v=${refreshCount}`
    : null;

  const handleRefresh = () => {
    if (!publicId) return;
    setStatus('loading');
    setRefreshCount((prev) => prev + 1);
  };

  const handleDownload = () => {
    if (!baseStreamUrl) return;
    window.open(`${baseStreamUrl}?download=1`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] flex flex-col">
      <header className="px-4 py-3 md:px-8 md:py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between ">
        <div className="flex items-center gap-4 min-w-0">
          <Image
            className="fixed top-8 left-8 z-10"
            src="/logo.svg"
            alt="logo"
            width={130}
            height={30}
            priority
          />
          {/* <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 font-semibold mb-1">
              PDF Viewer
            </p>
            <h1 className="font-ibm-plex-mono text-sm md:text-base text-gray-900 truncate">
              {fileName}
            </h1>
          </div> */}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              status === 'ready'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : status === 'error'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}
          >
            {status === 'ready' && '열람 중'}
            {status === 'loading' && '불러오는 중'}
            {status === 'error' && '로딩 오류'}
            {status === 'idle' && '대기'}
          </span>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-xs md:text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            disabled={!publicId}
          >
            새로고침
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs md:text-sm rounded-lg bg-gray-900 text-white hover:bg-black transition-colors disabled:opacity-40"
            disabled={!publicId}
          >
            다운로드
          </button>
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 text-xs md:text-sm border border-transparent rounded-lg text-gray-600 hover:text-gray-900"
          >
            ← PDF목록
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4">
        {status === 'error' ? (
          <div className="flex-1 bg-white border border-rose-100 rounded-2xl flex flex-col items-center justify-center text-center gap-4 p-8 shadow-sm">
            <p className="text-base font-semibold text-rose-600">
              PDF를 불러오지 못했습니다.
            </p>
            <p className="text-sm text-gray-500">
              {errorMessage ?? 'public_id를 확인해주세요.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
                disabled={!publicId}
              >
                다시 시도
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                홈으로 이동
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden relative">
            {status !== 'ready' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85 backdrop-blur-sm">
                <div className="h-10 w-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
                <p className="text-sm text-gray-500">
                  PDF를 불러오는 중입니다...
                </p>
              </div>
            )}

            {viewerSrc ? (
              <iframe
                key={refreshCount}
                src={viewerSrc}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={() => setStatus('ready')}
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                PDF ID가 필요합니다.
              </div>
            )}
          </div>
        )}

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 text-sm text-gray-600">
          <h2 className="text-gray-900 font-semibold mb-3 text-base">
            API 메모
          </h2>
          {/* <dl className="grid gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-gray-400 uppercase tracking-[0.3em] text-[11px]">
                Endpoint
              </dt>
              <dd className="font-ibm-plex-mono text-gray-900">{`GET /pdfs/{public_id}`}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-gray-400 uppercase tracking-[0.3em] text-[11px]">
                Public ID
              </dt>
              <dd className="font-ibm-plex-mono text-gray-900">
                {publicId || '—'}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-gray-400 uppercase tracking-[0.3em] text-[11px]">
                Content-Type
              </dt>
              <dd className="font-ibm-plex-mono text-gray-900">
                application/pdf
              </dd>
            </div>
          </dl> */}
        </section>
      </main>
    </div>
  );
}
