import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelType } from 'mezon-js';
import { memo, useMemo } from 'react';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { Icons } from '../../componentUI/MobileIcons';
import { IconCDN } from '../../constants/icon_cdn';

interface IIconChannelProps {
	isChannelPrivate: boolean;
	isChannelAgeRestricted?: boolean;
	type: ChannelType;
}

function IconChannel({ isChannelPrivate, isChannelAgeRestricted, type }: IIconChannelProps) {
	const { themeValue } = useTheme();
	const renderIcon = useMemo(() => {
		switch (type) {
			case ChannelType.CHANNEL_TYPE_CHANNEL:
				if (isChannelAgeRestricted) {
					return <Icons.ClansWarningIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />;
				}
				return isChannelPrivate ? (
					<Icons.ClansLockIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />
				) : (
					<Icons.ClansOpenIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />
				);
			case ChannelType.CHANNEL_TYPE_THREAD:
				return isChannelPrivate ? (
					<Icons.ThreadLockIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />
				) : (
					<Icons.ThreadIcon color={themeValue.channelNormal} width={size.s_20} height={size.s_20} />
				);

			case ChannelType.CHANNEL_TYPE_MEZON_VOICE:
				return <Icons.VoiceIcon color={themeValue.text} width={size.s_20} height={size.s_20} />;

			case ChannelType.CHANNEL_TYPE_STREAMING:
				return <Icons.StreamIcon color={themeValue.text} width={size.s_20} height={size.s_20} />;

			case ChannelType.CHANNEL_TYPE_APP:
				return <Icons.ChannelappIcon color={themeValue.text} width={size.s_20} height={size.s_20} />;
			case ChannelType.CHANNEL_TYPE_ANNOUNCEMENT:
				return <MezonIconCDN icon={IconCDN.announcementIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;
			case ChannelType.CHANNEL_TYPE_FORUM:
				return <MezonIconCDN icon={IconCDN.forumIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />;

			default:
				return null;
		}
	}, [isChannelAgeRestricted, isChannelPrivate, type]);

	return renderIcon;
}
export default memo(IconChannel);
