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

  const [chatOpen, setChatOpen] = useState(false);
  const [fileName, setFileName] = useState('PDF Document');
  const [refreshCount, setRefreshCount] = useState(0);
  const [status, setStatus] = useState<ViewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [note, setNote] = useState('');

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
    // localStorage에서 노트 불러오기
    const savedNote = localStorage.getItem(`pdf-note-${publicId}`);
    if (savedNote) {
      setNote(savedNote);
    } else {
      setNote('');
    }
  }, [publicId]);

  // 노트 저장 함수
  const handleNoteChange = (value: string) => {
    setNote(value);
    if (publicId) {
      localStorage.setItem(`pdf-note-${publicId}`, value);
    }
  };

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
        <button onClick={() => router.back()}>
          <svg
            width="19"
            height="37"
            viewBox="0 0 19 37"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.3848 0.353581L0.707108 18.0312L18.3848 35.7089"
              stroke="#545454"
            />
          </svg>
        </button>
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
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-4">
        {status === 'error' ? (
          <div className="flex-1 bg-white border border-rose-100 rounded-2xl flex flex-col items-center justify-center text-center gap-4 p-8">
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
          <div className="flex-1 rounded-2xl border border-gray-200 bg-white overflow-hidden relative">
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

        <section className="rounded-2xl p-4 md:p-6">
          <textarea
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="노트를 입력하세요."
            className="w-full min-h-[120px] text-sm text-gray-900 rounded-lg resize-y focus:outline-none focus:ring-gray-900 focus:border-transparent transition-colors placeholder:text-gray-400"
            rows={5}
          />
          {note && (
            <div className="mt-2 text-xs text-gray-500">자동 저장됨</div>
          )}
        </section>
      </main>

      <section>
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="fixed shadow-xl bottom-8 right-8 z-10 bg-white h-1/10 aspect-square p-3 rounded-full transition-color duration-300 hover:bg-gray-200"
        >
          <Image
            className=""
            src="/logo.svg"
            alt="logo"
            width={100}
            height={30}
            priority
          />
          {chatOpen && (
            <div className="fixed w-[30vw] h-full top-0 right-0 p-6 pt-12 z-40">
              <div className="w-full h-full bg-white rounded-[48px] ">
                <p className="font-semibold mb-2">AI Chat</p>
              </div>
            </div>
          )}
        </button>
      </section>
    </div>
  );
}
