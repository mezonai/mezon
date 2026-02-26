import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { Icons } from 'apps/mobile/src/app/componentUI/MobileIcons';
import { ChannelType } from 'mezon-js';
import React, { memo } from 'react';
import MezonIconCDN from '../../../../../../../app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';

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
					<Icons.VideoCallIcon
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
						width={size.s_14}
						height={size.s_14}
					/>
				)}
				{channel?.channel_private !== ChannelStatusEnum.isPrivate && channel?.type === ChannelType.CHANNEL_TYPE_APP && (
					<MezonIconCDN
						icon={IconCDN.channelApp}
						height={size.s_18}
						width={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
				{channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL && isAgeRestrictedChannel && (
					<MezonIconCDN
						icon={IconCDN.channelTextWarning}
						height={size.s_18}
						width={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
			</>
		);
	}
);
