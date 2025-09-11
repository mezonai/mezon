import { selectCurrentClanId, selectEmojiByClanId, settingClanStickerActions, useAppDispatch, useAppSelector } from '@mezon/store';
import type { ClanEmoji } from 'mezon-js';
import type { RefObject } from 'react';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../../components';
import ModalValidateFile, { ELimitSize } from '../../ModalValidateFile';
import ModalSticker, { EGraphicType } from '../SettingSticker/ModalEditSticker';
import SettingEmojiList from './SettingEmojiList';

const SettingEmoji = ({ parentRef }: { parentRef: RefObject<HTMLDivElement> }) => {
	const currentClanId = useSelector(selectCurrentClanId);
	const [openModal, setOpenModal] = useState(false);
	const [openModalType, setOpenModalType] = useState(false);
	const emojiList = useAppSelector((state) => selectEmojiByClanId(state, currentClanId || ''));
	const [selectedEmoji, setSelectedEmoji] = useState<ClanEmoji | null>(null);
	const [isOpenEditModal, setIsOpenEditModal] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const handleOpenUpdateEmojiModal = (emoji: ClanEmoji) => {
		setSelectedEmoji(emoji);
		setIsOpenEditModal(true);
		dispatch(settingClanStickerActions.openModalInChild());
	};

	const handleCreateEmoji = () => {
		setSelectedEmoji(null);
		setIsOpenEditModal(true);
		dispatch(settingClanStickerActions.openModalInChild());
	};

	const handleCloseModal = useCallback(() => {
		setIsOpenEditModal(false);
		setTimeout(() => {
			dispatch(settingClanStickerActions.closeModalInChild());
			parentRef?.current?.focus();
		}, 0);
	}, []);

	return (
		<>
			<div className="flex flex-col gap-3 pb-[40px] 0 text-sm">
				<div className={'flex flex-col gap-2'}>
					<p className={''}>
						Add up to 250 custom emoji that anyone can use in this server. Animated GIF emoji may be used by members with Mezon Nitro
					</p>
					<p className={'uppercase text-xs'}>UPLOAD REQUIREMENTS</p>
					<ul className={'list-disc ml-[16px]'}>
						<li>File type: JPEG, PNG, GIF</li>
						<li>Recommended file size: 256 KB (We'll compress for you)</li>
						<li>Recommended dimensions: 128x128</li>
						<li>Naming: Emoji names must be at least 2 characters long and can only contain alphanumeric characters and underscores</li>
					</ul>
				</div>
				<div
					onClick={handleCreateEmoji}
					className="h-[38px] font-semibold rounded-lg btn-primary btn-primary-hover w-28 relative flex flex-row items-center justify-center cursor-pointer"
				>
					Upload emoji
				</div>
			</div>

			<SettingEmojiList title={'Emoji'} emojiList={emojiList} onUpdateEmoji={handleOpenUpdateEmojiModal} />

			<ModalValidateFile
				open={openModalType}
				onClose={() => setOpenModalType(false)}
				title={'Only image files are allowed'}
				content={`Just upload type file images, please!`}
			/>

			<ModalValidateFile
				open={openModal}
				onClose={() => setOpenModal(false)}
				title={'Your files are too powerful'}
				content={`Max file size is ${ELimitSize.MB}, please!`}
			/>
			{isOpenEditModal && (
				<ModalLayout onClose={handleCloseModal}>
					<ModalSticker graphic={selectedEmoji} handleCloseModal={handleCloseModal} type={EGraphicType.EMOJI} />
				</ModalLayout>
			)}
		</>
	);
};

export default SettingEmoji;
