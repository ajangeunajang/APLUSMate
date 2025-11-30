"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useChatContext } from "./ChatContext";
import SkeletonLoader from "../components/SkeletonLoader";

// react-pdf를 동적으로 로드 SSR 문제 해결
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), {
  ssr: false,
});

// PDF worker 설정
if (typeof window !== "undefined") {
  import("react-pdf").then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

type Props = {
  publicId: string;
};

export default function PdfViewerClient({ publicId }: Props) {
  const router = useRouter();
  const { chatOpen, captureMode, setCaptureMode, setCapturedImage, setCurrentPage: setContextCurrentPage } = useChatContext();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});
  const [pdfTitle, setPdfTitle] = useState<string>("제목 없음");
  const [pdfDate, setPdfDate] = useState<string>("");

  // Context의 currentPage도 동기화
  useEffect(() => {
    setContextCurrentPage(currentPage);
  }, [currentPage, setContextCurrentPage]);

  // 사이드바 ref
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  // 루트(전체) 컨테이너 ref — transition/width 변경 감지를 위해 사용
  const rootRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const mainViewerRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(1);
  
  // 캡쳐 관련 상태
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const pdfPageRef = useRef<HTMLDivElement | null>(null);

  // 사이드바 자동 스크롤 (현재 페이지 썸네일이 뷰포트에 보이도록)
  useEffect(() => {
    if (sidebarRef.current && thumbnailRefs.current[currentPage]) {
      const thumbnail = thumbnailRefs.current[currentPage];
      const sidebar = sidebarRef.current;

      if (thumbnail) {
        const thumbnailTop = thumbnail.offsetTop;
        const thumbnailHeight = thumbnail.offsetHeight;
        const sidebarScrollTop = sidebar.scrollTop;
        const sidebarHeight = sidebar.clientHeight;

        // 썸네일이 뷰포트 위쪽을 벗어난 경우
        if (thumbnailTop < sidebarScrollTop) {
          sidebar.scrollTo({
            top: thumbnailTop - 20, // 약간의 여백
            behavior: "smooth",
          });
        }
        // 썸네일이 뷰포트 아래쪽을 벗어난 경우
        else if (
          thumbnailTop + thumbnailHeight >
          sidebarScrollTop + sidebarHeight
        ) {
          sidebar.scrollTo({
            top: thumbnailTop + thumbnailHeight - sidebarHeight + 20, // 약간의 여백
            behavior: "smooth",
          });
        }
      }
    }
  }, [currentPage]);

  // 페이지 이동 - 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentPage((prev) => Math.max(1, prev - 1));
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentPage((prev) => Math.min(numPages || prev, prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages]);

  // 페이지 이동 - 스크롤 이벤트 (debounce)
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleWheel = (e: WheelEvent) => {
      // 메인 뷰어 영역 내부에서 발생한 이벤트가 아니면 무시
      if (!mainViewerRef.current || !mainViewerRef.current.contains(e.target as Node))
        return;

      // 사이드바(썸네일) 내부에서 발생 휠 이벤트 무시
      if (sidebarRef.current && sidebarRef.current.contains(e.target as Node))
        return;

      // textarea에 포커스 있을 때 스크롤 이벤트 무시
      if (document.activeElement?.tagName === "TEXTAREA") return;

      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
          setCurrentPage((prev) => Math.min(numPages || prev, prev + 1));
        } else if (e.deltaY < 0) {
          setCurrentPage((prev) => Math.max(1, prev - 1));
        }
      }, 50); // 50ms debounce
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [numPages]);

  // PDF 뷰어 페이지 사이즈 (컨테이너 크기에 맞춰) 조정
  useEffect(() => {
    let rafId: number | null = null;
    let resizeTimer: number | null = null;
    let lastWidth: number | undefined;

    const computeAndSet = () => {
      const el = pageContainerRef.current;
      if (!el) return;
      let newWidth = el.clientWidth;

      // 1) 우선 제한: (70vw - 12rem)
      const rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize || "16"
      );
      const rem16Px = 16 * rootFontSize;
      const maxWidthFrom70vwMinus12rem = Math.floor(
        window.innerWidth * 0.7 - rem16Px
      );

      if (
        typeof maxWidthFrom70vwMinus12rem === "number" &&
        !Number.isNaN(maxWidthFrom70vwMinus12rem) &&
        newWidth > maxWidthFrom70vwMinus12rem
      ) {
        newWidth = maxWidthFrom70vwMinus12rem;
        console.debug("Capped page width to 70vw-12rem max:", newWidth);
      }

      // 2) 보조 제한: 높이(70vh 기준)에서 유도된 최대 너비 (기존 로직)
      const maxHeightPx = window.innerHeight * 0.65; // 70vh보다 약간 작게 수정
      const maxWidthFrom70vh = pageAspectRatio
        ? maxHeightPx * pageAspectRatio
        : undefined;

      if (typeof maxWidthFrom70vh === "number" && newWidth > maxWidthFrom70vh) {
        newWidth = Math.floor(maxWidthFrom70vh);
        console.debug("Capped page width to 70vh-based max:", newWidth);
      }

      // Avoid updating state when width change is negligible
      if (typeof lastWidth === "number" && Math.abs(newWidth - lastWidth) < 2) {
        return;
      }

      lastWidth = newWidth;
      setPageWidth(newWidth);
      console.debug("Computed page width:", newWidth);
    };

    // Debounce schedule: wait until resizing stops, then compute once.
    const scheduleCompute = () => {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer);
      }

      // 150ms after the last resize event, run compute once inside RAF
      resizeTimer = window.setTimeout(() => {
        rafId = requestAnimationFrame(() => {
          computeAndSet();
          rafId = null;
        });
        resizeTimer = null;
      }, 150);
    };

    const ro = new ResizeObserver(scheduleCompute);
    if (pageContainerRef.current) ro.observe(pageContainerRef.current);
    if (rootRef.current && rootRef.current !== pageContainerRef.current)
      ro.observe(rootRef.current);

    window.addEventListener("resize", scheduleCompute);

    const onTransitionEnd = (e: TransitionEvent) => {
      if (
        !e.propertyName ||
        e.propertyName.includes("width") ||
        e.propertyName === "all"
      ) {
        scheduleCompute();
      }
    };
    rootRef.current?.addEventListener("transitionend", onTransitionEnd);

    // initial measurement
    scheduleCompute();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleCompute);
      rootRef.current?.removeEventListener("transitionend", onTransitionEnd);
      ro.disconnect();
    };
  }, [chatOpen, pageAspectRatio]);

  // URL에서 filename 추출
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const filenameFromUrl = params.get("filename");
      if (filenameFromUrl) {
        const decoded = decodeURIComponent(filenameFromUrl);
        const title = decoded.replace(/\.pdf$/i, ""); // .pdf 제거
        setPdfTitle(title);
      }
    }
  }, []);

  const pdfUrl = useMemo(
    () => `/api/pdfs/${encodeURIComponent(publicId)}?inline=1`,
    [publicId]
  );

  const documentOptions = useMemo(
    () => ({
      cMapUrl: "https://unpkg.com/pdfjs-dist@4.0.379/cmaps/",
      cMapPacked: true,
    }),
    []
  );

  const handleNoteChange = (pageNumber: number, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [pageNumber]: value,
    }));
  };

  // 캡쳐 기능 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!captureMode || !pdfPageRef.current) return;
    
    const rect = pdfPageRef.current.getBoundingClientRect();
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectionEnd(null);
    setIsSelecting(true);
  }, [captureMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !pdfPageRef.current) return;
    
    const rect = pdfPageRef.current.getBoundingClientRect();
    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [isSelecting]);

  const handleMouseUp = useCallback(async () => {
    if (!isSelecting || !selectionStart || !selectionEnd || !pdfPageRef.current) return;
    
    setIsSelecting(false);
    
    // 선택 영역 계산
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // 최소 크기 체크
    if (width < 10 || height < 10) {
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }
    
    try {
      // PDF 캔버스를 직접 찾기
      const pdfCanvas = pdfPageRef.current.querySelector('canvas');
      
      if (!pdfCanvas) {
        throw new Error('PDF 캔버스를 찾을 수 없습니다.');
      }
      
      // 선택 영역만 잘라내기
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      
      if (ctx) {
        // PDF 캔버스의 실제 크기 대비 표시 크기 비율 계산
        const scaleX = pdfCanvas.width / pdfCanvas.offsetWidth;
        const scaleY = pdfCanvas.height / pdfCanvas.offsetHeight;
        
        // 크롭 영역 크기 설정
        croppedCanvas.width = width * scaleX;
        croppedCanvas.height = height * scaleY;
        
        // PDF 캔버스에서 선택 영역만 복사
        ctx.drawImage(
          pdfCanvas,
          x * scaleX, y * scaleY, width * scaleX, height * scaleY,
          0, 0, width * scaleX, height * scaleY
        );
        
        // base64로 변환하여 저장
        const imageData = croppedCanvas.toDataURL('image/png', 0.95);
        setCapturedImage(imageData);
        setCaptureMode(false);
        setSelectionStart(null);
        setSelectionEnd(null);
        
        console.log('캡쳐 성공! 이미지 크기:', croppedCanvas.width, 'x', croppedCanvas.height);
      }
    } catch (error) {
      console.error('캡쳐 실패:', error);
      alert(`이미지 캡쳐에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelecting, selectionStart, selectionEnd, setCapturedImage, setCaptureMode]);

  const handleLoadSuccess = async (pdf: any) => {
    console.log("PDF loaded successfully, pages:", pdf.numPages);
    setNumPages(pdf.numPages);

    // URL에 filename이 없을 때만 메타데이터에서 제목 가져오기
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const filenameFromUrl = params.get("filename");

      if (!filenameFromUrl) {
        try {
          const metadata = await pdf.getMetadata();
          console.log("PDF metadata:", metadata);

          if (metadata.info?.Title) {
            const titleFromMeta = String(metadata.info.Title).replace(
              /\.pdf$/i,
              ""
            ); // .pdf 제거
            setPdfTitle(titleFromMeta);
          }
        } catch (error) {
          console.error("Failed to load PDF metadata:", error);
        }
      }
    }

    // 날짜는 계속 메타데이터에서 가져옴
    try {
      const metadata = await pdf.getMetadata();
      const dateString = metadata.info?.CreationDate || metadata.info?.ModDate;
      if (dateString) {
        const dateMatch = dateString.match(/D:(\d{4})(\d{2})(\d{2})/);
        if (dateMatch) {
          const [, year, month, day] = dateMatch;
          setPdfDate(`${year}.${month}.${day}`);
        }
      }
    } catch (error) {
      console.error("Failed to load PDF metadata:", error);
    }

    // 페이지 종횡비를 계산해서 나중에 높이 70vh 기준 width 제한으로 사용
    try {
      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      if (viewport && viewport.width && viewport.height) {
        setPageAspectRatio(viewport.width / viewport.height);
        console.debug(
          "Detected page aspect ratio:",
          viewport.width / viewport.height
        );
      }
    } catch (err) {
      console.error("Failed to compute page aspect ratio:", err);
    }
  };

  if (!publicId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700 text-lg">PDF ID가 제공되지 않았습니다</p>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`${
        chatOpen ? "w-[70vw]" : "w-full"
      } fixed top-0 left-0 transition-all overflow-hidden duration-300 h-screen flex flex-col`}
    >
      {/* 🔥 하나의 Document만 */}
      <Document
        className="h-screen flex overflow-hidden"
        file={pdfUrl}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={(error) => {
          console.error("PDF load error:", error);
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }}
        loading={<SkeletonLoader />}
        error={
          <div className="text-red-500 p-2 text-sm">
            <p>Failed to load PDF</p>
          </div>
        }
        options={documentOptions}
      >
        {/* [좌] 썸네일 사이드바 */}
        <div
          ref={sidebarRef}
          className="h-full w-48 min-w-48 overflow-y-auto p-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {numPages &&
            Array.from(new Array(numPages), (el, index) => (
              <div
                key={index}
                ref={(el) => {
                  thumbnailRefs.current[index + 1] = el;
                }}
                onClick={() => setCurrentPage(index + 1)}
                className={`mb-2 cursor-pointer rounded transition duration-100 relative overflow-hidden ${
                  currentPage === index + 1
                    ? "opacity-100" // 선택된 페이지만 적용
                    : "opacity-40 hover:opacity-90 text-gray-100"
                }`}
              >
                {/* 같은 Document 내의 Page 컴포넌트!!  */}
                <Page
                  pageNumber={index + 1}
                  scale={0.15}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="h-28 w-full bg-gray-200/80 rounded-sm animate-pulse" />
                  }
                  className={`rounded-sm overflow-hidden ${
                    currentPage === index + 1
                      ? "shadow-lg" // 선택된 페이지만 적용
                      : ""
                  }`}
                />
                {/* 페이지 넘버 */}
                <div className="text-center text-xs py-1 font-ibm-plex-mono text-[#545454] font-medium">
                  {index + 1}
                </div>
                {notes[index + 1] && (
                  <div
                    className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"
                    title="노트 있음"
                  />
                )}
              </div>
            ))}
        </div>

        {/* [우] 메인 PDF 뷰어 - 현재페이지 */}
        <div ref={mainViewerRef} className="flex-1 relative my-8 border-l border-[#CDCDCD] flex flex-col items-center justify-between p-4 pl-8 font-ibm-plex-mono text-[#545454] font-medium text-center">
          {/* (1) 뒤로가기 버튼 */}
          <button
            onClick={() => router.back()}
            className="absolute left-0 top-0 px-8 py-4 opacity-40 hover:opacity-100 transition-colors duration-200"
          >
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
          {/* (2) 제목 + 날짜 */}
          <div>
            <h1 className="">{pdfTitle}</h1>
            <div className="text-sm text-[#CDCDCD] pt-4">
              {pdfDate || "Date"}
            </div>
          </div>

          {/* (3) 현재 페이지 */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex-1 w-full flex flex-col justify-center items-end gap-4">
              <div>
                <span>
                  {currentPage} / {numPages || "  "}
                </span>
                <span className="pl-4">page</span>
              </div>
              <div 
                ref={pdfPageRef}
                className={`relative ${captureMode ? 'cursor-crosshair' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Page
                  pageNumber={currentPage}
                  className="rounded-2xl overflow-hidden rounded-xl"
                  width={pageWidth}
                  renderMode="canvas"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="w-full h-[70vh] bg-gray-200/80 rounded-2xl animate-pulse" />
                  }
                />
                {/* 캡쳐 모드 안내 */}
                {captureMode && (
                  <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                      캡쳐할 영역을 드래그하세요
                    </div>
                  </div>
                )}
                {/* 선택 영역 표시 */}
                {isSelecting && selectionStart && selectionEnd && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                    style={{
                      left: Math.min(selectionStart.x, selectionEnd.x),
                      top: Math.min(selectionStart.y, selectionEnd.y),
                      width: Math.abs(selectionEnd.x - selectionStart.x),
                      height: Math.abs(selectionEnd.y - selectionStart.y),
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 노트 섹션 */}
          <div ref={pageContainerRef} className="w-full min-h-32 mx-auto mt-4">
            <textarea
              value={notes[currentPage] || ""}
              onChange={(e) => handleNoteChange(currentPage, e.target.value)}
              placeholder="노트 작성"
              className="w-full h-full pt-4 border-t border-[#CDCDCD] resize-none focus:outline-none focus:ring-0 font-ibm-plex-mono text-sm"
            />
            <div className="flex justify-between items-center mt-2 text-xs text-[#CDCDCD]">
              <span>{notes[currentPage]?.length || 0} 글자</span>
              {notes[currentPage] && (
                <button
                  onClick={() => handleNoteChange(currentPage, "")}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete Note
                </button>
              )}
            </div>
          </div>
        </div>
      </Document>
    </div>
  );
}
