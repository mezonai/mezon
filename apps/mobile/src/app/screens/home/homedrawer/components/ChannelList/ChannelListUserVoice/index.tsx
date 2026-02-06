import { selectStreamMembersByChannelId, selectVoiceChannelMembersByChannelId, useAppSelector } from '@mezon/store-mobile';
import type { IChannel } from '@mezon/utils';
import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, View } from 'react-native';
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

	const MAX_COLLAPSED_ITEMS = 6;

	const visibleMembers = useMemo(() => {
		if (isCategoryExpanded) return combinedMembers;
		return combinedMembers.slice(0, MAX_COLLAPSED_ITEMS);
	}, [combinedMembers, isCategoryExpanded]);

	const keyExtractor = useCallback((item: any, index: number) => (item?.user_id || item) + index, []);

	const renderItem = useCallback(
		({ item, index }: { item: any; index: number }) => (
			<UserVoiceItem
				userId={item?.user_id || item}
				index={index}
				isCategoryExpanded={isCategoryExpanded}
				totalMembers={combinedMembers.length}
			/>
		),
		[isCategoryExpanded, combinedMembers.length]
	);

	if (!isCategoryExpanded && !combinedMembers.length) return <View />;

	return (
		<>
			<ChannelItem data={data} isUnRead={isUnRead} isActive={isActive} />
			{combinedMembers?.length > 0 && (
				<View style={[!isCategoryExpanded && styles.channelListUserVoiceWrapper]}>
					<FlatList
						data={visibleMembers}
						keyExtractor={keyExtractor}
						renderItem={renderItem}
						horizontal={!isCategoryExpanded}
						scrollEnabled={false}
						initialNumToRender={10}
						windowSize={3}
						maxToRenderPerBatch={10}
						removeClippedSubviews
					/>
				</View>
			)}
		</>
	);
});
