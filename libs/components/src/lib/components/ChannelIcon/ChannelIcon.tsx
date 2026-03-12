import { Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import type { ReactElement } from 'react';

export type ChannelIconProps = {
	type: number;
	isPrivate?: boolean;
	isAgeRestricted?: boolean;
	size?: string;
	className?: string;
	'data-e2e'?: string;
};

const defaultSize = 'w-5 h-5';

export const ChannelIcon = ({
	type,
	isPrivate = false,
	isAgeRestricted = false,
	size = defaultSize,
	className = '',
	'data-e2e': dataE2e,
	...rest
}: ChannelIconProps): ReactElement | null => {
	if (type !== ChannelType.CHANNEL_TYPE_CHANNEL) {
		return null;
	}
	const combinedClassName = [size, className].filter(Boolean).join(' ');
	const iconProps = { className: combinedClassName, ...(dataE2e && { 'data-e2e': dataE2e }), ...rest };
	if (isAgeRestricted) {
		return <Icons.HashtagWarning {...iconProps} />;
	}
	if (isPrivate) {
		return <Icons.HashtagLocked {...iconProps} />;
	}
	return <Icons.Hashtag {...iconProps} />;
};
