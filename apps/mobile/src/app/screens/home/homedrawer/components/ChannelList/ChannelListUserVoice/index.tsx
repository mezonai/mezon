import { size } from '@mezon/mobile-ui';
import { useAppSelector } from '@mezon/store';
import { selectStreamMembersByChannelId, selectVoiceChannelMembersByChannelId } from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import React, { memo } from 'react';
import { View } from 'react-native';
import ChannelItem from '../ChannelItem';
import UserVoiceItem from '../ChannelListUserVoiceItem';

interface IUserListVoiceChannelProps {
	channelId: string;
	isCategoryExpanded: boolean;
	onPress: () => void;
	onLongPress: () => void;
	data: IChannel;
	isUnRead?: boolean;
	isActive?: boolean;
}

export default memo(function ChannelListUserVoice({
	channelId,
	isCategoryExpanded,
	onLongPress,
	onPress,
	data,
	isUnRead,
	isActive
}: IUserListVoiceChannelProps) {
	const voiceChannelMember = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId));
	const streamChannelMembers = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));
	if (!isCategoryExpanded && !voiceChannelMember?.length && !streamChannelMembers?.length) return <View />;

	return (
		<>
			<ChannelItem onPress={onPress} onLongPress={onLongPress} data={data} isUnRead={isUnRead} isActive={isActive} />
			<View style={[!isCategoryExpanded && { flexDirection: 'row', marginLeft: size.s_30 }]}>
				{voiceChannelMember?.length
					? voiceChannelMember?.map((userVoice, index) => (
							<UserVoiceItem
								key={`${index}_voice_item_${userVoice?.participant}`}
								index={index}
								userVoice={userVoice}
								isCategoryExpanded={isCategoryExpanded}
								totalMembers={voiceChannelMember?.length}
							/>
						))
					: null}
				{streamChannelMembers?.length
					? streamChannelMembers?.map((userStream, index) => (
							<UserVoiceItem
								key={`${index}_stream_item_${userStream?.participant}`}
								index={index}
								userVoice={userStream}
								isCategoryExpanded={isCategoryExpanded}
								totalMembers={streamChannelMembers?.length}
							/>
						))
					: null}
			</View>
		</>
	);
});
