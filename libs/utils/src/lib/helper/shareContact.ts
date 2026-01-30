import { SHARE_CONTACT_KEY } from '../constant';
import type { IEmbedProps } from '../types';

export const checkIsShareContactEmbed = (embed: IEmbedProps | undefined): boolean => {
	if (!embed) return false;
	const fields = embed.fields || [];
	return fields.length > 0 && fields.some((f) => f.name === 'key' && f.value === SHARE_CONTACT_KEY);
};
export const getShareContactInfo = (embeds: IEmbedProps[] | undefined): { isShareContact: boolean; shareContactEmbed: IEmbedProps | null } => {
	if (!embeds || !Array.isArray(embeds) || embeds.length === 0) {
		return { isShareContact: false, shareContactEmbed: null };
	}
	const firstEmbed = embeds[0];
	const isShare = checkIsShareContactEmbed(firstEmbed);
	return { isShareContact: isShare, shareContactEmbed: isShare ? firstEmbed : null };
};
