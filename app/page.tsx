'use client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  console.log(session);
  const fullName = (session?.user?.name || '').trim();
  const firstOnly = fullName.split(/\s+/)[0] || '';
  console.log(firstOnly);

  // 로그인 상태에 따라 초기 팝업 상태 설정
  const [isPopupOpen, setIsPopupOpen] = useState(() => {
    // 초기 렌더링 시에는 항상 true로 시작 (세션이 로드되기 전까지)
    return true;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 세션 상태가 변경될 때마다 팝업 상태 업데이트
  useEffect(() => {
    if (status === 'authenticated') {
      // 로그인된 경우 팝업 닫기
      setIsPopupOpen(false);
    } else if (status === 'unauthenticated') {
      // 로그인 안 된 경우 팝업 열기
      setIsPopupOpen(true);
    }
    // 'loading' 상태는 무시 (세션 로딩 중)
  }, [status]);

  // 파일 처리 로직을 공통 함수로 분리
  const processFile = async (file: File) => {
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  // drag drop 핸들러
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F2] font-sans dark:bg-black">
      <Image
        className="fixed top-8 left-8 z-10"
        src="/logo.svg"
        alt="logo"
        width={130}
        height={30}
        priority
      />

      <nav
        className={`fixed h-full flex flex-col ${
          isPopupOpen
            ? 'w-1/3  top-0 left-0 justify-center '
            : 'w-1/6 top-36 left-8'
        } `}
      >
        {isPopupOpen && (
          <div className="flex flex-col gap-8 p-8">
            <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              PDF 창, 챗봇 창을 <br />
              번갈아가며 공부하고 있나요?
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              이제 수업자료에서 바로 AI에게 질문하세요.{' '}
              <br className="hidden sm:block" />
              페이지별 질문, 대화 저장으로 공부 흐름이 끊기지 않습니다.
            </p>
          </div>
        )}

        {!isPopupOpen && (
          <div>
            <h1 className="p-2 font-ibm-plex-mono font-bold">
              {firstOnly
                ? `${firstOnly}${firstOnly.endsWith('s') ? "'" : "'s"} Desk`
                : 'Your Desk'}
            </h1>
            <ul className="flex flex-col gap-2 font-ibm-plex-mono font-medium">
              <li className="bg-[#D9D9D9] px-4 py-2 rounded-lg w-full">
                Documents
              </li>
              <li className="text-zinc-300 px-4 py-2 rounded-lg w-full cursor-not-allowed">
                Bookmarks
              </li>
              <li className="text-zinc-300 px-4 py-2 rounded-lg w-full cursor-not-allowed">
                Shop
              </li>
            </ul>
          </div>
        )}
      </nav>

      <section
        className={`fixed top-20 ${
          isPopupOpen ? 'left-1/3 w-2/3' : 'left-1/5 w-4/5'
        } rounded-48  h-full flex flex-col items-center justify-center gap-12 p-8 sm:items-start transition-all duration-600`}
      >
        <div className="rounded-[48px] bg-white dark:bg-black w-full h-full p-8 gap-6 text-center items-start text-left flex flex-col sm:justify-center sm:items-center">
          {isPopupOpen && (
            <div className="flex flex-col items-center justify-center w-1/2 pb-16">
              <h1 className="max-w-s text-2xl font-ibm-plex-mono font-medium leading-10 tracking-tight text-black dark:text-zinc-50 mb-16">
                Create Your Space
              </h1>
              <div className="flex flex-col gap-12 w-full">
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-ibm-plex-mono text-black dark:text-zinc-50">
                    Name
                  </label>
                  <input
                    type="text"
                    // value={name}
                    // onChange={(e) => setName(e.target.value)}
                    className="font-ibm-plex-mono text-sm  pb-2 border-b-2 border-black focus:outline-none bg-white dark:bg-black text-black dark:text-zinc-50"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="text-sm font-ibm-plex-mono text-black dark:text-zinc-50">
                    Password
                  </label>
                  <input
                    type="password"
                    // value={password}
                    // onChange={(e) => setPassword(e.target.value)}
                    className="font-ibm-plex-mono text-sm  pb-2 border-b-2 border-black focus:outline-none bg-white dark:bg-black text-black dark:text-zinc-50"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <div className="mt-12 sm:pt-0 w-full">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="w-full font-ibm-plex-mono bg-gray-600 hover:bg-gray-300 transition-colors duration-300 text-white px-4 py-2 rounded-full font-medium"
                >
                  Get Started
                </button>
              </div>
              <p className="text-sm mt-2 font-ibm-plex-mono font-medium text-zinc-500">
                Already have an account? <a href="/login">Login</a>
              </p>
              <div className="mt-12 sm:pt-0 w-full hover:opacity-20 transition-opacity duration-300">
                <button
                  onClick={() => {
                    setIsPopupOpen(false);
                    signIn('google', { callbackUrl: '/' });
                  }}
                  className="w-full font-ibm-plex-mono border-black border-1 transition-colors duration-300 text-black px-4 py-2 rounded-full font-medium"
                >
                  Continue with Google
                </button>
              </div>
              <div className="mt-2 sm:pt-0 w-full hover:opacity-20 transition-opacity duration-300">
                <button className="w-full font-ibm-plex-mono border-black border-1 transition-colors duration-300 text-black px-4 py-2 rounded-full font-medium">
                  Continue with Apple
                </button>
              </div>
            </div>
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`hover:opacity-20 transition-opacity duration-300 w-full h-1/3 flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isDragging ? 'opacity-10 border-blue-800' : ''
                  }`}
                >
                  <div
                    className={`w-full h-full border-2 border-black border-dotted rounded-[24px] flex items-center justify-center 
                     `}
                  >
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
