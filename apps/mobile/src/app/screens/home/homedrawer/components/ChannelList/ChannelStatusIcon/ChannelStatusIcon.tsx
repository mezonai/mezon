import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { memo } from 'react';
import { Icons } from '../../../../../../componentUI/MobileIcons';

export const ChannelStatusIcon = memo(
	({ channel, isUnRead, isVoiceActive }: { channel: ChannelsEntity; isUnRead?: boolean; isVoiceActive?: boolean }) => {
		const { themeValue } = useTheme();

		const isAgeRestrictedChannel = channel?.age_restricted === 1;
		return (
			<>
				{channel?.channel_private === ChannelStatusEnum.isPrivate &&
					channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
					!isAgeRestrictedChannel && (
						<Icons.ClansLockIcon
							color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
							width={size.s_14}
							height={size.s_14}
						/>
					)}
				{channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && !isVoiceActive && (
					<Icons.VoiceIcon color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} width={size.s_14} height={size.s_14} />
				)}
				{channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && isVoiceActive && (
					<Icons.InvoiceIcon color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal} width={size.s_14} height={size.s_14} />
				)}
				{channel?.channel_private !== ChannelStatusEnum.isPrivate &&
					channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
					!isAgeRestrictedChannel && (
						<Icons.ClansOpenIcon
							color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
							width={size.s_14}
							height={size.s_14}
						/>
					)}
				{channel?.type === ChannelType.CHANNEL_TYPE_STREAMING && (
					<Icons.StreamIcon
						color={isVoiceActive ? '' : isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
						width={size.s_14}
						height={size.s_14}
					/>
				)}
				{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_APP && (
					<Icons.ChannelappIcon
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
						width={size.s_14}
						height={size.s_14}
					/>
				)}
				{channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel && (
					<Icons.ClansLockIcon
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
						width={size.s_14}
						height={size.s_14}
					/>
				)}
			</>
		);
	}
);
