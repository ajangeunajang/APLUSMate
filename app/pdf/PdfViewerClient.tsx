"use client";

import { useState } from "react";

type Props = {
  publicId: string;
};

export default function PdfViewerClient({ publicId }: Props) {
  const [scale, setScale] = useState(1.0);
  const pdfUrl = `/api/pdfs/${encodeURIComponent(publicId)}?inline=1`;

  if (!publicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-xl font-semibold text-gray-700">
            PDF ID가 제공되지 않았습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <iframe
        src={pdfUrl}
        style={{
          width: `${scale * 100}%`,
          height: `${scale * 80}%`,
        }}
        title="PDF Viewer"
      />
    </div>
  );
}
