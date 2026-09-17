import { inviteActions } from '@mezon/store';
import type { ShouldRevalidateFunction } from 'react-router-dom';
import type { CustomLoaderFunction } from './appLoader';

export const inviteLoader: CustomLoaderFunction = async ({ params, dispatch }) => {
	const { inviteId } = params;

	if (!inviteId) {
		throw new Error('inviteId ID null');
	}
	dispatch(inviteActions.getLinkInvite({ inviteId }));
	// Handle auto open deeplink when load on mobile
	const isLinux = /Linux/i.test(navigator.userAgent);
	if (inviteId && !isLinux) {
		try {
			window.location.href = `mezon.ai://invite/${inviteId}`;
		} catch (e) {
			console.error('log  => handleJoinChannel error', e);
		}
	}
	return null;
};
export const shouldRevalidateInvite: ShouldRevalidateFunction = (ctx) => {
	const { currentParams, nextParams } = ctx;
	const { inviteId: currentInviteId } = currentParams;
	const { inviteId: nextInviteId } = nextParams;

	return currentInviteId !== nextInviteId;
};
