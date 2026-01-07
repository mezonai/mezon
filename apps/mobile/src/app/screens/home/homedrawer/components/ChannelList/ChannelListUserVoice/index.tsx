import { selectStreamMembersByChannelId, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store-mobile';
import type { IChannel, IChannelMember } from '@mezon/utils';
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

const MemoizedUserVoiceItem = memo<{
	userVoice: IChannelMember;
	index: number;
	isCategoryExpanded: boolean;
	totalMembers: number;
}>(({ userVoice, index, isCategoryExpanded, totalMembers }) => (
	<UserVoiceItem userVoice={userVoice} index={index} isCategoryExpanded={isCategoryExpanded} totalMembers={totalMembers} />
));

export default memo(function ChannelListUserVoice({ channelId, isCategoryExpanded, data, isUnRead, isActive }: IUserListVoiceChannelProps) {
	const styles = style();
	const voiceChannelMember = useAppSelector((state) => selectVoiceChannelMembersByChannelId(state, channelId));
	const streamChannelMembers = useAppSelector((state) => selectStreamMembersByChannelId(state, channelId));

	const combinedMembers = useMemo(() => {
		return [...(voiceChannelMember || []), ...(streamChannelMembers || [])];
	}, [voiceChannelMember, streamChannelMembers]);

	if (!isCategoryExpanded && !combinedMembers.length) return <View />;

	return (
		<>
			<ChannelItem data={data} isUnRead={isUnRead} isActive={isActive} />
			{combinedMembers.length > 0 && (
				<View style={[!isCategoryExpanded && styles.channelListUserVoiceWrapper]}>
					{combinedMembers.map((member, index) => (
						<MemoizedUserVoiceItem
							key={`${index}_${member?.participant || member?.userId}`}
							userVoice={member}
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
