import { Icons } from '@mezon/mobile-components';
import { Block, size, useTheme } from '@mezon/mobile-ui';
import { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';

export const ChannelStatusIcon = React.memo(({ channel, isUnRead }: { channel: ChannelsEntity; isUnRead?: boolean }) => {
	const { themeValue } = useTheme();

	const isAgeRestrictedChannel = useMemo(() => {
		return channel?.age_restricted === 1;
	}, [channel?.age_restricted]);
	return (
		<Block>
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				channel?.type === ChannelType.CHANNEL_TYPE_VOICE &&
				!isAgeRestrictedChannel && (
					<Icons.VoiceLockIcon
						width={size.s_18}
						height={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				channel?.type === ChannelType.CHANNEL_TYPE_TEXT &&
				!isAgeRestrictedChannel && (
					<Icons.TextLockIcon width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
				)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_VOICE && (
				<Icons.VoiceNormalIcon width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_TEXT && (
				<Icons.TextIcon width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_STREAMING && (
				<Icons.StreamIcon height={size.s_18} width={size.s_18} color={themeValue.channelNormal} />
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_APP && (
				<Icons.AppChannelIcon height={size.s_18} width={size.s_18} color={themeValue.channelNormal} />
			)}
			{channel?.type === ChannelType.CHANNEL_TYPE_TEXT && isAgeRestrictedChannel && (
				<Icons.HashtagWarning width={size.s_18} height={size.s_18} color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} />
			)}
		</Block>
	);
});
