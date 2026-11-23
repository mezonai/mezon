import { useAppNavigation } from '@mezon/core';
import {
	selectChannelByIdAndClanId,
	selectChannelFetchSuccessByClanId,
	selectCurrentClanId,
	selectDefaultChannelIdByClanId,
	selectListChannelRenderByClanId,
	selectWelcomeChannelByClanId,
	useAppSelector
} from '@mezon/store';
import { isRealClanId } from '@mezon/utils';
import { ChannelType, safeJSONParse } from 'mezon-js';
import { useEffect } from 'react';

export const useChannelRedirect = () => {
	const clanId = useAppSelector(selectCurrentClanId);
	const { navigate, toChannelPage, toMembersPage } = useAppNavigation();

	const idsSelectedChannel = safeJSONParse(localStorage.getItem('remember_channel') || '{}');
	const channelId = idsSelectedChannel[clanId as string];
	const channel = useAppSelector((state) => selectChannelByIdAndClanId(state, clanId as string, channelId));
	const welcomeChannelId = useAppSelector((state) => selectWelcomeChannelByClanId(state, clanId as string));
	const welcomeChannel = useAppSelector((state) => selectChannelByIdAndClanId(state, clanId as string, welcomeChannelId as string));
	const defaultChannelId = useAppSelector((state) => selectDefaultChannelIdByClanId(state, clanId as string));
	const listChannelRender = useAppSelector((state) => selectListChannelRenderByClanId(state, clanId as string));
	const isFetchChannelSuccess = useAppSelector((state) => selectChannelFetchSuccessByClanId(state, clanId as string));

	const firstPublicChannelId = listChannelRender?.find(
		(item) =>
			!('channels' in item) &&
			item.type === ChannelType.CHANNEL_TYPE_CHANNEL &&
			(!item.parent_id || item.parent_id === '0') &&
			!item.channel_private
	)?.id;

	useEffect(() => {
		if (!isRealClanId(clanId) || !isFetchChannelSuccess) return;
		const publicWelcomeChannelId = welcomeChannel && !welcomeChannel.channel_private ? welcomeChannel.id : '';
		const redirectId = channel?.id || publicWelcomeChannelId || firstPublicChannelId || defaultChannelId;
		navigate(redirectId ? toChannelPage(redirectId, clanId) : toMembersPage(clanId), true);
	}, [channel, clanId, welcomeChannel, firstPublicChannelId, defaultChannelId, isFetchChannelSuccess, navigate, toChannelPage, toMembersPage]);
};
