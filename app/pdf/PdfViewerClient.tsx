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

  const pdfUrl = `/api/pdfs/${encodeURIComponent(publicId)}?inline=1`;

  const documentOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.0.379/cmaps/',
    cMapPacked: true,
  }), []);

  console.log('PDF URL:', pdfUrl);

  if (!publicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">PDF ID가 제공되지 않았습니다</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center bg-gray-50 py-6 overflow-auto">
      {/* PDF 컨트롤 UI */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setScale((prev) => prev + 0.1)}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          +
        </button>
        <button
          onClick={() => setScale((prev) => Math.max(0.2, prev - 0.1))}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          -
        </button>
      </div>

      {/* PDF 뷰어 */}
      <div className="shadow-lg bg-white p-4 rounded-xl">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => {
            console.log('PDF loaded successfully, pages:', numPages);
            setNumPages(numPages);
          }}
          onLoadError={(error) => {
            console.error('PDF load error:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
          }}
          loading={<div className="text-gray-500">Loading PDF...</div>}
          error={
            <div className="text-red-500 p-4">
              <p>Failed to load PDF file.</p>
              <p className="text-sm mt-2">URL: {pdfUrl}</p>
              <p className="text-sm">Check console for details.</p>
            </div>
          }
          options={documentOptions}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              scale={scale}
              className="mb-4"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
