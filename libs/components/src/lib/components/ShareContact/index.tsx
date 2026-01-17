import { useDirect } from '@mezon/core';
import type { ChannelMembersEntity } from '@mezon/store';
import { EStateFriend, messagesActions, selectAllAccount, selectAllFriends, toastActions, useAppDispatch } from '@mezon/store';
import { Checkbox } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId, normalizeString } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../components';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import SuggestItem from '../MessageBox/ReactionMentionInput/SuggestItem';

type FriendItem = {
	id: string;
	name: string;
	avatarUser: string;
	displayName: string;
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

	const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
	const [searchText, setSearchText] = useState('');
	const [isSending, setIsSending] = useState(false);

	const allFriends = useSelector(selectAllFriends);

	const handleCloseModal = () => {
		setSelectedFriendIds([]);
		setSearchText('');
		onClose();
	};

	const handleToggleFriend = (friendId: string) => {
		setSelectedFriendIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
	};

	const handleShareContact = async () => {
		if (!contactUser || selectedFriendIds.length === 0 || !currentUser?.user?.id) return;

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

			for (const friendId of selectedFriendIds) {
				const friend = allFriends.find((f) => f?.user?.id === friendId);
				if (!friend?.user?.id) continue;

				const response = await createDirectMessageWithUser(
					friend.user.id,
					friend.user.display_name || friend.user.username,
					friend.user.username,
					friend.user.avatar_url
				);

				if (!response?.channel_id) continue;

				await dispatch(
					messagesActions.sendMessage({
						clanId: '0',
						channelId: response.channel_id,
						content: shareContactContent,
						mentions: [],
						attachments: [],
						references: [],
						anonymous: false,
						mentionEveryone: false,
						mode: ChannelStreamMode.STREAM_MODE_DM,
						senderId: currentUser.user.id,
						isPublic: false,
						avatar: currentUser.user.avatar_url,
						username: currentUser.user.username
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

	const friendsList: FriendItem[] = useMemo(() => {
		return allFriends
			.filter((friend) => friend.state === EStateFriend.FRIEND && friend?.user?.id !== contactUser?.user?.id)
			.map((friend) => ({
				id: friend?.user?.id ?? '',
				name: friend?.user?.username ?? '',
				avatarUser: friend?.user?.avatar_url ?? '',
				displayName: friend?.user?.display_name ?? friend?.user?.username ?? ''
			}));
	}, [allFriends, contactUser]);

	const normalizedSearchText = normalizeString(searchText);

	const filteredFriends = useMemo(() => {
		if (!normalizedSearchText) return friendsList;
		return friendsList.filter(
			(friend) => friend.name.toUpperCase().includes(normalizedSearchText) || friend.displayName.toUpperCase().includes(normalizedSearchText)
		);
	}, [friendsList, normalizedSearchText]);

	const displayName = contactUser?.clan_nick || contactUser?.user?.display_name || contactUser?.user?.username || '';
	const username = contactUser?.user?.username || '';
	const avatar = contactUser?.clan_avatar || contactUser?.user?.avatar_url || '';

	return (
		<ModalLayout onClose={handleCloseModal}>
			<div className="bg-theme-setting-primary w-[550px] text-theme-primary pt-4 rounded" data-e2e={generateE2eId('modal.share_contact')}>
				<div>
					<h1 className="text-xl font-semibold text-center">{t('modal.title')}</h1>
				</div>

				{/* Search Input */}
				<div className="px-4 pt-4">
					<input
						type="text"
						className="bg-theme-input outline-none w-full h-10 p-[10px] border-theme-primary text-base rounded-lg"
						placeholder={t('modal.searchPlaceholder')}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						data-e2e={generateE2eId('modal.share_contact.input.search')}
					/>

					{/* Friends List */}
					<div className="mt-4 mb-2 overflow-y-auto h-[300px] thread-scroll">
						{filteredFriends.length === 0 ? (
							<span className="flex flex-row justify-center">{searchText ? t('modal.noResults') : t('modal.noFriends')}</span>
						) : (
							filteredFriends.map((friend) => {
								const isSelected = selectedFriendIds.includes(friend.id);
								return (
									<div key={friend.id} className="flex items-center px-4 py-1 rounded bg-item-hover">
										<div className="flex-1 mr-1" onClick={() => handleToggleFriend(friend.id)}>
											<SuggestItem
												display={friend.displayName}
												avatarUrl={friend.avatarUser}
												showAvatar
												valueHightLight={searchText}
												subText={friend.name}
												wrapSuggestItemStyle="gap-x-1"
												subTextStyle="text-[13px]"
												emojiId=""
											/>
										</div>
										<Checkbox
											className="w-4 h-4 focus:ring-transparent"
											id={`checkbox-friend-${friend.id}`}
											checked={isSelected}
											onChange={() => handleToggleFriend(friend.id)}
										/>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Contact Preview */}
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

				{/* Footer Buttons */}
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
						disabled={isSending || selectedFriendIds.length === 0}
						data-e2e={generateE2eId('modal.share_contact.button.share')}
					>
						{isSending
							? t('modal.sharing')
							: `${t('modal.share')} ${selectedFriendIds.length > 0 ? `(${selectedFriendIds.length})` : ''}`}
					</button>
				</div>
			</div>
		</ModalLayout>
	);
};

export default ShareContactModal;
