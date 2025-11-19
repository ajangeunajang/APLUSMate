"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// react-pdf를 동적으로 로드하여 SSR 문제 해결
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// PDF worker 설정
if (typeof window !== 'undefined') {
  import("react-pdf").then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

type Props = {
  publicId: string;
};

export default function PdfViewerClient({ publicId }: Props) {
  const [scale, setScale] = useState(1.0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notes, setNotes] = useState<{ [key: number]: string }>({});

  const pdfUrl = useMemo(
    () => `/api/pdfs/${encodeURIComponent(publicId)}?inline=1`,
    [publicId]
  );

  const documentOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  }), []);

  const handleNoteChange = (pageNumber: number, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [pageNumber]: value,
    }));
  };

  console.log('PDF URL:', pdfUrl);

  if (!publicId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700 text-lg">PDF ID가 제공되지 않았습니다</p>
      </div>
    );
  }

  return (
    <div className="w-[70vw] h-screen flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* 썸네일 사이드바 */}
        <div className="w-48 border-r border-[#CDCDCD] overflow-y-auto m-8 mr-4 pr-8">
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => {
              console.log("PDF loaded successfully, pages:", numPages);
              setNumPages(numPages);
            }}
            onLoadError={(error) => {
              console.error("PDF load error:", error);
              console.error("Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack,
              });
            }}
            loading={
              <div className="text-gray-500 text-sm p-2">Loading...</div>
            }
            error={
              <div className="text-red-500 p-2 text-sm">
                <p>Failed to load PDF</p>
              </div>
            }
            options={documentOptions}
          >
            {numPages &&
              Array.from(new Array(numPages), (el, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`mb-2 cursor-pointer rounded overflow-hidden transition relative ${
                    currentPage === index + 1
                      ? "border-blue-500"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <Page
                    pageNumber={index + 1}
                    scale={0.2}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
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
          </Document>
        </div>

        {/* 메인 PDF 뷰어 */}
        <div className="flex-1 overflow-auto items-center justify-center p-4 py-8 font-ibm-plex-mono text-[#545454] font-medium text-center">
          {/* 현재 페이지 */}
          <h1 className="p-8">Title W7-1 Radiosity</h1>
          <div className="text-sm text-[#CDCDCD]">2025.55.55</div>
          <div className="text-sm flex items-center justify-end gap-4 py-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              prev
            </button>
            <div className="">
              <span>
                {currentPage} / {numPages || "  "}
              </span>
              <span className="pl-4">page</span>
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(numPages || prev, prev + 1))
              }
              disabled={currentPage === numPages}
              className="px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              next
            </button>
          </div>
          <div className="text-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="min-h-[50vh] text-gray-500 p-8">Loading PDF...</div>}
              error={
                <div className="text-red-500 p-4">
                  <p>Failed to load PDF file.</p>
                  <p className="text-sm mt-2">URL: {pdfUrl}</p>
                  <p className="text-sm">Check console for details.</p>
                </div>
              }
              options={documentOptions}
            >
              <Page pageNumber={currentPage} scale={scale} />
            </Document>
          </div>

          {/* 노트 섹션 */}
          <div className="mt-16 w-full h-32 mx-auto">
            <div className="">
              <textarea
                value={notes[currentPage] || ""}
                onChange={(e) => handleNoteChange(currentPage, e.target.value)}
                placeholder="여기에 노트를 작성하세요..."
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
        </div>
      </div>
    </div>
  );
}
