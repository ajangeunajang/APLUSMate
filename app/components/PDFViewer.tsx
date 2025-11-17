'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PDFViewerProps {
  filePath: string;
  fileName: string;
}

export default function PDFViewer({ filePath, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F2F2F2]">
      {/* 헤더 */}
      <div className="bg-white p-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <a href="/" className="hover:opacity-70">
            <Image src="/logo.svg" alt="logo" width={130} height={30} />
          </a>
          <h1 className="font-ibm-plex-mono font-medium text-sm truncate max-w-md">
            {fileName}
          </h1>
        </div>
        <a
          href="/"
          className="font-ibm-plex-mono text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </a>
      </div>

      {/* PDF 뷰어 */}
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <iframe
          src={`${filePath}#toolbar=1&navpanes=0`}
          className="w-full h-full"
          title={fileName}
        />
      </div>
    </div>
  );
}