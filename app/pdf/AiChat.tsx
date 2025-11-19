"use client";
import Image from "next/image";
import { useState, useRef } from "react";

export default function AiChat() {
  const [chatOpen, setChatOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      setMessages([...messages, { text: message, sender: "user" }]);
      setMessage("");
      adjustHeight();
      // 여기서 AI 응답 처리  API 호출)
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

      <div
        className={`fixed p-8 overflow-hidden transition-all duration-300 ${
          chatOpen
            ? "bottom-0 right-0 w-[30vw] min-w-[450px] h-full"
            : "bottom-12 right-12 w-[50px] h-[50px]"
        }`}
      >
        <div className="w-full h-full bg-white rounded-[48px] p-8 flex flex-col">
          <div className="flex justify-between">
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
              Close
            </button>
          </div>
          <h2
            className={`relative top-1/3 font-ibm-plex-mono transition-opacity duration-300 font-medium text-center mb-12 ${
              messages.length === 0 ? "opacity-100" : "opacity-0"
            }`}
          >
            Any Questions?
          </h2>
          {/* 채팅 버블 */}
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-3 px-4 ml-auto rounded-[24px] w-fit max-w-5/6 ${
                  msg.sender === "user"
                    ? "bg-[#F2F2F2] text-left"
                    : "bg-gray-100"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          {/* 입력창 */}
          <div
            className={`relative transition-all duration-300 ${
              messages.length === 0 ? "bottom-1/2 mx-10" : "bottom-0"
            }`}
          >
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
              className="absolute right-0 top-0 p-4 focus:outline-none hover:brightness-40 duration-200 transition-brightness"
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
            <div className="text-center text-sm font-medium flex items-center justify-center mt-4 gap-4">
              <svg
                width="40"
                height="21"
                viewBox="0 0 40 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 18V16.125H1V18C1 19.1046 1.89543 20 3 20V21L2.8457 20.9961C1.26055 20.9158 0 19.6051 0 18ZM5.83301 20V21H3V20H5.83301ZM17.167 20V21H11.5V20H17.167ZM28.5 20V21H22.833V20H28.5ZM37 20V21H34.167V20H37ZM40 18C40 19.6569 38.6569 21 37 21V20C38.1046 20 39 19.1046 39 18V16.125H40V18ZM1 8.625V12.375H0V8.625H1ZM40 8.625V12.375H39V8.625H40ZM0 3C0 1.34315 1.34315 0 3 0H5.83301V1H3C1.89543 1 1 1.89543 1 3V4.875H0V3ZM40 4.875H39V3C39 1.89543 38.1046 1 37 1H34.167V0H37C38.6569 0 40 1.34315 40 3V4.875ZM17.167 0V1H11.5V0H17.167ZM28.5 0V1H22.833V0H28.5Z"
                  fill="black"
                />
              </svg>
              부분 선택 후 질문하기
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
