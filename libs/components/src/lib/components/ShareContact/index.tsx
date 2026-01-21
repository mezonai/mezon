import { useDirect } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import {
	EStateFriend,
	messagesActions,
	selectAllAccount,
	selectAllChannels,
	selectAllDirectMessages,
	selectAllFriends,
	selectBlockedUsers,
	toastActions,
	useAppDispatch
} from '@mezon/store';
import { Checkbox, Icons } from '@mezon/ui';
import { TypeMessage, createImgproxyUrl, generateE2eId, normalizeString } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import SuggestItem from '../MessageBox/ReactionMentionInput/SuggestItem';

type ShareItemType = 'friend' | 'dm' | 'group' | 'channel' | 'thread';

type ShareItem = {
	id: string;
	name: string;
	avatarUser: string;
	displayName: string;
	type: ShareItemType;
	channelId?: string;
	clanId?: string;
	isPublic?: boolean;
};

type ShareContactModalProps = {
	contactUser: ChannelMembersEntity;
	onClose: () => void;
};

const ShareContactModal = ({ contactUser, onClose }: ShareContactModalProps) => {
	const { t } = useTranslation('shareContact');
	const dispatch = useAppDispatch();
	const currentUser = useSelector(selectAllAccount);

	const { createDirectMessageWithUser } = useDirect();

	const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
	const [searchText, setSearchText] = useState('');
	const [isSending, setIsSending] = useState(false);

	const allFriends = useSelector(selectAllFriends);
	const blockedUsers = useSelector(selectBlockedUsers);
	const allDirectMessages = useSelector(selectAllDirectMessages);
	const allChannels = useSelector(selectAllChannels);

	const blockedUserIds = useMemo(() => {
		return new Set(blockedUsers.map((b) => b?.user?.id));
	}, [blockedUsers]);

	const handleCloseModal = () => {
		setSelectedItemIds([]);
		setSearchText('');
		onClose();
	};

	const handleToggleItem = (itemId: string) => {
		setSelectedItemIds((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
	};

	const handleShareContact = async () => {
		if (!contactUser || selectedItemIds.length === 0 || !currentUser?.user?.id) return;

		setIsSending(true);

		try {
			const userId = (contactUser?.user?.id || contactUser?.id)?.toString() || '';
			const username = contactUser?.user?.username || '';
			const displayName = contactUser?.clan_nick || contactUser?.user?.display_name || contactUser?.user?.username || '';
			const avatar = contactUser?.clan_avatar || contactUser?.user?.avatar_url || '';

			const shareContactContent = {
				t: '',
				embed: [
					{
						fields: [
							{ name: 'key', value: 'share_contact', inline: true },
							{ name: 'user_id', value: userId, inline: true },
							{ name: 'username', value: username, inline: true },
							{ name: 'display_name', value: displayName, inline: true },
							{ name: 'avatar', value: avatar, inline: true }
						]
					}
				]
			};

			for (const itemId of selectedItemIds) {
				const selectedItem = shareItemsList.find((item) => item.id === itemId);
				if (!selectedItem) continue;

				let channelId: string | undefined;
				let streamMode: number = ChannelStreamMode.STREAM_MODE_DM;

				if (selectedItem.type === 'friend') {
					const friend = allFriends.find((f) => f?.user?.id === itemId);
					if (!friend?.user?.id) continue;

					const response = await createDirectMessageWithUser(
						friend.user.id,
						friend.user.display_name || friend.user.username,
						friend.user.username,
						friend.user.avatar_url
					);
					channelId = response?.channel_id;
					streamMode = ChannelStreamMode.STREAM_MODE_DM;
				} else if (selectedItem.type === 'dm' || selectedItem.type === 'group') {
					channelId = selectedItem.channelId;
					streamMode = selectedItem.type === 'group' ? ChannelStreamMode.STREAM_MODE_GROUP : ChannelStreamMode.STREAM_MODE_DM;
				} else if (selectedItem.type === 'channel') {
					channelId = selectedItem.channelId;
					streamMode = ChannelStreamMode.STREAM_MODE_CHANNEL;
				} else if (selectedItem.type === 'thread') {
					channelId = selectedItem.channelId;
					streamMode = ChannelStreamMode.STREAM_MODE_THREAD;
				}

				if (!channelId) continue;

				const clanId = selectedItem.clanId || '0';
				const isPublic = selectedItem.isPublic ?? false;

				await dispatch(
					messagesActions.sendMessage({
						clanId,
						channelId,
						content: shareContactContent,
						mentions: [],
						attachments: [],
						references: [],
						anonymous: false,
						mentionEveryone: false,
						mode: streamMode,
						senderId: currentUser.user.id,
						isPublic,
						avatar: currentUser.user.avatar_url,
						username: currentUser.user.username,
						code: TypeMessage.ShareContact
					})
				).unwrap();
			}

			dispatch(
				toastActions.addToast({
					message: t('contactSharedSuccess'),
					type: 'success'
				})
			);
			handleCloseModal();
		} catch (error) {
			console.error('Share contact error:', error);
			dispatch(
				toastActions.addToast({
					message: t('contactSharedError'),
					type: 'error'
				})
			);
		} finally {
			setIsSending(false);
		}
	};

	const shareItemsList: ShareItem[] = useMemo(() => {
		const contactUserId = contactUser?.user?.id;
		const currentUserId = currentUser?.user?.id;

		const friendItems: ShareItem[] = allFriends
			.filter((friend) => {
				const friendUserId = friend?.user?.id;
				return friend.state === EStateFriend.FRIEND && friendUserId !== contactUserId && !blockedUserIds.has(friendUserId);
			})
			.map((friend) => ({
				id: friend?.user?.id ?? '',
				name: friend?.user?.username ?? '',
				avatarUser: friend?.user?.avatar_url ?? '',
				displayName: friend?.user?.display_name ?? friend?.user?.username ?? '',
				type: 'friend' as const
			}));

		const dmGroupItems: ShareItem[] = allDirectMessages
			.filter((dm) => {
				if (dm.active !== 1) return false;

				// For DM: exclude if it's a DM with the contact user
				if (dm.type === ChannelType.CHANNEL_TYPE_DM) {
					if (dm.user_ids?.includes(contactUserId as string)) return false;
					if (!dm.user_ids?.includes(currentUserId as string)) return false;
				}

				// For Group: include all active groups
				return true;
			})
			.map((dm) => ({
				id: dm.id,
				name: dm.channel_label || dm.usernames?.join(', ') || '',
				avatarUser: dm.channel_avatar || dm.avatars?.[0] || '',
				displayName: dm.channel_label || dm.display_names?.join(', ') || '',
				type: dm.type === ChannelType.CHANNEL_TYPE_GROUP ? ('group' as const) : ('dm' as const),
				channelId: dm.id
			}));

		const channelItems: ShareItem[] = allChannels
			.filter((channel) => {
				return channel.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel.type === ChannelType.CHANNEL_TYPE_THREAD;
			})
			.map((channel) => ({
				id: channel.id,
				name: channel.channel_label || '',
				avatarUser: '',
				displayName: channel.channel_label || '',
				type: channel.type === ChannelType.CHANNEL_TYPE_THREAD ? ('thread' as const) : ('channel' as const),
				channelId: channel.channel_id || channel.id,
				clanId: channel.clan_id || '',
				isPublic: !channel.channel_private
			}));

		return [...friendItems, ...dmGroupItems, ...channelItems];
	}, [allFriends, allDirectMessages, allChannels, contactUser, currentUser, blockedUserIds]);

	const normalizedSearchText = normalizeString(searchText);

	const filteredItems = useMemo(() => {
		if (!normalizedSearchText) return shareItemsList;
		return shareItemsList.filter(
			(item) => item.name.toUpperCase().includes(normalizedSearchText) || item.displayName.toUpperCase().includes(normalizedSearchText)
		);
	}, [shareItemsList, normalizedSearchText]);

	const displayName = contactUser?.clan_nick || contactUser?.user?.display_name || contactUser?.user?.username || '';
	const username = contactUser?.user?.username || '';
	const avatar = contactUser?.clan_avatar || contactUser?.user?.avatar_url || '';

	return (
		<ModalLayout onClose={handleCloseModal}>
			<div className="bg-theme-setting-primary w-[550px] text-theme-primary pt-4 rounded" data-e2e={generateE2eId('modal.share_contact')}>
				<div>
					<h1 className="text-xl font-semibold text-center">{t('modal.title')}</h1>
				</div>

				<div className="px-4 pt-4">
					<input
						type="text"
						className="bg-theme-input outline-none w-full h-10 p-[10px] border-theme-primary text-base rounded-lg"
						placeholder={t('modal.searchPlaceholder')}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						data-e2e={generateE2eId('modal.share_contact.input.search')}
					/>

					<div className="mt-4 mb-2 overflow-y-auto h-[300px] thread-scroll">
						{filteredItems.length === 0 ? (
							<span className="flex flex-row justify-center">{searchText ? t('modal.noResults') : t('modal.noFriends')}</span>
						) : (
							filteredItems.map((item) => {
								const isSelected = selectedItemIds.includes(item.id);
								const isChannelOrThread = item.type === 'channel' || item.type === 'thread';

								return (
									<div
										key={item.id}
										className="flex items-center px-4 py-1 rounded bg-item-hover cursor-pointer"
										onClick={() => handleToggleItem(item.id)}
									>
										{isChannelOrThread ? (
											<div className="flex items-center flex-1 mr-1 gap-2">
												{item.type === 'channel' ? (
													item.isPublic ? (
														<Icons.Hashtag defaultSize="w-5 h-5 text-theme-secondary" />
													) : (
														<Icons.HashtagLocked defaultSize="w-5 h-5 text-theme-secondary" />
													)
												) : item.isPublic ? (
													<Icons.ThreadIcon defaultSize="w-5 h-5 text-theme-secondary" />
												) : (
													<Icons.ThreadIconLocker className="w-5 h-5 text-theme-secondary" />
												)}
												<span className="text-theme-primary text-sm">{item.displayName}</span>
											</div>
										) : (
											<div className="flex-1 mr-1">
												<SuggestItem
													display={item.displayName}
													avatarUrl={item.avatarUser}
													showAvatar
													valueHightLight={searchText}
													subText={item.type === 'group' ? t('modal.group') : item.name}
													wrapSuggestItemStyle="gap-x-1"
													subTextStyle="text-[13px]"
													emojiId=""
												/>
											</div>
										)}
										<Checkbox
											className="w-4 h-4 focus:ring-transparent"
											id={`checkbox-item-${item.id}`}
											checked={isSelected}
											onChange={() => handleToggleItem(item.id)}
										/>
									</div>
								);
							})
						)}
					</div>
				</div>

				<div className="px-4">
					<div className="mb-2">
						<label className="text-xs uppercase font-semibold text-theme-primary">{t('modal.contactPreview')}</label>
					</div>
					<div className="bg-item-theme p-3 flex items-center gap-3 border-l-4 border-[#5865F2]">
						<AvatarImage
							alt={displayName}
							username={username}
							className="min-w-10 min-h-10 max-w-10 max-h-10 rounded-full"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-theme-primary truncate">{displayName}</p>
							<p className="text-xs text-theme-secondary truncate">@{username}</p>
						</div>
					</div>
				</div>

				<div className="flex justify-end p-4 rounded-b gap-4">
					<button
						className="py-2 h-10 px-4 rounded-lg border-theme-primary hover:!underline focus:ring-transparent"
						type="button"
						onClick={handleCloseModal}
						disabled={isSending}
						data-e2e={generateE2eId('modal.share_contact.button.cancel')}
					>
						{t('modal.cancel')}
					</button>
					<button
						onClick={handleShareContact}
						className="py-2 h-10 px-4 rounded text-white bg-bgSelectItem hover:!bg-bgSelectItemHover focus:ring-transparent disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={isSending || selectedItemIds.length === 0}
						data-e2e={generateE2eId('modal.share_contact.button.share')}
					>
						{isSending ? t('modal.sharing') : `${t('modal.share')} ${selectedItemIds.length > 0 ? `(${selectedItemIds.length})` : ''}`}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ShareContactModal;
