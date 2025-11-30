"use client";

export default function SkeletonLoader() {
  return (
    <div className="h-screen w-[70vw] flex">
      {/* 썸네일 사이드바 스켈레톤 */}
      <div className="w-48 px-8 my-8 space-y-4 overflow-hidden border-r border-[#CDCDCD]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200/80 dark:bg-gray-700 rounded-md animate-pulse mb-8"
          />
        ))}
      </div>

      {/* 메인 콘텐츠 스켈레톤 */}
      <div className="flex-1 relative my-8 border-[#CDCDCD] flex flex-col items-center justify-between p-4 pl-8 font-ibm-plex-mono text-[#545454] font-medium text-center">
        {/* (1) 뒤로가기 버튼 */}
        <button
          className="animate-pulse absolute left-0 top-0 px-8 py-4 opacity-40 hover:opacity-100 transition-colors duration-200"
        >
          <svg
            width="19"
            height="37"
            viewBox="0 0 19 37"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.3848 0.353581L0.707108 18.0312L18.3848 35.7089"
              stroke="#545454"
            />
          </svg>
        </button>

        <div className=" mb-6 text-center">
          <div className="h-6 w-1/3 bg-gray-200/80 rounded-md animate-pulse mb-2" />
          <div className="h-4 w-1/6 bg-gray-200/80 rounded-md animate-pulse" />
        </div>

        <div className="flex-1 w-full flex items-center justify-center">
          <div className="w-full max-w-[50vw] h-[50vh] bg-gray-200/80 rounded-2xl animate-pulse" />
        </div>

        <div className="border-t border-[#CDCDCD] pt-8">
          <div className="min-h-30 bg-gray-200/80 rounded-md animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
}
