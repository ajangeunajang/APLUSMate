"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useChatContext } from "./ChatContext";

// AI 응답 텍스트 포맷팅
function formatAIResponse(text: string) {
  return text.split('\n').map((line, lineIndex) => {
    // **텍스트** 형식을 찾아서 볼드 처리
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(line)) !== null) {
      // ** 앞의 일반 텍스트
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lineIndex}-${lastIndex}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }
      // ** 안의 볼드 텍스트
      parts.push(
        <strong key={`bold-${lineIndex}-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // 남은 텍스트
    if (lastIndex < line.length) {
      parts.push(
        <span key={`text-${lineIndex}-${lastIndex}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }
    
    // 빈 줄이면 마진만, 아니면 내용과 마진
    if (line.trim() === '') {
      return <div key={lineIndex} className="h-4"></div>;
    }
    
    return (
      <div key={lineIndex} className="mb-3 leading-relaxed">
        {parts.length > 0 ? parts : line}
      </div>
    );
  });
}

export default function AiChat() {
  const { chatOpen, setChatOpen, captureMode, setCaptureMode, capturedImage, setCapturedImage, publicId, currentPage } = useChatContext();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: string; image?: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  // 캡쳐된 이미지가 있을 때 메시지에 자동 추가
  useEffect(() => {
    if (capturedImage) {
      // 이미지가 캡쳐되면 채팅창 열기
      if (!chatOpen) {
        setChatOpen(true);
      }
    }
  }, [capturedImage, chatOpen, setChatOpen]);

  const handleSend = async () => {
    if (!message.trim() && !capturedImage) return;
    
    const newMessage = {
      text: message,
      sender: "user",
      image: capturedImage || undefined
    };
    
    setMessages((prev) => [...prev, newMessage]);
    const currentQuestion = message;
    const currentImage = capturedImage;
    setMessage("");
    setCapturedImage(null);
    setIsLoading(true);
    
    // reset inline height so min-height (3rem) from tailwind takes effect
    if (textareaRef.current) {
      textareaRef.current.style.height = "3rem";
    }
    
    try {
      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("page_number", currentPage.toString());
      formData.append("question_query", currentQuestion);
      
      // 이미지가 있으면 base64를 Blob으로 변환하여 추가
      if (currentImage) {
        const response = await fetch(currentImage);
        const blob = await response.blob();
        formData.append("image_file", blob, "captured_image.png");
      }
      
      const apiResponse = await fetch('/api/chat/query', {
        method: 'POST',
        body: formData
      });
      
      if (!apiResponse.ok) {
        throw new Error(`API 요청 실패: ${apiResponse.status}`);
      }
      
      const data = await apiResponse.json();
      
      // 응답이 문자열이면 그대로, 객체이면 answer 필드 사용
      const answerText = typeof data === 'string' ? data : (data.answer || '응답을 받지 못했습니다.');
      
      setMessages(prev => [...prev, { text: answerText, sender: 'ai' }]);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      setMessages(prev => [...prev, { 
        text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.', 
        sender: 'ai' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed right-0 bottom-0">
      {/* 토글 */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-8 right-8 bg-white h-1/10 aspect-square p-3 rounded-full transition-all duration-300 hover:bg-gray-200 ${
          chatOpen ? "" : "z-50 shadow-lg"
        }`}
      >
        <Image
          className=""
          src="/logo.svg"
          alt="logo"
          width={100}
          height={30}
          priority
        />
      </button>

      {/* 채팅창 */}
      <div
        className={`fixed p-8 overflow-hidden transition-all duration-300 ${
          chatOpen
            ? "bottom-0 right-0 w-[30vw] min-w-[450px] h-full"
            : "bottom-12 right-12 w-[50px] h-[50px]"
        }`}
      >
        <div className="w-full h-full bg-white overflow-hidden rounded-[48px] p-8 flex flex-col items-center">
          {/* header */}
          <div className="flex justify-between w-full">
            <Image
              className=""
              src="/logo.svg"
              alt="logo"
              width={100}
              height={30}
              priority
            />

            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="font-medium font-ibm-plex-mono text-sm"
            >
              <svg
                width="33"
                height="33"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M24.5146 8.2627L8.26367 24.5137" stroke="black" />
                <path d="M24.2388 24.5146L7.98779 8.26367" stroke="black" />
              </svg>
            </button>
          </div>

          {/* 입력창 */}
          <div
            className={`w-full relative transition-all duration-300 flex flex-col items-center gap-2 ${
              messages.length === 0
                ? "top-[40%] -translate-y-1/2"
                : "top-0 h-full justify-between"
            }`}
          >
            <h2
              className={`relative font-ibm-plex-mono transition-opacity duration-300 font-medium text-center ${
                messages.length === 0 ? "opacity-100" : "opacity-0 max-h-4"
              }`}
            >
              Any Questions?
            </h2>

            {/* 채팅 버블 */}
            <div
              className={`transition-opacity w-full duration-300 overflow-x-hidden overflow-y-auto mb-4 ${
                messages.length === 0 ? "h-0 opacity-0" : "flex-1 opacity-100"
              }`}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`text-left break-words mb-2  ml-auto rounded-[24px] ${
                    msg.sender === "user"
                      ? "bg-[#F2F2F2]  w-fit max-w-5/6 p-3 px-4"
                      : "w-full mt-12"
                  }`}
                >
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="캡쳐된 이미지"
                      className="max-w-full rounded-lg mb-2"
                    />
                  )}
                  {msg.sender === "ai" ? (
                    <div>{formatAIResponse(msg.text)}</div>
                  ) : (
                    msg.text
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="break-words mb-2 rounded-[24px] w-full">
                  <span className="animate-pulse">AI가 응답하는 중...</span>
                </div>
              )}
            </div>

            {/* 입력창 */}
            <div
              className={`w-full max-w-[500px] relative transition-all duration-300 min-w-[320px] flex flex-col items-center `}
            >
              {/* 캡쳐된 이미지 미리보기 */}
              {capturedImage && (
                <div className="relative mb-2 inline-block">
                  <img
                    src={capturedImage}
                    alt="캡쳐 미리보기"
                    className="max-w-[200px] rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="absolute -top-2 -right-2 bg-gray-500 transition-colors duration-200 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="relative text-center w-full">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    adjustHeight();
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="무엇이든 물어보세요"
                  rows={1}
                  className={`max-h-[200px] min-h-[3rem] w-full flex-1 py-2 pt-3 pl-4 pr-12 border border-black rounded-[24px] focus:outline-none resize-none overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 `}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-0 top-0 p-4 focus:outline-none hover:brightness-40 duration-200 transition-brightness disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    width="23"
                    height="16"
                    viewBox="0 0 23 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 -1.00536e-06L6.62847 2.27094L6.62847 13.7291L-6.99382e-07 16L-5.53606e-07 12.665L3.65482 11.4581L3.65482 4.54187L-1.47284e-07 3.36946L0 -1.00536e-06ZM7.03247 5.64039L7.03247 2.41379L23 7.87685L23 8.16256L7.03247 13.5911L7.03247 10.3645L14.2059 8.02463L7.03247 5.65025L7.03247 5.64039Z"
                      fill="#D9D9D9"
                    />
                  </svg>
                </button>
              </div>
              {/* pdf 캡쳐버튼 */}
              <button
                onClick={() => {
                  setCaptureMode(!captureMode);
                  if (chatOpen) setChatOpen(false);
                }}
                className={`cursor-pointer text-center text-sm font-medium flex items-center justify-center mt-4 gap-4 transition-colors duration-200 ${
                  captureMode
                    ? "text-blue-600"
                    : "text-black hover:text-gray-600"
                }`}
              >
                <svg
                  width="40"
                  height="21"
                  viewBox="0 0 40 21"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 18V16.125H1V18C1 19.1046 1.89543 20 3 20V21L2.8457 20.9961C1.26055 20.9158 0 19.6051 0 18ZM5.83301 20V21H3V20H5.83301ZM17.167 20V21H11.5V20H17.167ZM28.5 20V21H22.833V20H28.5ZM37 20V21H34.167V20H37ZM40 18C40 19.6569 38.6569 21 37 21V20C38.1046 20 39 19.1046 39 18V16.125H40V18ZM1 8.625V12.375H0V8.625H1ZM40 8.625V12.375H39V8.625H40ZM0 3C0 1.34315 1.34315 0 3 0H5.83301V1H3C1.89543 1 1 1.89543 1 3V4.875H0V3ZM40 4.875H39V3C39 1.89543 38.1046 1 37 1H34.167V0H37C38.6569 0 40 1.34315 40 3V4.875ZM17.167 0V1H11.5V0H17.167ZM28.5 0V1H22.833V0H28.5Z"
                    fill="currentColor"
                  />
                </svg>
                {captureMode ? "캡쳐 모드" : "캡쳐해서 질문하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
