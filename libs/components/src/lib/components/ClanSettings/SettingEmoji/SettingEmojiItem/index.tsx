import { usePermissionChecker } from '@mezon/core';
import {
	emojiSuggestionActions,
	selectCurrentClanId,
	selectCurrentUserId,
	selectMemberClanByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EPermission, MAX_FILE_NAME_EMOJI, getEmojiUrl } from '@mezon/utils';
import type { ClanEmoji } from 'mezon-js';
import type { MezonUpdateClanEmojiByIdBody } from 'mezon-js/api.gen';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

type SettingEmojiItemProp = {
	emoji: ClanEmoji;
	onUpdateEmoji: (emoji: ClanEmoji) => void;
};

const SettingEmojiItem = ({ emoji, onUpdateEmoji: _onUpdateEmoji }: SettingEmojiItemProp) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [showDelete, setShowDelete] = useState<boolean>(false);
	const dispatch = useAppDispatch();
	const clanId = useSelector(selectCurrentClanId);
	const [nameEmoji, setNameEmoji] = useState<string>(emoji.shortname?.slice(1, -1) || '');
	const [originalNameEmoji] = useState<string>(emoji.shortname?.slice(1, -1) || '');
	const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
	const dataAuthor = useAppSelector((state) => selectMemberClanByUserId(state, emoji.creator_id ?? ''));
	const [hasManageClanPermission] = usePermissionChecker([EPermission.manageClan]);
	const currentUserId = useAppSelector(selectCurrentUserId);
	const hasDeleteOrEditPermission = useMemo(() => {
		return hasManageClanPermission || currentUserId === emoji.creator_id;
	}, [hasManageClanPermission, currentUserId, emoji.creator_id]);

	const handleDelete = () => {
		dispatch(emojiSuggestionActions.deleteEmojiSetting({ emoji, clan_id: clanId as string, label: emoji.shortname as string }));
	};
	const handleOnMouseLeave = () => {
		setShowDelete(false);
	};

	const handleHoverEmoji = () => {
		setShowDelete(true);
	};
	const handleChangeEmojiName = (e: ChangeEvent<HTMLInputElement>) => {
		setNameEmoji(e.target.value.replace(/\s/g, ''));
	};

	const handleUpdateEmoji = async () => {
		const cleanName = nameEmoji.replace(/\s/g, '');
		const cleanOriginalName = originalNameEmoji.replace(/\s/g, '');
		if (cleanName !== emoji.shortname && cleanName !== '' && cleanName !== cleanOriginalName) {
			const request: MezonUpdateClanEmojiByIdBody = {
				source: emoji.src,
				shortname: `:${cleanName}:`,
				category: emoji.category,
				clan_id: clanId as string
			};
			await dispatch(emojiSuggestionActions.updateEmojiSetting({ request, emojiId: emoji.id || '' }));
			inputRef.current?.blur();
		}
	};

	const handleInputBlur = () => {
		setIsInputFocused(false);
		const cleanName = nameEmoji.replace(/\s/g, '');
		const cleanOriginalName = originalNameEmoji.replace(/\s/g, '');
		if (!cleanName || nameEmoji === cleanOriginalName) {
			setNameEmoji(originalNameEmoji);
		} else {
			handleUpdateEmoji();
		}
	};

	const handleInputFocus = () => {
		setIsInputFocused(true);
	};
	return (
		<div
			className={'flex flex-row w-full max-w-[700px] pr-5 relative h-[65px]  '}
			onMouseOver={handleHoverEmoji}
			onMouseLeave={handleOnMouseLeave}
			onBlur={handleOnMouseLeave}
		>
			<div className={`w-full h-full flex flex-row gap-1 border-b-theme-primary items-center`}>
				<div className={'w-14 h-8'}>
					<div className={'w-8 h-8 overflow-hidden flex items-center justify-center select-none '}>
						<img className={'w-auto max-h-full object-cover'} src={getEmojiUrl(emoji)} alt={emoji.shortname} />
					</div>
				</div>

				<div className={'md:flex-1 relative max-md:w-[40%] max-[400px]:w-[30%]'}>
					<div
						className={`h-[26px] hover:border px-1 w-fit max-md:w-full rounded-md flex items-center py-1 ${hasDeleteOrEditPermission ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${isInputFocused ? 'border' : ''}`}
						tabIndex={hasDeleteOrEditPermission ? 0 : -1}
						onClick={() => {
							if (hasDeleteOrEditPermission) {
								inputRef.current?.focus();
							}
						}}
						onKeyDown={(e) => {
							if (hasDeleteOrEditPermission && (e.key === 'Enter' || e.key === ' ')) {
								inputRef.current?.focus();
							}
						}}
					>
						<span>:</span>
						<input
							ref={inputRef}
							className={`bg-transparent max-w-[200px] animate-faded_input h-[26px] top-0 outline-none ${!hasDeleteOrEditPermission ? 'cursor-not-allowed' : ''}`}
							value={nameEmoji}
							onChange={handleChangeEmojiName}
							onFocus={handleInputFocus}
							onBlur={handleInputBlur}
							onKeyDown={(e) => {
								if (hasDeleteOrEditPermission && e.key === 'Enter') {
									const cleanName = nameEmoji.replace(/\s/g, '');
									const cleanOriginalName = originalNameEmoji.replace(/\s/g, '');
									if (!cleanName || nameEmoji === cleanOriginalName) {
										setNameEmoji(originalNameEmoji);
									} else {
										handleUpdateEmoji();
									}
								}
							}}
							maxLength={MAX_FILE_NAME_EMOJI}
							disabled={!hasDeleteOrEditPermission}
							style={{
								width: `${Math.max(nameEmoji.length * 8)}px`
							}}
						/>
						<span>:</span>
					</div>
				</div>

				<div className={'flex-1 flex gap-[6px]  select-none max-md:min-w-[40%]'}>
					<div className={'w-6 h-6 rounded-[50%] overflow-hidden flex items-center justify-center'}>
						<img
							className={'w-full h-auto object-cover'}
							src={dataAuthor?.clan_avatar || dataAuthor?.user?.avatar_url}
							alt="User avatar"
						/>
					</div>
					<p className={'text-sm h-auto leading-6'}>{dataAuthor?.clan_nick || dataAuthor?.user?.username}</p>
				</div>

				{showDelete && (
					<div className={'absolute text-xs font-bold w-6 top-[-12px] right-[-12px]'}>
						<button
							onClick={handleDelete}
							className="border-theme-primary text-red-600 shadow-emoji_item-delete  text-xs font-bold w-6 h-6 flex items-center justify-center rounded-[50%]"
						>
							X
						</button>
					</div>
				)}
			</div>
			{emoji.is_for_sale && <Icons.MarketIcons className="absolute top-6 right-6 w-4 h-4 text-yellow-300" />}
		</div>
	);
};

export default SettingEmojiItem;
