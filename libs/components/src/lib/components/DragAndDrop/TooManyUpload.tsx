import { useEscapeKey } from '@mezon/core';
import { MAX_FILE_ATTACHMENTS, MAX_FILE_SIZE, UploadLimitReason } from '@mezon/utils';
import { useMemo } from 'react';
import DocumentThumbnail from './DocumentThumbnail';

interface ITooManyUploadProps {
	togglePopup: () => void;
	limitReason: UploadLimitReason;
}

const TooManyUpload = ({ togglePopup, limitReason }: ITooManyUploadProps) => {
	useEscapeKey(togglePopup);
	const { title, content } = useMemo(() => {
		if (limitReason === UploadLimitReason.COUNT) {
			return {
				title: 'Too many uploads!',
				content: `You can only upload ${MAX_FILE_ATTACHMENTS} files at a time!`
			};
		}
		return {
			title: 'Upload size limit exceeded!',
			content: `Maximum allowed size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
		};
	}, [limitReason]);
	return (
		<div className="w-screen h-screen flex justify-center items-center fixed top-0 left-0 z-30">
			<div className="fixed inset-0 bg-black opacity-80" onClick={togglePopup} />
			<div className="w-[25rem] h-[15rem] bg-red-500 flex flex-row justify-center  items-center rounded-lg z-50 relative">
				<div className=" absolute z-50 -top-12">
					<DocumentThumbnail />
				</div>
				<div className="border-2 border-white w-[90%] h-[86%] rounded-lg border-dashed">
					<div className="flex flex-col justify-center mt-14">
						<div className=" w-full flex flex-row justify-center">
							<h1 className=" font-bold text-2xl mt-[1rem] text-center">{title}</h1>
						</div>
						<div className=" w-full flex flex-row justify-center text-center mt-[1rem]">
							<p className="w-[85%]">{content}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TooManyUpload;
