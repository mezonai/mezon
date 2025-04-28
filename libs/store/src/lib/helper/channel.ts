import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { selectChannelById2, selectCurrentChannel } from '../channels/channels.slice';
import { selectClanView } from '../clans/clans.slice';
import { selectDmGroupCurrent, selectDmGroupCurrentId } from '../direct/direct.slice';
import { RootState, getStore } from '../store';

export const getActiveMode = (channelId?: string): ChannelStreamMode => {
	const store = getStore();
	const appState = store.getState() as RootState;
	const isClanView = selectClanView(appState);
	const { currentChannel, currentDm } = getCurrentChannelAndDm(appState);

	const channel = channelId ? selectChannelById2(appState, channelId) : currentChannel;

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
	const currentDm = selectDmGroupCurrent(currentDmId || '')(appState);

	return { currentChannel, currentDm };
};
