import { selectCurrentClanId, selectStickerByClanId, settingClanStickerActions, useAppDispatch } from '@mezon/store';
import { Button, Icons, Modal } from '@mezon/ui';
import { ClanSticker } from 'mezon-js';
import { RefObject, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import ModalSticker, { EGraphicType } from './ModalEditSticker';
import SettingStickerItem from './SettingStickerItem';

const SettingSticker = ({ parentRef }: { parentRef: RefObject<HTMLDivElement> }) => {
	const [showModalSticker, setShowModalSticker] = useState<boolean>(false);
	const [editSticker, setEditSticker] = useState<ClanSticker | null>(null);
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const listSticker = useSelector(selectStickerByClanId(currentClanId));

	const dispatch = useAppDispatch();
	const handleUpdateSticker = (sticker: ClanSticker) => {
		setEditSticker(sticker);
		dispatch(settingClanStickerActions.openModalInChild());

		setShowModalSticker(true);
	};
	const handleCloseModal = useCallback(() => {
		setShowModalSticker(false);
		setEditSticker(null);
		setTimeout(() => {
			dispatch(settingClanStickerActions.closeModalInChild());
			parentRef?.current?.focus();
		}, 0);
	}, []);
	const handleOpenModalUpload = () => {
		setShowModalSticker(true);
		dispatch(settingClanStickerActions.openModalInChild());
	};

	return (
		<>
			<div className="flex flex-col gap-6 pb-[40px] dark:text-textSecondary text-textSecondary800 text-sm">
				<div className="flex flex-col gap-2 pb-6 border-b-[0.08px]  dark:border-borderDividerLight border-bgModifierHoverLight">
					<p className="font-bold text-xs uppercase"> UPLOAD INSTRUCTIONS </p>
					<p>
						{' '}
						Stickers can be static (PNG) or animated (APNG, GIF). Stickers must be exactly 320 x 320 pixels and no larger than 512KB. We
						will automatically resize static PNG and animated GIF stickers for you.{' '}
					</p>
				</div>
				<div className="flex p-4 dark:bg-bgSecondary bg-bgLightSecondary rounded-lg">
					<div className="flex-1 w-full flex flex-col">
						<p className="text-base font-bold">Upload it here!</p>
						<p className="text-xs ">Let's customize the amazing stickers with your interest</p>
					</div>
					<Button label="upload sticker" className="capitalize" onClick={handleOpenModalUpload}></Button>
				</div>
				<div className="w-full flex flex-wrap gap-y-5 lg:gap-x-[calc((100%_-_116px_*_5)/4)] max-sbm:justify-evenly md:gap-x-[calc((100%_-_116px_*_4)/3)] gap-x-[calc((100%_-_116px_*_3)/2)]">
					{listSticker.map((sticker) => (
						<SettingStickerItem key={sticker.id} sticker={sticker} updateSticker={handleUpdateSticker} />
					))}
					<div
						onClick={handleOpenModalUpload}
						className={
							'cursor-pointer group relative text-xs w-[116px] h-[140px] rounded-lg flex flex-col items-center p-3 border-[0.08px] border-dashed  dark:border-borderDivider border-spacing-2 border-bgTertiary justify-center'
						}
					>
						<Icons.ImageUploadIcon className="w-7 h-7 group-hover:scale-110 ease-in-out duration-75" />
					</div>
				</div>
			</div>
			<Modal
				showModal={showModalSticker}
				onClose={handleCloseModal}
				classNameBox={'max-w-[600px]'}
				children={
					<ModalSticker key={editSticker?.id} graphic={editSticker} handleCloseModal={handleCloseModal} type={EGraphicType.STICKER} />
				}
			/>
		</>
	);
};

export default SettingSticker;
