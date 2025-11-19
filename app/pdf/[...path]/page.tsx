import PdfViewerClient from '../PdfViewerClient';
import AiChat from '../AiChat';

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
    <div className="bg-[#F2F2F2]">
      <PdfViewerClient publicId={publicId} />
      <AiChat />
    </div>
  );
}