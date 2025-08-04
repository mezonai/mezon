import React, { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { FriendList } from './FriendList';

interface IInviteToChannelProp {
	isUnknownChannel: boolean;
	channelId?: string;
}

const InviteToChannel = ({ isUnknownChannel, channelId = '' }: IInviteToChannelProp) => {
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
			setIsKeyboardVisible(true);
		});
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			setIsKeyboardVisible(false);
		});

		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	return <FriendList isUnknownChannel={isUnknownChannel} isKeyboardVisible={isKeyboardVisible} channelId={channelId} />;
};

export default React.memo(InviteToChannel);
