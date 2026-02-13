import type { IInvite } from '@mezon/utils';

export type PreviewData = {
	title?: string;
	description?: string;
	image?: string;
	banner?: string;
	is_community?: boolean;
	type?: string;
};

export type InviteBannerData = Pick<IInvite, 'banner'> & {
	clan_banner?: string;
};
