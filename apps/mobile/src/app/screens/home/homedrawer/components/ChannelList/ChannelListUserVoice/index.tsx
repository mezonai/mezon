import { selectStreamMembersByChannelId, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import ChannelItem from '../ChannelItem';
import UserVoiceItem from '../ChannelListUserVoiceItem';
import { style } from './styles';

interface IUserListVoiceChannelProps {
	channelId: string;
	isCategoryExpanded: boolean;
	data: IChannel;
	isUnRead?: boolean;
	isActive?: boolean;
}

export default memo(function ChannelListUserVoice({ channelId, isCategoryExpanded, data, isUnRead, isActive }: IUserListVoiceChannelProps) {
	const styles = style();
	const voiceChannelMember = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId, data?.clan_id));
	const streamChannelMembers = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));

	const combinedMembers = useMemo(() => {
		return [...(voiceChannelMember || []), ...(streamChannelMembers || [])];
	}, [voiceChannelMember, streamChannelMembers]);

	if (!isCategoryExpanded && !combinedMembers.length) return <View />;

	return (
		<>
			<ChannelItem data={data} isUnRead={isUnRead} isActive={isActive} />
			{combinedMembers?.length > 0 && (
				<View style={[!isCategoryExpanded && styles.channelListUserVoiceWrapper]}>
					{combinedMembers.map((member: any, index) => (
						<UserVoiceItem
							key={`${index}_${member}`}
							userId={member?.user_id || member}
							index={index}
							isCategoryExpanded={isCategoryExpanded}
							totalMembers={combinedMembers.length}
						/>
					))}
				</View>
			)}
		</>
	);
});
