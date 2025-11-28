import PdfViewerClient from '../PdfViewerClient';
import AiChat from '../AiChat';
import { ChatProvider } from '../ChatContext';

export default async function Page({ params }: { params: any }) {
	const resolvedParams = await params;
	const pathArr = resolvedParams?.path
		? Array.isArray(resolvedParams.path)
			? resolvedParams.path
			: [resolvedParams.path]
		: [];
	const publicId = pathArr.join('/');

	if (!publicId) {
		return <div>열람할 PDF를 지정하세요. (publicId가 비어 있음)</div>;
	}

	return (
    <ChatProvider>
      <div className="h-screen overflow-hidden">
        <PdfViewerClient publicId={publicId} />
        <AiChat />
      </div>
    </ChatProvider>
  );
}