import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/aplusmatelogo.svg"
          alt="logo"
          width={100}
          height={20}
          priority
          className="pb-8 sm:pb-0"
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-s text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          PDF 창, 챗봇 창을 번갈아가며 공부하고 있나요?
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          이제 수업자료를 보며 바로 AI에게 질문하세요. <br className="hidden sm:block"/>
          페이지별 질문, 대화 저장으로 공부 흐름이 끊기지 않습니다.<br/>
          <br/>
          
          2025년 12월 <br className="hidden sm:block"/>Coming Soon... 
          </p>
        </div>
          <div className="pt-8 sm:pt-0">
            <button className="bg-black hover:bg-orange-700 transition-colors duration-300 text-white px-4 py-2 rounded-full ">
              <a href="https://www.notion.so/kaist-students/A-Mate-AI-29b14badf5ac804f8481e7fbed15a740?source=copy_link" target="_blank" rel="noopener noreferrer">
              GDGoC Notion
              </a>
            </button>
          </div>
      </main>
    </div>
  );
}
