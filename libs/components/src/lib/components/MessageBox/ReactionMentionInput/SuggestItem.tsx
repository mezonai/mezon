import { selectChannelById, selectNumberMemberVoiceChannel, useAppSelector } from '@mezon/store';
import { HighlightMatchBold, MezonIcon, MzIcons20 } from '@mezon/ui';
import type { SearchItemProps } from '@mezon/utils';
import { createImgproxyUrl, generateE2eId, getSrcEmoji } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import { AvatarImage } from '../../AvatarImage/AvatarImage';
import { AppChannelListIcon } from '../../ChannelList/AppChannelListIcon';

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
	isRowFocused?: boolean;
	color?: string;
	alwaysShowSubText?: boolean;
	channelType?: number;
	channelPrivate?: number;
	isAgeRestricted?: boolean;
	parentId?: string;
};

const SuggestItem = ({
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
	isRowFocused = false,
	color,
	alwaysShowSubText,
	channelType,
	channelPrivate,
	isAgeRestricted,
	parentId
}: SuggestItemProps) => {
	const channel_type = channelType ?? channel?.type;
	const channel_private = channelPrivate ?? channel?.channel_private;
	const isAgeRestrictedChannel = isAgeRestricted ?? (channel as { age_restricted?: number })?.age_restricted === 1;

	const numberMembersVoice = useAppSelector((state) => selectNumberMemberVoiceChannel(state, channelId as string, channel?.clanId as string));
	const checkVoiceStatus = useMemo(() => {
		if (channelId !== undefined && numberMembersVoice && channel_type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			return numberMembersVoice >= 2;
		}
		return false;
	}, [channelId, numberMembersVoice, channel_type]);
	const channelIcon = useMemo(() => {
		if (!channel && channel_type === undefined) return null;

		const isThreadEmphasized = isUnread || Boolean(count && count > 0) || isRowFocused;
		const threadFillClass = isThreadEmphasized
			? 'text-[var(--mz-icon-selected)]'
			: 'text-[var(--mz-icon)] group-hover:text-[var(--mz-icon-selected)]';

		const isThreadLockerBodyEmphasized = isRowFocused;
		const threadLockerFillClass = isThreadLockerBodyEmphasized
			? 'text-[var(--mz-icon-selected)]'
			: 'text-[var(--mz-icon)] group-hover:text-[var(--mz-icon-selected)]';

		const hashtagLockedFillClass =
			isUnread || (count && count > 0) ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]';

		if (channel_type === ChannelType.CHANNEL_TYPE_CHANNEL) {
			if (isAgeRestrictedChannel) {
				return (
					<MezonIcon icon={MzIcons20.mzChannelWarning} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
				);
			}
			if (!channel_private || channel_private === 0) {
				return <MezonIcon icon={MzIcons20.mzChannel} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />;
			}
			if (channel_private === 1) {
				return <MezonIcon icon={MzIcons20.mzChannelPrivate} className={hashtagLockedFillClass} />;
			}
		}

		if (channel_type === ChannelType.CHANNEL_TYPE_THREAD) {
			if (!channel_private || channel_private === 0) {
				return <MezonIcon icon={MzIcons20.mzThread} className={threadFillClass} />;
			}
			if (channel_private === 1) {
				return <MezonIcon icon={MzIcons20.mzThreadPrivate} className={threadLockerFillClass} />;
			}
		}

		if (channel_type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
			if (!channel_private || channel_private === 0) {
				return <MezonIcon icon={MzIcons20.mzSpeaker} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />;
			}
			return <MezonIcon icon={MzIcons20.mzSpeakerLock} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />;
		}

		if (channel_type === ChannelType.CHANNEL_TYPE_STREAMING && (!channel_private || channel_private === 0)) {
			return <MezonIcon icon={MzIcons20.mzLive} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />;
		}

		if (channel_type === ChannelType.CHANNEL_TYPE_APP) {
			return <AppChannelListIcon isEmphasized={isUnread || Boolean(count && count > 0)} size={20} />;
		}

		return null;
	}, [channel, channel_type, channel_private, isAgeRestrictedChannel, isUnread, count, isRowFocused]);

	return (
		<div
			className={`group relative flex flex-row items-center h-[24px] w-full ${wrapSuggestItemStyle ?? 'justify-between'}`}
			data-e2e={generateE2eId('suggest_item')}
		>
			<div className="flex flex-row items-center gap-2 py-[3px] text-theme-primary text-theme-primary-hover group/mzi">
				{showAvatar && (
					<div>
						{color && !avatarUrl ? (
							<MezonIcon icon={MzIcons20.mzRole} className="text-[var(--mz-icon)]" />
						) : (
							<AvatarImage
								alt={subText || ''}
								username={Array.isArray(subText) ? subText[0] : subText}
								srcImgProxy={createImgproxyUrl(avatarUrl ?? '', { width: 100, height: 100, resizeType: 'fill-down' })}
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
							<span
								className="h-8 px-2 bg-red-500 rounded-sm font-semibold text-white ml-2"
								data-e2e={generateE2eId('suggest_item.count_badge')}
							>
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
				{channel_type === ChannelType.CHANNEL_TYPE_THREAD && !alwaysShowSubText ? (
					<RenderChannelLabelForThread channel_id={(parentId || channel?.parent_id) as string} />
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
