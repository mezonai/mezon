import { Icons } from '@mezon/components';
import { useClans } from '@mezon/core';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Button } from 'flowbite-react';
import { useState } from 'react';

const ClanBannerBackground = () => {
	const { sessionRef, clientRef } = useMezon();
	const { currentClan, updateClan } = useClans();

	const [urlImage, setUrlImage] = useState<string>(currentClan?.banner ?? '');

	const handleFile = (e: any) => {
		const file = e?.target?.files[0];
		const fullfilename = file?.name;
		const session = sessionRef.current;
		const client = clientRef.current;

		if (!file) return;

		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}

		handleUploadFile(client, session, fullfilename, file).then((attachment: any) => {
			setUrlImage(attachment.url ?? '');
		});
	};

	const handleUpload = async () => {
		await updateClan({
			banner: urlImage,
			clan_id: currentClan?.clan_id ?? '',
			clan_name: currentClan?.clan_name ?? '',
			creator_id: currentClan?.creator_id ?? '',
			logo: currentClan?.logo ?? '',
		});
	};

	const handleCloseFile = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		setUrlImage('');
	};

	return (
		<div className="flex flex-row">
			<div className="flex flex-col flex-1 text-textSecondary">
				<h3 className="text-xs font-bold dark:text-textSecondary text-textSecondary800 uppercase mb-2">Server Banner Background</h3>
				<p className="text-sm font-normal mb-2 dark:text-textSecondary text-textSecondary800">
					This image will display at the top of your channels list.
				</p>
				<p className="text-sm font-normal dark:text-textSecondary text-textSecondary800">
					The recommended minimum size is 960x540 and recommended aspect ratio is 16:9.
				</p>
				<Button
					className="h-10 w-fit px-4 mt-4 rounded bg-bgSelectItem hover:!bg-bgSelectItemHover dark:bg-bgSelectItem dark:hover:!bg-bgSelectItemHover focus:!ring-transparent"
					onClick={handleUpload}
					disabled={currentClan?.banner === urlImage}
				>
					Upload Background
				</Button>
			</div>
			<div className="flex flex-1">
				<div className="relative w-[320px] h-[180px]">
					<label>
						<div
							style={{ backgroundImage: `url(${urlImage})` }}
							className={`bg-cover bg-no-repeat w-full h-full bg-buttonProfile rounded relative cursor-pointer`}
						>
							{!urlImage && <p className="text-white text-xl font-semibold text-center pt-[25%]">Choose an Image</p>}
						</div>
						<input id="upload_banner_background" onChange={(e) => handleFile(e)} type="file" className="hidden" />
					</label>
					<button
						onClick={handleCloseFile}
						className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#A7A8AC] hover:bg-[#919193] flex items-center justify-center"
					>
						{urlImage ? <Icons.Close /> : <Icons.ImageUploadIcon />}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ClanBannerBackground;
