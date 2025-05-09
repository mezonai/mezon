import { selectCurrentChannelId, selectCurrentClan, selectCurrentClanId } from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { fileTypeImage } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalValidateFile from '../../../ModalValidateFile';

type ClanBannerBackgroundProps = {
	hasChanges: boolean;
	onUpload: (urlImage: string) => void;
	onHasChanges: (hasChanges: boolean) => void;
};

const ClanBannerBackground = ({ hasChanges, onUpload, onHasChanges }: ClanBannerBackgroundProps) => {
	const { sessionRef, clientRef } = useMezon();
	const currentClan = useSelector(selectCurrentClan);

	const currentClanId = useSelector(selectCurrentClanId) || '';
	const currentChannelId = useSelector(selectCurrentChannelId) || '';

	const [urlImage, setUrlImage] = useState<string | undefined>(currentClan?.banner ?? undefined);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

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
			setUrlImage(attachment.url ?? '');
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
			setUrlImage(undefined);
			onUpload('');
			fileInputRef.current.value = '';
		}

		if (fileInputRef.current && !urlImage) {
			fileInputRef.current.click();
		}
	};

	useEffect(() => {
		if (urlImage !== currentClan?.banner) {
			onHasChanges(true);
		} else {
			onHasChanges(false);
		}
	}, [urlImage, currentClan?.banner]);

	useEffect(() => {
		if (!hasChanges && fileInputRef.current) {
			setUrlImage(currentClan?.banner ?? undefined);
			fileInputRef.current.value = '';
		}
	}, [hasChanges]);

	return (
		<div className="flex sbm:flex-row flex-col pt-10 mt-10 border-t gap-x-5 gap-y-[10px]  dark:border-borderDivider border-borderDividerLight">
			<div className="flex flex-col flex-1 text-textSecondary">
				<h3 className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase mb-2">Clan Banner Background</h3>
				<p className="text-sm font-normal mb-2 dark:text-textSecondary text-textSecondary800">
					This image will display at the top of your channels list.
				</p>
				<p className="text-sm font-normal dark:text-textSecondary text-textSecondary800">
					The recommended minimum size is 960x540 and recommended aspect ratio is 16:9.
				</p>
				<button
					className="h-10 w-fit px-4 mt-4 rounded bg-bgLightModeThird text-textLightTheme dark:text-textDarkTheme border dark:border-buttonProfile hover:!bg-[#9e9e9e] dark:bg-transparent dark:hover:!bg-buttonProfile focus:!ring-transparent"
					onClick={handleOpenFile}
				>
					Upload Background
				</button>
			</div>
			<div className="flex flex-1 sbm:mb-0 mb-5">
				<div className="relative max-w-[320px] w-full h-[180px]">
					<label>
						<div
							style={{ backgroundImage: `url(${urlImage})` }}
							className={`bg-cover bg-no-repeat bg-center w-full h-full dark:bg-buttonProfile bg-bgLightModeThird rounded relative cursor-pointer`}
						>
							{!urlImage && (
								<p className="dark:text-white text-textLightTheme text-xl font-semibold text-center pt-[25%]">Choose an Image</p>
							)}
						</div>
						<input ref={fileInputRef} id="upload_banner_background" onChange={(e) => handleFile(e)} type="file" className="hidden" />
					</label>
					<button
						onClick={handleCloseFile}
						className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#A7A8AC] hover:bg-[#919193] flex items-center justify-center"
					>
						{urlImage ? <Icons.Close /> : <Icons.ImageUploadIcon />}
					</button>
				</div>
			</div>

			<ModalValidateFile
				openModal={openModal}
				onClose={() => setOpenModal(false)}
				image="assets/images/file-and-folder.png"
				title="Only image files are allowed"
				content="Just upload type file (JPEG, PNG), please!"
			/>
		</div>
	);
};

export default ClanBannerBackground;
