import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { memo } from 'react';
import MezonIconCDN from '../../../../../../../app/componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';

export const ChannelStatusIcon = memo(({ channel, isUnRead }: { channel: ChannelsEntity; isUnRead?: boolean }) => {
	const { themeValue } = useTheme();

	const isAgeRestrictedChannel = channel?.ageRestricted === 1;
	return (
		<>
			{channel?.channel_private === ChannelStatusEnum.isPrivate &&
				channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel && (
					<MezonIconCDN
						icon={IconCDN.channelTextLock}
						height={size.s_18}
						width={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
			{channel?.type === ChannelType.CHANNEL_TYPE_MEZON_VOICE && (
				<MezonIconCDN
					icon={IconCDN.channelVoice}
					height={size.s_18}
					width={size.s_18}
					color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
				/>
			)}
			{channel?.channel_private !== ChannelStatusEnum.isPrivate &&
				channel?.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
				!isAgeRestrictedChannel && (
					<MezonIconCDN
						icon={IconCDN.channelText}
						height={size.s_18}
						width={size.s_18}
						color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
					/>
				)}
			{channel?.type === ChannelType.CHANNEL_TYPE_STREAMING && (
				<MezonIconCDN
					icon={IconCDN.channelStream}
					height={size.s_18}
					width={size.s_18}
					color={isUnRead ? themeValue.channelUnread : themeValue.channelNormal}
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
});
