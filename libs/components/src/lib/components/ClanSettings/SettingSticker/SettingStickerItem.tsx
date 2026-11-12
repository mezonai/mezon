import { usePermissionChecker } from '@mezon/core';
import { deleteSticker, selectCurrentClanId, selectCurrentUserId, selectMemberClanByUserId, useAppDispatch, useAppSelector } from '@mezon/store';
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { EPermission, createImgproxyUrl, generateE2eId, getSrcSticker } from '@mezon/utils';
import type { ClanSticker } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ModalConfirm from '../../ModalConfirm';

type SettingEmojiListProps = {
	updateSticker: (sticker: ClanSticker) => void;
	sticker: ClanSticker;
};

const SettingStickerItem = ({ sticker, updateSticker }: SettingEmojiListProps) => {
	const { t } = useTranslation('clanStickerSetting');
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId(state, sticker.creator_id ?? ''));
	const dispatch = useAppDispatch();
	const [canManageClan] = usePermissionChecker([EPermission.manageClan]);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const hasDeleteOrEditPermission = useMemo(() => {
		return canManageClan || currentUserId === sticker.creator_id;
	}, [canManageClan, currentUserId, sticker.creator_id]);
	const clanId = useSelector(selectCurrentClanId);
	const handleUpdateSticker = () => {
		updateSticker(sticker);
	};
	const handleDeleteSticker = async () => {
		closeDeleteModal();
		if (!sticker.id) return;
		const result = await dispatch(deleteSticker({ stickerId: sticker.id, clan_id: clanId as string, stickerLabel: sticker.shortname as string }));
		if (deleteSticker.fulfilled.match(result)) {
			toast.success(t('deleteModal.success', { name: sticker.shortname }));
		}
	};
	const [openDeleteModal, closeDeleteModal] = useModal(
		() => (
			<ModalConfirm
				handleCancel={closeDeleteModal}
				handleConfirm={handleDeleteSticker}
				title={t('deleteModal.title')}
				buttonName={t('btn.delete')}
				message={t('deleteModal.message', { name: sticker.shortname })}
			/>
		),
		[sticker.id, sticker.shortname, clanId]
	);
	const avatarUrl = dataAuthor?.clan_avatar || dataAuthor?.user?.avatar_url;
	return (
		<div
			className={
				'group relative text-xs w-[116px] h-[140px] rounded-lg flex flex-col items-center p-3 bg-item-theme bg-item-hover justify-between'
			}
		>
			<div className="aspect-square h-[72px]  flex justify-center">
				<img
					className={' w-auto h-full object-cover select-none'}
					src={sticker.source ? createImgproxyUrl(sticker.source) : getSrcSticker(sticker.id || '', createImgproxyUrl)}
					alt=""
				/>
			</div>
			<p
				title={sticker.shortname}
				className="font-semibold truncate w-full text-center text-theme-primary-active text-ellipsis whitespace-nowrap max-w-[85px]"
				data-e2e={generateE2eId('clan_page.settings.image_sticker.item.name')}
			>
				{sticker.shortname}
			</p>

			<div className="flex items-end justify-center gap-1">
				{avatarUrl ? (
					<img
						className="w-4 h-4 rounded-full select-none object-cover"
						src={createImgproxyUrl(avatarUrl, { width: 100, height: 100, resizeType: 'fill-down' })}
						alt=""
					/>
				) : (
					<div className="size-4 rounded-full bg-bgDisable flex items-center justify-center">
						<MezonIcon icon={MzIcons16.mzUser} className="text-[var(--mz-icon)]" />
					</div>
				)}
				<p className=" max-w-20 truncate">{dataAuthor?.clan_nick || dataAuthor?.user?.username}</p>
			</div>
			{hasDeleteOrEditPermission && (
				<div className="group-hover:flex absolute flex-col right-[-12px] top-[-12px] gap-1 hidden select-none">
					<button
						onClick={handleUpdateSticker}
						className="aspect-square w-6 rounded-full bg-input-theme flex items-center justify-center shadow-sm"
						data-e2e={generateE2eId('clan_page.settings.image_sticker.item.actions.edit')}
					>
						<MezonIcon icon={MzIcons16.mzEdit} className="text-[var(--mz-icon)]" />
					</button>
					<button
						onClick={openDeleteModal}
						className="aspect-square w-6 text-sm rounded-full bg-input-theme  flex items-center justify-center mb-[1px] font-medium text-red-600 shadow-sm"
						data-e2e={generateE2eId('clan_page.settings.image_sticker.item.actions.delete')}
					>
						x
					</button>
				</div>
			)}
			{sticker.is_for_sale && <MezonIcon icon={MzIcons16.mzShop} className="absolute top-1 right-1 text-yellow-300" />}
		</div>
	);
};

export default SettingStickerItem;
