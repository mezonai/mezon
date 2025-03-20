import { Icons } from '@mezon/mobile-components';
import { Colors, size } from '@mezon/mobile-ui';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useMemo } from 'react';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';

function IconChannel({ channelPrivate, type }: { channelPrivate: number; type }) {
	const isChannelPrivate = useMemo(() => channelPrivate === ChannelStatusEnum.isPrivate, [channelPrivate]);

	const renderIcon = () => {
		switch (type) {
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				return isChannelPrivate ? (
					<MezonIconCDN icon={IconCDN.channelTextLock} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				) : (
					<MezonIconCDN icon={IconCDN.channelText} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				);
			case ChannelType.CHANNEL_TYPE_THREAD:
				return isChannelPrivate ? (
					<MezonIconCDN icon={IconCDN.threadLockIcon} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				) : (
					<MezonIconCDN icon={IconCDN.threadIcon} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				);

			case ChannelType.CHANNEL_TYPE_GMEET_VOICE:
				return isChannelPrivate ? (
					<MezonIconCDN icon={IconCDN.channelVoiceLock} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				) : (
					<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				);
			case ChannelType.CHANNEL_TYPE_MEZON_VOICE:
				return isChannelPrivate ? (
					<MezonIconCDN icon={IconCDN.channelVoiceLock} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				) : (
					<MezonIconCDN icon={IconCDN.channelVoice} width={size.s_20} height={size.s_20} color={Colors.textGray} />
				);

			case ChannelType.CHANNEL_TYPE_STREAMING:
				return <MezonIconCDN icon={IconCDN.channelStream} width={size.s_20} height={size.s_20} color={Colors.textGray} />;
			case ChannelType.CHANNEL_TYPE_APP:
				return <MezonIconCDN icon={IconCDN.channelApp} width={size.s_20} height={size.s_20} color={Colors.textGray} />;
			case ChannelType.CHANNEL_TYPE_ANNOUNCEMENT:
				return <Icons.Announcement defaultSize={size.s_20} defaultFill={Colors.textGray} />;
			case ChannelType.CHANNEL_TYPE_FORUM:
				return <Icons.Forum defaultSize={size.s_20} defaultFill={Colors.textGray} />;

			default:
				return null;
		}
	};

	return renderIcon();
}
export default React.memo(IconChannel);
