"use client";

export default function SkeletonLoader() {
  return (
    <div className="h-screen flex">
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
      <div className="flex-1 h-full w-full p-8 flex flex-col">
        <div className=" mb-6 text-center">
          <div className="h-6 w-1/3 bg-gray-200/80 rounded-md animate-pulse mb-2" />
          <div className="h-4 w-1/6 bg-gray-200/80 rounded-md animate-pulse" />
        </div>

        <div className="flex-1 w-full flex items-center justify-center">
          <div className="w-full max-w-[50vw] h-[50vh] bg-gray-200/80 rounded-2xl animate-pulse" />
        </div>

        <div className="border-t border-[#CDCDCD] pt-8">
          <div className="h-30 bg-gray-200/80 rounded-md animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
}
