'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PDFPage() {
  const params = useParams();
  const router = useRouter();
  const [fileName, setFileName] = useState('PDF Document');

  // [...path] 배열을 다시 경로로 합치기
  const filePath = Array.isArray(params.path)
    ? `/${params.path.join('/')}`
    : `/${params.path}`;

  useEffect(() => {
    if (filePath) {
      const name = filePath.split('/').pop() || 'PDF';
      setFileName(decodeURIComponent(name));
    }
  }, [filePath]);

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
        <button
          onClick={() => router.back()}
          className="font-ibm-plex-mono text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>
      </div>

      {/* PDF 뷰어 */}
      <div className="flex-1 overflow-hidden flex items-center justify-center">
        <iframe
          src={`/api/pdf-viewer?path=${encodeURIComponent(filePath)}`}
          className="w-full h-full border-0"
          title={fileName}
        />
      </div>
    </div>
  );
}