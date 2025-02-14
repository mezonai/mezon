import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React from 'react';

export const ChannelStatusIcon = ({ channel, isUnRead }: { channel: ChannelsEntity; isUnRead?: boolean }) => {
	const { themeValue } = useTheme();

	const isAgeRestrictedChannel = channel?.age_restricted === 1;
	return (
		<>
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				(channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) &&
				!isAgeRestrictedChannel && (
					<Icons.VoiceLockIcon
						width={size.s_18}
						height={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel && (
					<Icons.TextLockIcon width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
				)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate &&
				(channel?.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE || channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE) && (
					<Icons.VoiceNormalIcon
						width={size.s_18}
						height={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && (
				<Icons.TextIcon width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_STREAMING && (
				<Icons.StreamIcon height={size.s_18} width={size.s_18} color={themeValue.channelNormal} />
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_APP && (
				<Icons.AppChannelIcon height={size.s_18} width={size.s_18} color={themeValue.channelNormal} />
			)}
			{channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel && (
				<Icons.HashtagWarning width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
			)}
		</>
	);
};
