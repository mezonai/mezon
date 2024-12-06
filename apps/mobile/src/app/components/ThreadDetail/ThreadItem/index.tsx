import { AngleRightIcon, getUpdateOrAddClanChannelCache, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	ChannelsEntity,
	getStoreAsync,
	MessagesEntity,
	selectLastMessageIdByChannelId,
	selectMemberClanByUserId2,
	selectMessageEntityById,
	ThreadsEntity,
	useAppSelector
} from '@mezon/store-mobile';
import { convertTimeMessage, IChannelMember } from '@mezon/utils';
import { DrawerActions, NavigationProp, useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useMessageSender } from '../../../hooks/useMessageSender';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import { APP_SCREEN, AppStackParamList } from '../../../navigation/ScreenTypes';
import { style } from './ThreadItem.style';

interface IThreadItemProps {
	thread: ThreadsEntity;
}
const ThreadItem = ({ thread }: IThreadItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<NavigationProp<AppStackParamList>>();
	const messageId = useAppSelector((state) => selectLastMessageIdByChannelId(state, thread?.channel_id as string));
	const message = useAppSelector(
		(state) => selectMessageEntityById(state, thread?.channel_id as string, messageId || thread?.last_sent_message?.id) as MessagesEntity
	);
	const user = useAppSelector((state) =>
		selectMemberClanByUserId2(state, (message?.user?.id || thread?.last_sent_message?.sender_id) as string)
	) as IChannelMember;
	const isTabletLandscape = useTabletLandscape();

	const { username } = useMessageSender(user);
	const handleNavigateThread = async (thread?: ThreadsEntity) => {
		const clanId = thread?.clan_id;
		const store = await getStoreAsync();
		if (isTabletLandscape) {
			navigation.goBack();
		} else {
			navigation.navigate(APP_SCREEN.HOME_DEFAULT);
			navigation.dispatch(DrawerActions.closeDrawer());
		}
		const channelId = thread?.channel_id;
		requestAnimationFrame(async () => {
			await store.dispatch(channelsActions.upsertOne(thread as ChannelsEntity));
			await store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false }));
		});
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
	};

	const timeMessage = useMemo(() => {
		if (message && message.create_time_seconds) {
			const lastTime = convertTimeMessage(message.create_time_seconds);
			return lastTime;
		} else {
			if (thread && thread.last_sent_message && thread.last_sent_message.timestamp_seconds) {
				const lastTime = convertTimeMessage(thread.last_sent_message.timestamp_seconds);
				return lastTime;
			}
		}
	}, [message, thread]);

	const checkType = useMemo(() => typeof thread.last_sent_message?.content === 'string', [thread.last_sent_message?.content]);
	const lastSentMessage = useMemo(() => {
		return (
			(message?.content?.t as string) ??
			(thread.last_sent_message && checkType
				? safeJSONParse(thread.last_sent_message.content || '{}').t
				: (thread.last_sent_message?.content as any)?.t || '')
		);
	}, [message, thread]);

	return (
		<Pressable
			onPress={() => {
				handleNavigateThread(thread);
			}}
			style={styles.threadItemWrapper}
		>
			<View style={{ flex: 1 }}>
				<Text style={styles.threadName}>{thread?.channel_label}</Text>
				<View style={styles.threadContent}>
					<Text style={styles.textThreadCreateBy}>{username}</Text>
					<Text numberOfLines={1} ellipsizeMode="tail" style={styles.messageContent}>
						{lastSentMessage}
					</Text>
					<Text style={styles.bullet}>•</Text>
					<Text style={styles.createTime}>{timeMessage}</Text>
				</View>
			</View>
			<AngleRightIcon width={25} height={25} color={themeValue.textDisabled} />
		</Pressable>
	);
};

export default ThreadItem;
