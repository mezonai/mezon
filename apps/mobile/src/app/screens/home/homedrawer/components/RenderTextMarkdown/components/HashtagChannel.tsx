import { ActionEmitEvent } from '@mezon/mobile-components';
import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size } from '@mezon/mobile-ui';
import { useAppDispatch } from '@mezon/store';
import { channelsActions, getStore, selectChannelById } from '@mezon/store-mobile';
import { ChannelStatusEnum } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { DeviceEventEmitter, Text } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import CustomIcon from '../../../../../../../../src/assets/CustomIcon';
import { ChannelHashtag } from '../../MarkdownFormatText/ChannelHashtag';
import { markdownStyles } from '../index';
import { styles as componentStyles } from '../index.styles';

export interface HashtagChannelProps {
	element: any;
	index: number;
	themeValue: Attributes;
	isUnReadChannel?: boolean;
	isLastMessage?: boolean;
	isBuzzMessage?: boolean;
	channelIdOverride?: string;
	clanIdOverride?: string;
	channelEntityOverride?: any;
}

const renderChannelIcon = (channelType: number, channelId: string, themeValue: Attributes, isThreadPrivate?: boolean) => {
	const iconStyle = componentStyles().channelIcon;
	if (channelType === ChannelType.CHANNEL_TYPE_MEZON_VOICE) {
		return <CustomIcon name="voice" size={size.s_14} color={baseColor.link} style={iconStyle} />;
	}
	if (channelType === ChannelType.CHANNEL_TYPE_THREAD && channelId !== 'undefined') {
		return <CustomIcon name={isThreadPrivate ? 'threadPrivate' : 'thread'} size={size.s_14} color={baseColor.link} style={iconStyle} />;
	}
	if (channelType === ChannelType.CHANNEL_TYPE_STREAMING) {
		return <CustomIcon name="stream" size={size.s_14} color={baseColor.link} style={iconStyle} />;
	}
	if (channelType === ChannelType.CHANNEL_TYPE_APP) {
		return <CustomIcon name="app" size={size.s_14} color={baseColor.link} style={iconStyle} />;
	}
	if (channelId === 'undefined') {
		return <Feather name="lock" size={size.s_14} color={themeValue.text} style={iconStyle} />;
	}
	return null;
};

function parseMarkdownLink(text: string) {
	const bracketMatch = text.match(/\[(.*?)\]/);
	const parenthesesMatch = text.match(/\((.*?)\)/);

	return {
		text: bracketMatch?.[1] || '',
		link: parenthesesMatch?.[1] || ''
	};
}

const HashtagChannelComponent = ({
	element,
	index,
	themeValue,
	isUnReadChannel = false,
	isLastMessage = false,
	isBuzzMessage = false,
	channelIdOverride,
	clanIdOverride,
	channelEntityOverride
}: HashtagChannelProps) => {
	const dispatch = useAppDispatch();

	const targetChannelId = useMemo(() => channelIdOverride ?? element?.channelid, [channelIdOverride, element?.channelid]);

	const channelFoundFromStore = useSelector((state: any) => (!channelEntityOverride ? selectChannelById(state, targetChannelId) : null));

	const channelFound = useMemo(() => channelEntityOverride ?? channelFoundFromStore, [channelEntityOverride, channelFoundFromStore]);

	const channelLabel = useMemo(() => element?.channelLabel || '', [element?.channelLabel]);
	const isHaveAccessChannel = useMemo(() => {
		const store = getStore();
		if (channelLabel && element?.parentId) {
			const channelParent = selectChannelById(store.getState(), element?.parentId);
			return !!channelParent;
		}
		return !!channelFound;
	}, [channelFound, channelLabel, element]);

	const mention = useMemo(
		() =>
			ChannelHashtag({
				channelHashtagId: targetChannelId,
				channelEntity: channelFound
			}),
		[targetChannelId, channelFound]
	);

	const { text, link } = useMemo(() => parseMarkdownLink(mention), [mention]);

	const { payloadChannel, channelType, displayText } = useMemo(() => {
		const urlFormat = link.replace(/##voice|#thread|#stream|#app|#%22|%22|"|#/g, '');
		const dataChannel = urlFormat?.split?.('***');

		let channelId = 'undefined';
		if (isHaveAccessChannel && dataChannel?.[1] && dataChannel?.[1] !== 'undefined') {
			channelId = dataChannel?.[1];
		} else if (isHaveAccessChannel && channelLabel && targetChannelId) {
			channelId = targetChannelId;
		}

		let clanId = '';
		if (clanIdOverride) {
			clanId = clanIdOverride;
		} else if (dataChannel?.[2] && dataChannel?.[2] !== 'undefined') {
			clanId = dataChannel?.[2];
		} else if (element?.clanId) {
			channelId = element?.clanId;
		}

		const payload = {
			type: Number(dataChannel?.[0] || 1),
			id: channelId,
			channelId,
			clanId,
			status: Number(dataChannel?.[3] || 1),
			meetingCode: dataChannel?.[4] || '',
			categoryId: dataChannel?.[5],
			channelLabel: text ? text : channelLabel && targetChannelId ? channelLabel : ''
		};

		const type = payload?.type ? payload?.type : channelLabel && channelId ? ChannelType.CHANNEL_TYPE_THREAD : 0;
		const display = payload?.channelId === 'undefined' || !payload?.channelId ? 'private-channel' : channelLabel ? channelLabel : text;

		return { payloadChannel: payload, channelType: type, displayText: display };
	}, [link, isHaveAccessChannel, channelLabel, targetChannelId, clanIdOverride, element?.clanId, text]);

	const textStyle = useMemo(() => {
		if (!themeValue) return {};

		const styles = markdownStyles(themeValue, isUnReadChannel, isLastMessage, isBuzzMessage);

		if (payloadChannel?.channelId === 'undefined') {
			return styles.privateChannel;
		}
		if (payloadChannel?.channelId) {
			return styles.hashtag;
		}
		return {};
	}, [themeValue, isUnReadChannel, isLastMessage, isBuzzMessage, payloadChannel]);

	const icon = useMemo(
		() =>
			renderChannelIcon(
				channelType,
				payloadChannel?.channelId,
				themeValue,
				(!channelLabel && !payloadChannel?.channelLabel) || channelFound?.channel_private === ChannelStatusEnum.isPrivate
			),
		[channelType, payloadChannel?.channelId, payloadChannel?.channelLabel, themeValue, channelLabel, channelFound?.channel_private]
	);

	const handlePress = useCallback(async () => {
		if (!payloadChannel?.channelId || !payloadChannel?.clanId) return;
		let threadPublishNotJoined = undefined;
		const res = await dispatch(channelsActions.addThreadToChannels({ channelId: payloadChannel?.channelId, clanId: payloadChannel?.clanId }));
		if (res?.payload) threadPublishNotJoined = res?.payload;

		DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_MENTION_MESSAGE_ITEM, threadPublishNotJoined || payloadChannel);
	}, [dispatch, payloadChannel]);

	return (
		<Text key={`hashtag-${index}`} style={textStyle} onPress={handlePress}>
			{icon}
			{displayText}
		</Text>
	);
};

export const HashtagChannel = memo(HashtagChannelComponent);
