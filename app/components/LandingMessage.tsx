export default function LandingMessage() {
  return (
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
  );
}
