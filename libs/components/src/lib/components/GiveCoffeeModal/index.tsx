import { useAuth, useChatReaction, useDirect, useSendInviteMessage } from '@mezon/core';
import { giveCoffeeActions, selectClickedOnTopicStatus, selectCurrentChannel, useAppDispatch } from '@mezon/store';
import { ButtonLoading, Icons } from '@mezon/ui';
import {
	AMOUNT_TOKEN,
	EMOJI_GIVE_COFFEE,
	IMessageWithUser,
	TOKEN_TO_AMOUNT,
	TypeMessage,
	createImgproxyUrl,
	formatMoney,
	isPublicChannel
} from '@mezon/utils';
import { useCallback, useRef, useState } from 'react';

import { ChannelStreamMode } from 'mezon-js';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../components';
import Modal from '../Modal';

type GiveCoffeeModalProps = {
	onClose: () => void;
	message: IMessageWithUser;
	isTopic?: boolean;
};

const GiveCoffeeModal = ({ onClose, message, isTopic }: GiveCoffeeModalProps) => {
	const dispatch = useAppDispatch();
	const { userId } = useAuth();
	const { reactionMessageDispatch } = useChatReaction();
	const { createDirectMessageWithUser } = useDirect();
	const { sendInviteMessage } = useSendInviteMessage();
	const isFocusTopicBox = useSelector(selectClickedOnTopicStatus);
	const currentChannel = useSelector(selectCurrentChannel);
	const modalRef = useRef<HTMLDivElement>(null);
	const [quantity, setQuantity] = useState(1);

	const receiverName = message?.username || message?.clan_nick || 'Unknown User';
	const receiverAvatar = message?.clan_avatar || message?.avatar || '';

	const sendTransactionMessage = useCallback(
		async (userId: string, display_name?: string, username?: string, avatar?: string) => {
			const response = await createDirectMessageWithUser(userId, display_name, username, avatar);
			if (response.channel_id) {
				const channelMode = ChannelStreamMode.STREAM_MODE_DM;
				sendInviteMessage(
					`Funds Transferred: ${formatMoney(TOKEN_TO_AMOUNT.TEN_THOUSAND * quantity)}₫ | Give coffee action`,
					response.channel_id,
					channelMode,
					TypeMessage.SendToken
				);
			}
		},
		[sendInviteMessage, createDirectMessageWithUser, quantity]
	);

	const handleConfirm = useCallback(async () => {
		if (!message || !userId) return;
		try {
			await dispatch(
				giveCoffeeActions.updateGiveCoffee({
					channel_id: message.channel_id,
					clan_id: message.clan_id ?? '',
					message_ref_id: message.id,
					receiver_id: message.sender_id,
					sender_id: userId,
					token_count: AMOUNT_TOKEN.TEN_TOKENS * quantity
				})
			).unwrap();

			await reactionMessageDispatch({
				id: EMOJI_GIVE_COFFEE.emoji_id,
				messageId: message.id ?? '',
				emoji_id: EMOJI_GIVE_COFFEE.emoji_id,
				emoji: EMOJI_GIVE_COFFEE.emoji,
				count: 1,
				message_sender_id: message?.sender_id ?? '',
				action_delete: false,
				is_public: isPublicChannel(currentChannel),
				clanId: message.clan_id ?? '',
				channelId: isTopic ? currentChannel?.id || '' : (message?.channel_id ?? ''),
				isFocusTopicBox,
				channelIdOnMessage: message?.channel_id
			});
			await sendTransactionMessage(message.sender_id || '', message.user?.name, message.user?.name || message.user?.username, message.avatar);
			onClose();
		} catch (error) {
			console.error('Failed to give coffee:', error);
		}
	}, [dispatch, message, userId, quantity, reactionMessageDispatch, currentChannel, isTopic, isFocusTopicBox, sendTransactionMessage, onClose]);

	const handleCancel = useCallback(() => {
		onClose();
	}, [onClose]);

	return (
		<Modal onClose={handleCancel}>
			<div ref={modalRef} className="bg-theme-surface rounded-lg shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-xl font-semibold text-theme-primary">Give Coffees</h2>
					<button onClick={handleCancel} className="text-theme-primary hover:text-theme-secondary transition-colors">
						<Icons.CloseIcon className=" w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="space-y-2">
					<div className="flex items-center space-x-3 p-3 bg-theme-surface-secondary rounded-lg">
						<AvatarImage
							alt={receiverName}
							username={receiverName}
							className="w-12 h-12 flex-shrink-0"
							srcImgProxy={createImgproxyUrl(receiverAvatar)}
							src={receiverAvatar}
						/>
						<div>
							<p className="font-medium text-theme-primary">{receiverName}</p>
							<p className="text-sm text-theme-secondary">Will receive coffee</p>
						</div>
					</div>

					{/* Quantity Selector */}
					<div className="space-y-2">
						<div className="flex items-center justify-center space-x-4 p-3 bg-theme-surface-secondary rounded-lg">
							<button
								onClick={() => setQuantity(Math.max(1, quantity - 1))}
								disabled={quantity <= 1}
								className="w-8 h-8 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-theme-primary hover:bg-theme-surface-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<span className="text-lg font-bold">−</span>
							</button>
							<span className="text-xl font-semibold text-theme-primary min-w-[2rem] text-center">{quantity}</span>
							<button
								onClick={() => setQuantity(Math.min(10, quantity + 1))}
								disabled={quantity >= 10}
								className="w-8 h-8 rounded-full bg-theme-surface border border-theme-border flex items-center justify-center text-theme-primary hover:bg-theme-surface-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Icons.PlusOutline className="w-4 h-4" />
							</button>
						</div>
					</div>

					<div className="flex items-center justify-center space-x-2 p-4 bg-theme-surface-secondary rounded-lg">
						<Icons.DollarIcon className="w-8 h-8 text-yellow-500" />
						<span className="text-2xl font-bold text-theme-primary">{formatMoney(TOKEN_TO_AMOUNT.TEN_THOUSAND * quantity)}</span>
					</div>
					<p className="text-center text-theme-secondary">Are you sure to give coffee to {receiverName}?</p>
				</div>

				{/* Actions */}
				<div className="flex space-x-3 mt-6">
					<button
						onClick={handleCancel}
						className="flex-1 px-4 py-2 border border-theme-border rounded-lg text-theme-secondary hover:bg-theme-surface-secondary transition-colors"
					>
						Cancel
					</button>
					<ButtonLoading
						onClick={handleConfirm}
						className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
						label={
							<div className="flex items-center justify-center gap-2">
								<Icons.DollarIcon className="w-4 h-4 mr-2" />
								Give Coffee
							</div>
						}
					/>
				</div>
			</div>
		</Modal>
	);
};

export default GiveCoffeeModal;
