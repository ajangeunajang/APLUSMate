'use client';
import Image from 'next/image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import LandingMessage from './components/LandingMessage';

interface PDFFile {
  public_id: string;
  filename: string;
  file_path: string;
  profile_image_path: string;
  user_id: string;
  upload_time: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const fullName = (session?.user?.name || '').trim();
  const firstOnly = fullName.split(/\s+/)[0] || '';

  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(() => {
    return true;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // 사용자 PDF 파일 목록 조회
  const fetchPdfFiles = useCallback(async () => {
    try {
      const userId = session?.user?.id || (session?.user?.name || '').trim();
      if (!userId) {
        console.warn('fetchPdfFiles: User ID가 없습니다.');
        return;
      }

      const response = await fetch(
        `/api/pdfs/my_pdfs?user_id=${encodeURIComponent(userId)}`,
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        const data = await response.json();
        const files = Array.isArray(data) ? data : data.pdfs || [];
        setPdfFiles(files);
        return;
      } else {
        const errorText = await response.text();
        console.error(
          '❌ PDF 로드 실패 - Status:',
          response.status,
          'Body:',
          errorText
        );
      }
    } catch (error) {
      console.error('PDF 파일 목록 조회 중 예외:', error);
    }
  }, [session?.user?.id, session?.user?.name]);

  // 세션 상태 변경될 때마다 팝업 상태 업데이트
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // 로그인된 경우 팝업 닫기
      setIsLoginPopupOpen(false);
      fetchPdfFiles();
    } else if (status === 'unauthenticated') {
      setIsLoginPopupOpen(true);
    }
  }, [status, session?.user?.id, fetchPdfFiles]);

  // 파일 처리 공통 함수로 분리
  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('PDF 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append(
      'user_id',
      session?.user?.id || (session?.user?.name || '').trim()
    );

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || '업로드에 실패했습니다.');
        return;
      }

      // 업로드 성공 - PDF 목록 새로고침
      await fetchPdfFiles();
      setShowUploadSuccess(true);
      setTimeout(() => setShowUploadSuccess(false), 5000);
    } catch {
      alert('서버에 연결할 수 없습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || isUploading) return;
    await processFile(file);
  };

  const handleDivClick = () => {
    if (isUploading) return;
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

    if (isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  // 회원가입 핸들러
  const handleRegister = async () => {
    if (!name.trim() || !password.trim()) {
      alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsRegistering(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: name.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          (typeof data === 'object' && data !== null && 'detail' in data
            ? data.detail
            : null) ||
          (typeof data === 'string' ? data : null) ||
          '회원가입에 실패했습니다.';

        if (
          errorMessage.includes('already registered') ||
          errorMessage.includes('User ID already')
        ) {
          const loginResult = await signIn('credentials', {
            user_id: name.trim(),
            password: password.trim(),
            redirect: false,
          });

          if (loginResult?.ok) {
            setName('');
            setPassword('');
            setIsLoginPopupOpen(false);
            return;
          } else {
            alert('비밀번호를 확인해주세요');
            return;
          }
        }

        alert(errorMessage);
        return;
      }

      // const message =
      //   (typeof data === 'object' && data !== null && 'message' in data
      //     ? data.message
      //     : null) || '회원가입이 성공적으로 완료되었습니다.';
      // alert(message);

      // 회원가입 성공 시 자동 로그인
      const loginResult = await signIn('credentials', {
        user_id: name.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (loginResult?.ok) {
        setName('');
        setPassword('');
        setIsLoginPopupOpen(false);
      } else {
        alert('로그인에 실패했습니다. 다시 로그인해주세요.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('서버에 연결할 수 없습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F2F2F2] font-sans overflow-hidden">
      <Image
        className="fixed top-8 left-8 z-10"
        src="/logo.svg"
        alt="logo"
        width={130}
        height={30}
        priority
      />

      <nav
        className={`fixed  z-10 h-full flex flex-col ${
          isLoginPopupOpen
            ? "w-full sm:w-1/3  top-0 left-0 justify-center "
            : "w-1/6 top-36 left-8"
        } `}
      >
        {isLoginPopupOpen && <LandingMessage />}

        {!isLoginPopupOpen && (
          <div>
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
            <div className="fixed bottom-0 left-0 p-4">
              <h1 className="inline-block text-gray-400 text-sm p-2 pl-4 pb-4 font-ibm-plex-mono font-bold">
                {firstOnly
                  ? `${firstOnly}${firstOnly.endsWith("s") ? "'" : "'s"} Desk |`
                  : "Your Desk"}
              </h1>

              <button
                onClick={() => signOut()}
                className="cursor-pointer hover:text-gray-600 transition-colors duration-300 font-ibm-plex-mono p-2 text-gray-400 text-sm font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <section
        className={`fixed overflow-y-scroll left-0 w-full h-screen sm:top-20 ${
          isLoginPopupOpen ? "sm:left-1/3 sm:w-2/3" : "sm:left-1/5 sm:w-4/5"
        }   flex flex-col items-center justify-center gap-12 p-8 sm:items-start transition-all duration-600`}
      >
        <div
          className={`rounded-[48px] bg-white w-full h-auto sm:h-full p-8 gap-6 text-center flex flex-col items-center ${
            isLoginPopupOpen ? "justify-center" : "justify-start"
          }`}
        >
          {isLoginPopupOpen && (
            <div className="flex flex-col overflow-y-scroll items-center justify-start w-full lg:w-1/2 pb-20">
              <h1 className="max-w-s text-lg sm:text-2xl font-ibm-plex-mono font-medium leading-10 tracking-tight text-black dark:text-zinc-50 mb-12 sm:mb-16">
                Create Your Space
              </h1>
              <div className="flex flex-col gap-6 sm:gap-12 w-full">
                <div className="flex flex-col gap-4">
                  <label className="text-xs text-left sm:text-sm font-ibm-plex-mono text-black dark:text-zinc-50">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="font-ibm-plex-mono text-xs sm:text-sm  pb-2 border-b-2 bg-transparent border-black focus:outline-none bg-white dark:bg-black text-black dark:text-zinc-50"
                    placeholder="Enter your name"
                    disabled={isRegistering}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <label className="text-xs text-left sm:text-sm font-ibm-plex-mono text-black dark:text-zinc-50">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-ibm-plex-mono text-xs sm:text-sm  pb-2 border-b-2 bg-transparent border-black focus:outline-none bg-white dark:bg-black text-black dark:text-zinc-50"
                    placeholder="Enter your password"
                    disabled={isRegistering}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isRegistering) {
                        handleRegister();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-6 sm:mt-12 sm:pt-0 w-full">
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className="text-xs sm:text-sm w-full font-ibm-plex-mono bg-gray-600 hover:bg-gray-300 transition-colors duration-300 text-white px-4 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? "Take it slow..." : "Get Started"}
                </button>
              </div>
              <p className="text-xs sm:text-sm mt-2 font-ibm-plex-mono font-medium text-zinc-500">
                Study better with A+MATE
              </p>
              <div className="mt-8 sm:mt-12 sm:pt-0 w-full hover:opacity-20 transition-opacity duration-300">
                <button
                  onClick={() => {
                    setIsLoginPopupOpen(false);
                    signIn("google", { callbackUrl: "/" });
                  }}
                  className="w-full flex gap-4 justify-center font-ibm-plex-mono border-black border-1 transition-colors duration-300 text-black px-4 py-2 rounded-full font-medium text-xs sm:text-sm"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5">
                    <Image
                      src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp"
                      alt="google logo"
                      width={20}
                      height={20}
                    />
                  </div>
                  <div>Continue with Google</div>
                </button>
              </div>
              <div className="mt-2 sm:pt-0 w-full flex gap-4 justify-center  opacity-20  transition-opacity duration-300">
                <button className="cursor-not-allowed w-full font-ibm-plex-mono border-black border-1 transition-colors duration-300 text-black px-4 py-2 rounded-full font-medium text-xs sm:text-sm">
                  Continue with Apple
                </button>
              </div>
            </div>
          )}
          {/* 로그인 시 유저 pdf 목록 불러오기 */}
          {!isLoginPopupOpen && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {/* 업로드 영역 */}
                <div
                  onClick={handleDivClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`hover:opacity-20 transition-opacity duration-300 w-full aspect-3/2 flex flex-col items-center justify-center gap-2 ${
                    isUploading ? "cursor-wait opacity-50" : "cursor-pointer"
                  } ${isDragging ? "opacity-10 border-blue-800" : ""}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Space") {
                      e.preventDefault();
                      handleDivClick();
                    }
                  }}
                >
                  <div
                    className={`w-full h-full border-2 border-black border-dotted rounded-[24px] flex items-center justify-center`}
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    ) : (
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
                    )}
                  </div>
                  <h3 className="font-ibm-plex-mono font-medium">
                    {isUploading ? "Uploading..." : "New"}
                  </h3>
                </div>

                {/* PDF 파일 목록 */}
                {pdfFiles.map((pdf, index) => (
                  <a
                    key={index}
                    href={`/pdf/${encodeURIComponent(pdf.public_id)}`}
                    target="_self"
                    rel="noopener noreferrer"
                    className="w-full aspect-3/2 flex flex-col items-center justify-start gap-2 transition-colors duration-300 cursor-pointer"
                  >
                    <div className="w-full h-full bg-gray-100 hover:bg-gray-200 transition-color duration-500 rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors duration-300 cursor-pointer">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-ibm-plex-mono font-medium text-xs text-center leading-loose truncate w-full">
                        {pdf.filename}
                      </h3>
                      <p className="font-ibm-plex-mono text-xs text-gray-500">
                        {new Date(pdf.upload_time).toLocaleDateString()}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
