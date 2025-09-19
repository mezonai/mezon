import type { ChannelsEntity } from '@mezon/store';
import { selectAllChannelsByUser, selectAllHashtagDm, selectChannelById, selectNumberMemberVoiceChannel, useAppSelector } from '@mezon/store';
import { HighlightMatchBold, Icons } from '@mezon/ui';
import type { SearchItemProps } from '@mezon/utils';
import { createImgproxyUrl, getSrcEmoji } from '@mezon/utils';
import type { HashtagDm } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { memo, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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
		return channel.channel_id === channelId;
	});

	const { directId } = useParams();
	const commonChannels = useSelector(selectAllHashtagDm);
	const [specificChannel, setSpecificChannel] = useState<ChannelsEntity | HashtagDm | null>(null);
	const numberMembersVoice = useAppSelector((state) => selectNumberMemberVoiceChannel(state, channelId as string));
	const checkVoiceStatus = useMemo(() => {
		if (
			channelId !== undefined &&
			numberMembersVoice &&
			(specificChannel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || specificChannel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE)
		) {
			return numberMembersVoice >= 2;
		}
		return false;
	}, [channelId, numberMembersVoice, specificChannel?.type]);
	const channelIcon = useMemo(() => {
		if (!specificChannel) return null;

		const { channel_private, type } = specificChannel;

		if (type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (!channel_private || channel_private === 0) {
				return <Icons.Hashtag defaultSize="w-5 h-5" />;
			}
			if (channel_private === 1) {
				return <Icons.HashtagLocked defaultSize="w-5 h-5" />;
			}
		}

		if (type === ChannelType.CHANNEL_TYPE_THREAD) {
			if (!channel_private || channel_private === 0) {
				return <Icons.ThreadIcon defaultSize="w-5 h-5 text-theme-primary " />;
			}
			if (channel_private === 1) {
				return <Icons.ThreadIconLocker className="w-5 h-5 text-theme-primary " />;
			}
		}

		if (type === ChannelType.CHANNEL_TYPE_GMEET_VOICE) {
			if (!channel_private || channel_private === 0) {
				return <Icons.Speaker defaultSize="w-5 5-5" />;
			}
			return <Icons.SpeakerLocked defaultSize="w-5 h-5" />;
		}

		if (type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			if (!channel_private || channel_private === 0) {
				return <Icons.Speaker defaultSize="w-5 5-5" />;
			}
			return <Icons.SpeakerLocked defaultSize="w-5 h-5" />;
		}

		if (type === ChannelType.CHANNEL_TYPE_STREAMING && (!channel_private || channel_private === 0)) {
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
		} else if (directId && !isOpenSearchModal) {
			commonChannels.map((channel) => {
				if (channel.channel_id === channelId) {
					setSpecificChannel(channel);
				}
			});
		} else {
			allChannels.map((channel) => {
				if (channel.channel_id === channelId) {
					setSpecificChannel(channel);
				}
			});
		}
	}, []);

	return (
		<div className={`flex flex-row items-center h-[24px] w-full ${wrapSuggestItemStyle ?? 'justify-between'}`}>
			<div className="flex flex-row items-center gap-2 py-[3px] text-theme-primary text-theme-primary-hover">
				{showAvatar && (
					<div>
						{color ? (
							<Icons.RoleIcon defaultSize="w-5 h-[30px] min-w-5" />
						) : (
							<AvatarImage
								alt={subText || ''}
								username={Array.isArray(subText) ? subText[0] : subText}
								srcImgProxy={createImgproxyUrl(avatarUrl ?? '')}
								src={avatarUrl}
								className="size-4"
								classNameText="text-[9px] min-w-5 min-h-5 pt-[3px] "
							/>
						)}
					</div>
				)}
				{emojiId && (
					<img src={getSrcEmoji(emojiId)} alt={getSrcEmoji(emojiId)} style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
				)}
				{channelIcon}

				{display && (
					<span className={`text-[15px] font-thin text-theme-primary one-line flex items-center`} style={{ color }}>
						<span
							className={`${isUnread || (count && count > 0) ? 'text-theme-primary-active font-semibold' : 'font-medium text-theme-primary '}`}
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
			<span className={`text-[10px] font-semibold text-theme-primary one-line ${subTextStyle}`}>
				{getChannel?.type === ChannelType.CHANNEL_TYPE_THREAD ? (
					<RenderChannelLabelForThread channel_id={getChannel?.parent_id as string} />
				) : (
					<>{HighlightMatchBold(subText ?? '', valueHightLight ?? '')}</>
				)}
			</span>
		</div>
	);
};
const RenderChannelLabelForThread = ({ channel_id }: { channel_id: string }) => {
	const channelParent = useAppSelector((state) => selectChannelById(state, channel_id ?? '')) || {};

	return <>{channelParent?.channel_label || null}</>;
};

export default memo(SuggestItem);
