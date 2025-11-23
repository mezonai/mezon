import { usePermissionChecker } from '@mezon/core';
import { deleteSticker, selectCurrentClanId, selectCurrentUserId, selectMemberClanByUserId, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, getStickerUrl } from '@mezon/utils';
import type { ClanSticker } from 'mezon-js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

type SettingEmojiListProps = {
	updateSticker: (sticker: ClanSticker) => void;
	sticker: ClanSticker;
};

const SettingStickerItem = ({ sticker, updateSticker }: SettingEmojiListProps) => {
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId(state, sticker.creator_id ?? ''));
	const dispatch = useAppDispatch();
	const [canManageClan] = usePermissionChecker([EPermission.manageClan]);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const hasDeleteOrEditPermission = useMemo(() => {
		return canManageClan || currentUserId === sticker.creator_id;
	}, [currentUserId, sticker.creator_id]);
	const clanId = useSelector(selectCurrentClanId);
	const handleUpdateSticker = () => {
		updateSticker(sticker);
	};
	const handleDeleteSticker = async () => {
		if (sticker.id) {
			await dispatch(deleteSticker({ stickerId: sticker.id, clan_id: clanId as string, stickerLabel: sticker.shortname as string }));
		}
	};
	return (
		<div
			className={
				'group relative text-xs w-[116px] h-[140px] rounded-lg flex flex-col items-center p-3 bg-item-theme bg-item-hover justify-between'
			}
		>
			<div className="aspect-square h-[72px]  flex justify-center">
				<img className={' w-auto h-full object-cover select-none'} src={sticker.source ? sticker.source : getStickerUrl(sticker)} alt="" />
			</div>
			<p
				title={sticker.shortname}
				className="font-semibold truncate w-full text-center text-theme-primary-active text-ellipsis whitespace-nowrap max-w-[85px]"
			>
				{sticker.shortname}
			</p>

			<div className="flex items-end justify-center gap-1">
				<img
					className="w-4 h-4 rounded-full select-none object-cover"
					src={(dataAuthor?.clan_avatar || dataAuthor?.user?.avatar_url) ?? process.env.NX_LOGO_MEZON}
					alt=""
				/>
				<p className=" max-w-20 truncate">{dataAuthor?.clan_nick || dataAuthor?.user?.username}</p>
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
