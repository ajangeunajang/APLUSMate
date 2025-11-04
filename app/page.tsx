'use client';
import Image from 'next/image';
import { useState, useRef } from 'react';

export default function Home() {
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('선택된 파일:', file.name, file.type, file.size);

    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    const formData = new FormData();
    formData.append('pdf_file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('업로드 실패:', errData);
        alert(errData.error || '업로드에 실패했습니다.');
        return;
      }

      const data = await response.json();
      console.log('업로드 성공:', data);
      alert(`PDF 업로드 완료!\n파일 이름: ${data.filename}`);
    } catch (error) {
      console.error('에러 발생:', error);
      alert('서버에 연결할 수 없습니다.');
    }
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2] font-sans dark:bg-black">
      <Image
        className="fixed top-8 left-8 z-10"
        src="/aplusmatelogo.svg"
        alt="logo"
        width={100}
        height={20}
        priority
      />
      <nav className="fixed top-36 left-8 w-1/6 font-ibm-plex-mono font-medium">
        <ul className="flex flex-col gap-2">
          <li className="bg-[#D9D9D9] px-4 py-2 rounded-lg w-full">
            Documents
          </li>
          <li className=" px-4 py-2 rounded-lg w-full cursor-not-allowed">
            Bookmarks
          </li>
        </ul>
      </nav>

      <section
        className={`fixed top-20 ${
          isPopupOpen ? 'left-0 w-1/2' : 'left-1/5 w-4/5'
        } rounded-48  h-full flex flex-col items-center justify-center gap-12 p-8 sm:items-start transition-all duration-600`}
      >
        <div className="rounded-[48px] bg-white dark:bg-black w-full h-full flex flex-col justify-center p-8 gap-6 text-center sm:items-start sm:text-left">
          {isPopupOpen && (
            <>
              <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                PDF 창, 챗봇 창을 <br />
                번갈아가며 공부하고 있나요?
              </h1>
              <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                이제 수업자료에서 바로 AI에게 질문하세요.{' '}
                <br className="hidden sm:block" />
                페이지별 질문, 대화 저장으로 공부 흐름이 끊기지 않습니다.
              </p>
              <div className="mt-12 sm:pt-0">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="font-ibm-plex-mono bg-black hover:bg-[#1F4E8B] transition-colors duration-300 text-white px-4 py-2 rounded-full font-semibold"
                >
                  Get Started
                </button>
              </div>
            </>
          )}
          {!isPopupOpen && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="grid grid-cols-3 gap-4 w-full h-full">
                <div
                  onClick={handleDivClick}
                  className="hover:opacity-20 transition-opacity duration-300 w-full h-1/3 flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-full h-full border-2 border-black border-dotted rounded-[24px] flex items-center justify-center">
                    <svg
                      width="59"
                      height="59"
                      viewBox="0 0 59 59"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M30 0V59" stroke="black" />
                      <path d="M59 30L0 30" stroke="black" />
                    </svg>
                  </div>
                  <h3>New</h3>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
