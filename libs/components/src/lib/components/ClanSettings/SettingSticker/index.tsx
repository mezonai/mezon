import { selectCurrentClanId, selectStickersByClanId, settingClanStickerActions, useAppDispatch } from '@mezon/store';
import { Button, MezonIcon, MzIcons32 } from '@mezon/ui';
import type { ClanSticker } from 'mezon-js';
import type { RefObject } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../../components';
import ModalSticker, { EGraphicType } from './ModalEditSticker';
import SettingStickerItem from './SettingStickerItem';

const SettingSticker = ({ parentRef }: { parentRef: RefObject<HTMLDivElement> }) => {
	const { t } = useTranslation('clanSettings');
	const [showModalSticker, setShowModalSticker] = useState<boolean>(false);
	const [editSticker, setEditSticker] = useState<ClanSticker | null>(null);
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const listSticker = useSelector(selectStickersByClanId(currentClanId));

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
			<div className="flex flex-col gap-6 pb-[40px] text-sm">
				<div className="flex flex-col gap-2 pb-6 border-b-theme-primary">
					<p className="font-bold text-xs uppercase text-theme-primary-active">{t('stickers.uploadInstructions')}</p>
					<p>{t('stickers.description')}</p>
				</div>
				<div className="flex p-4 bg-theme-setting-nav rounded-lg shadow-sm hover:shadow-md transition duration-200  border-theme-primary">
					<div className="flex-1 w-full flex flex-col ">
						<p className="text-base font-bold text-theme-primary-active">{t('stickers.uploadHere')}</p>
						<p className="text-xs ">{t('stickers.customizeMessage')}</p>
					</div>
					<Button className="px-2 py-2.5 btn-primary btn-primary-hover rounded-lg" onClick={handleOpenModalUpload}>
						{t('stickers.uploadSticker')}
					</Button>
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
						<MezonIcon icon={MzIcons32.mzImageAdd} className="group-hover:scale-110 ease-in-out duration-75 text-[var(--mz-icon)]" />
					</div>
				</div>
			</div>
			{showModalSticker && (
				<ModalLayout onClose={handleCloseModal}>
					<ModalSticker key={editSticker?.id} graphic={editSticker} handleCloseModal={handleCloseModal} type={EGraphicType.STICKER} />
				</ModalLayout>
			)}
		</>
	);
};

export default SettingSticker;
