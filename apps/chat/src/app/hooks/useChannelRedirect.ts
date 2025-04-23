import { useAppNavigation } from '@mezon/core';
import { selectChannelById2, selectCurrentClanId, selectDefaultChannelIdByClanId, useAppSelector } from '@mezon/store';
import { safeJSONParse } from 'mezon-js';
import { useEffect } from 'react';

export const useChannelRedirect = () => {
	const clanId = useAppSelector(selectCurrentClanId);
	const { navigate, toChannelPage } = useAppNavigation();

	const idsSelectedChannel = safeJSONParse(localStorage.getItem('remember_channel') || '{}');
	const channelId = idsSelectedChannel[clanId as string];
	const channel = useAppSelector((state) => selectChannelById2(state, channelId));
	const defaultChannelId = useAppSelector((state) => selectDefaultChannelIdByClanId(state, clanId as string));

	useEffect(() => {
		if (!defaultChannelId) return;
		const redirectId = channel?.id || defaultChannelId;
		const link = toChannelPage(redirectId as string, clanId as string);
		navigate(link);
	}, [channel, clanId, defaultChannelId, navigate, toChannelPage]);
};
