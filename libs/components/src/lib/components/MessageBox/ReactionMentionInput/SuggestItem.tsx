import type { ChannelsEntity } from '@mezon/store';
import { selectAllChannelsByUser, selectChannelById, selectNumberMemberVoiceChannel, useAppSelector } from '@mezon/store';
import { HighlightMatchBold, Icons } from '@mezon/ui';
import type { SearchItemProps } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId, getSrcEmoji } from '@mezon/utils';
import type { HashtagDm } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { memo, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AvatarImage } from '../../AvatarImage/AvatarImage';

type SuggestItemProps = {
	avatarUrl?: string;
	symbol?: string;
	subText?: string;
	valueHightLight?: string;
	subTextStyle?: string;
	showAvatar?: boolean;
	channelId?: string | number;
	isOpenSearchModal?: boolean;
	wrapSuggestItemStyle?: string;
	emojiId?: string;
	display?: string;
	isHightLight?: boolean;
	channel?: SearchItemProps;
	count?: number;
	isUnread?: boolean;
	color?: string;
};

const SuggestItem = ({
	isOpenSearchModal,
	avatarUrl,
	channelId,
	subText,
	subTextStyle,
	valueHightLight,
	showAvatar,
	wrapSuggestItemStyle,
	emojiId,
	display,
	isHightLight = true,
	channel,
	count,
	isUnread,
	color
}: SuggestItemProps) => {
	const allChannels = useSelector(selectAllChannelsByUser);
	const getChannel = allChannels.find((channel) => {
		return channel.channelId === channelId;
	});

	const [specificChannel, setSpecificChannel] = useState<ChannelsEntity | HashtagDm | null>(null);
	const numberMembersVoice = useAppSelector((state) => selectNumberMemberVoiceChannel(state, channelId as string));
	const checkVoiceStatus = useMemo(() => {
		if (channelId !== undefined && numberMembersVoice && specificChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			return numberMembersVoice >= 2;
		}
		return false;
	}, [channelId, numberMembersVoice, specificChannel?.type]);
	const channelIcon = useMemo(() => {
		if (!specificChannel) return null;

		const { channelPrivate, type } = specificChannel;

		if (type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (!channelPrivate || channelPrivate === 0) {
				return <Icons.Hashtag defaultSize="w-5 h-5" />;
			}
			if (channelPrivate === 1) {
				return <Icons.HashtagLocked defaultSize="w-5 h-5" />;
			}
		}

		if (type === ChannelType.CHANNEL_TYPE_THREAD) {
			if (!channelPrivate || channelPrivate === 0) {
				return <Icons.ThreadIcon defaultSize="w-5 h-5 text-theme-primary " />;
			}
			if (channelPrivate === 1) {
				return <Icons.ThreadIconLocker className="w-5 h-5 text-theme-primary " />;
			}
		}

		if (type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			if (!channelPrivate || channelPrivate === 0) {
				return <Icons.Speaker defaultSize="w-5 5-5" />;
			}
			return <Icons.SpeakerLocked defaultSize="w-5 h-5" />;
		}

		if (type === ChannelType.CHANNEL_TYPE_STREAMING && (!channelPrivate || channelPrivate === 0)) {
			return <Icons.Stream defaultSize="w-5 5-5" />;
		}

		if (type === ChannelType.CHANNEL_TYPE_APP) {
			return <Icons.AppChannelIcon className={'w-5 h-5'} />;
		}

		return null;
	}, [specificChannel]);

	useEffect(() => {
		if (channel) {
			setSpecificChannel(channel);
		} else {
			allChannels.map((channel) => {
				if (channel.channelId === channelId) {
					setSpecificChannel(channel);
				}
			});
		}
	}, []);

	return (
		<div
			className={`flex flex-row items-center h-[24px] w-full ${wrapSuggestItemStyle ?? 'justify-between'}`}
			data-e2e={generateE2eId('suggest_item')}
		>
			<div className="flex flex-row items-center gap-2 py-[3px] text-theme-primary text-theme-primary-hover">
				{showAvatar && (
					<div>
						{color && !avatarUrl ? (
							<Icons.RoleIcon defaultSize="w-5 h-[30px] min-w-5" defaultFill={color} />
						) : (
							<AvatarImage
								alt={subText || ''}
								username={Array.isArray(subText) ? subText[0] : subText}
								srcImgProxy={createImgproxyUrl(avatarUrl ?? '')}
								src={avatarUrl}
								className="size-4"
								classNameText="text-[9px] min-w-5 min-h-5 pt-[3px]"
							/>
						)}
					</div>
				)}
				{emojiId && (
					<img src={getSrcEmoji(emojiId)} alt={getSrcEmoji(emojiId)} style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
				)}
				{channelIcon}

				{display && (
					<span className={`text-[15px] font-thin text-theme-primary one-line flex items-center`}>
						<span
							className={`${isUnread || (count && count > 0) ? 'text-theme-primary-active font-semibold' : 'font-medium text-theme-primary '}`}
							style={{ color }}
						>
							{isHightLight ? HighlightMatchBold(display ?? '', valueHightLight ?? '') : display}
						</span>
						{Number(count) > 0 && (
							<span className="h-8 px-2 bg-red-500 rounded-sm font-semibold text-white ml-2">
								{Number(count) > 99 ? '99+' : Number(count)}
							</span>
						)}{' '}
					</span>
				)}
				{checkVoiceStatus && <i className="text-[15px] font-thin text-colorDanger ">(busy)</i>}
			</div>
			<span
				className={`text-[10px] font-semibold text-theme-primary one-line ${subTextStyle}`}
				data-e2e={generateE2eId('suggest_item.username')}
			>
				{getChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? (
					<RenderChannelLabelForThread channelId={getChannel?.parentId as string} />
				) : (
					<>{HighlightMatchBold(subText ?? '', valueHightLight ?? '')}</>
				)}
			</span>
		</div>
	);
};
const RenderChannelLabelForThread = ({ channelId }: { channelId: string }) => {
	const channelParent = useAppSelector((state) => selectChannelById(state, channelId ?? '')) || {};

	return <>{channelParent?.channelLabel || null}</>;
};

export default memo(SuggestItem);
