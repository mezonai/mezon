import { selectCurrentChannelId, selectCurrentClanId } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { fileTypeImage } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { ModalOverData } from '../../../ModalValidateFile/ModalOverData';

type ClanBannerBackgroundProps = {
	onUpload: (urlImage: string) => void;
	urlImage?: string;
};

const ClanBannerBackground = ({ onUpload, urlImage }: ClanBannerBackgroundProps) => {
	const { sessionRef, clientRef } = useMezon();

	const currentClanId = useSelector(selectCurrentClanId) || '';
	const currentChannelId = useSelector(selectCurrentChannelId) || '';

	const [openModal, setOpenModal] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	}, [urlImage]);

	const handleFile = (e: any) => {
		const file = e?.target?.files[0];
		const session = sessionRef.current;
		const client = clientRef.current;

		if (!file) return;

		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}

		if (!fileTypeImage.includes(file.type)) {
			setOpenModal(true);
			e.target.value = null;
			return;
		}

		handleUploadFile(client, session, currentClanId, currentChannelId, file?.name, file).then((attachment: any) => {
			onUpload(attachment.url ?? '');
		});
	};

	const handleOpenFile = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handleCloseFile = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (urlImage && fileInputRef.current) {
			onUpload('');
			fileInputRef.current.value = '';
		}

		if (fileInputRef.current && !urlImage) {
			fileInputRef.current.click();
		}
	};

	return (
		<div className="flex sbm:flex-row flex-col pt-10 mt-10  gap-x-5 gap-y-[10px]  border-t-theme-primary">
			<div className="flex flex-col flex-1">
				<h3 className="text-xs font-bold uppercase mb-2">Clan Banner Background</h3>
				<p className="text-sm font-normal mb-2">This image will display at the top of your channels list.</p>
				<p className="text-sm font-normal">The recommended minimum size is 960x540 and recommended aspect ratio is 16:9.</p>
				<button className="h-10 text-theme-primary-active w-fit px-4 mt-4 rounded-lg btn-primary btn-primary-hover" onClick={handleOpenFile}>
					Upload Background
				</button>
			</div>
			<div className="flex flex-1 sbm:mb-0 mb-5 bg-theme-setting-nav border-theme-primary rounded-lg">
				<div className="relative max-w-[320px] w-full h-[180px]">
					<label>
						<div
							style={{ backgroundImage: `url(${urlImage})` }}
							className={`bg-cover bg-no-repeat bg-center w-full h-full rounded relative cursor-pointer`}
						>
							{!urlImage && <p className="text-xl font-semibold text-center pt-[25%]">Choose an Image</p>}
						</div>
						<input ref={fileInputRef} id="upload_banner_background" onChange={(e) => handleFile(e)} type="file" className="hidden" />
					</label>
					<button onClick={handleCloseFile} className="absolute top-4 right-4 w-7 h-7 rounded-full  flex items-center justify-center">
						{urlImage ? <Icons.Close /> : <Icons.ImageUploadIcon />}
					</button>
				</div>
			</div>

			<ModalOverData onClose={() => setOpenModal(false)} open={openModal} />
		</div>
	);
};

export default ClanBannerBackground;
