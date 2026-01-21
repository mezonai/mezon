import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { selectChannelByChannelId, selectCurrentChannel } from '../channels/channels.slice';
import { selectClanView } from '../clans/clans.slice';
import { selectDmGroupById, selectDmGroupCurrentId } from '../direct/direct.slice';
import type { RootState } from '../store';
import { getStore } from '../store';

export const getActiveMode = (channelId?: string): ChannelStreamMode => {
	const store = getStore();
	const appState = store.getState() as RootState;
	const isClanView = selectClanView(appState);
	const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);

	const channel = channelId ? selectChannelByChannelId(appState, channelId) : currentChannel;

	if (isClanView && channel) {
		if (channel.type === ChannelType.CHANNEL_TYPE_THREAD) {
			return ChannelStreamMode.STREAM_MODE_THREAD;
		}
		return ChannelStreamMode.STREAM_MODE_CHANNEL;
	}

	if (currentDm?.type === ChannelType.CHANNEL_TYPE_DM) {
		return ChannelStreamMode.STREAM_MODE_DM;
	}

	return ChannelStreamMode.STREAM_MODE_GROUP;
};

export const getCurrentChannelAndDm = (appState: RootState) => {
	const currentChannel = selectCurrentChannel(appState);
	const currentDmId = selectDmGroupCurrentId(appState);
	const currentDm = selectDmGroupById(appState, currentDmId || '');

	return { currentChannel, currentDm };
};
