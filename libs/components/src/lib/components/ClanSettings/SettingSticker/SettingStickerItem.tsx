import { usePermissionChecker } from '@mezon/core';
import { deleteSticker, selectCurrentClanId, selectCurrentUserId, selectMemberClanByUserId, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import type { ClanSticker } from 'mezon-js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

type SettingEmojiListProps = {
	updateSticker: (sticker: ClanSticker) => void;
	sticker: ClanSticker;
};

const SettingStickerItem = ({ sticker, updateSticker }: SettingEmojiListProps) => {
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId(state, sticker.creatorId ?? ''));
	const dispatch = useAppDispatch();
	const [canManageClan] = usePermissionChecker([EPermission.manageClan]);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const hasDeleteOrEditPermission = useMemo(() => {
		return canManageClan || currentUserId === sticker.creatorId;
	}, [currentUserId, sticker.creatorId]);
	const clanId = useSelector(selectCurrentClanId);
	const handleUpdateSticker = () => {
		updateSticker(sticker);
	};
	const handleDeleteSticker = async () => {
		if (sticker.id) {
			await dispatch(deleteSticker({ stickerId: sticker.id, clanId: clanId as string, stickerLabel: sticker.shortname as string }));
		}
	};
	const avatarDefault = dataAuthor?.clanNick || dataAuthor?.user?.displayName || dataAuthor?.user?.username;
	const avatarLetter = avatarDefault?.trim().charAt(0).toUpperCase();
	const avatarUrl = dataAuthor?.clanAvatar || dataAuthor?.user?.avatarUrl;
	return (
		<div
			className={
				'group relative text-xs w-[116px] h-[140px] rounded-lg flex flex-col items-center p-3 bg-item-theme bg-item-hover justify-between'
			}
		>
			<div className="aspect-square h-[72px]  flex justify-center">
				<img
					className={' w-auto h-full object-cover select-none'}
					src={`${!sticker.source ? `${process.env.NX_BASE_IMG_URL}/stickers/${sticker.id}.webp` : sticker.source}`}
					alt=""
				/>
			</div>
			<p
				title={sticker.shortname}
				className="font-semibold truncate w-full text-center text-theme-primary-active text-ellipsis whitespace-nowrap max-w-[85px]"
			>
				{sticker.shortname}
			</p>

			<div className="flex items-end justify-center gap-1">
				{avatarUrl ? (
					<img className="w-4 h-4 rounded-full select-none object-cover" src={avatarUrl} alt="" />
				) : (
					<div className="size-4 bg-bgAvatarDark rounded-full flex justify-center items-center text-bgAvatarLight text-[12px]">
						{avatarLetter}
					</div>
				)}
				<p className=" max-w-20 truncate">{dataAuthor?.clanNick || dataAuthor?.user?.username}</p>
			</div>
			{hasDeleteOrEditPermission && (
				<div className="group-hover:flex absolute flex-col right-[-12px] top-[-12px] gap-1 hidden select-none">
					<button
						onClick={handleUpdateSticker}
						className="aspect-square w-6 rounded-full bg-input-theme flex items-center justify-center shadow-sm"
					>
						<Icons.EditMessageRightClick defaultSize="w-3 h-3" />
					</button>
					<button
						onClick={handleDeleteSticker}
						className="aspect-square w-6 text-sm rounded-full bg-input-theme  flex items-center justify-center mb-[1px] font-medium text-red-600 shadow-sm"
					>
						x
					</button>
				</div>
			)}
			{sticker.is_for_sale && <Icons.MarketIcons className="absolute top-1 right-1 w-4 h-4 text-yellow-300" />}
		</div>
	);
};

export default SettingStickerItem;
