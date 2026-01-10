import { getUpdateOrAddClanChannelCache, save, STORAGE_DATA_CLAN_CHANNEL_CACHE } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { ChannelsEntity, MessagesEntity, ThreadsEntity } from '@mezon/store-mobile';
import {
	channelsActions,
	getStoreAsync,
	listChannelRenderAction,
	selectLastMessageIdByChannelId,
	selectMemberClanByUserId,
	selectMessageEntityById,
	useAppSelector
} from '@mezon/store-mobile';
import i18n from '@mezon/translations';
import type { IChannelMember } from '@mezon/utils';
import { convertTimeMessage } from '@mezon/utils';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import useTabletLandscape from '../../../hooks/useTabletLandscape';
import type { AppStackParamList } from '../../../navigation/ScreenTypes';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import { style } from './ThreadItem.style';

interface IThreadItemProps {
	thread: ThreadsEntity;
}
const ThreadItem = ({ thread }: IThreadItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<NavigationProp<AppStackParamList>>();
	const { t } = useTranslation('message');
	const isTabletLandscape = useTabletLandscape();
	const messageId = useAppSelector((state) => selectLastMessageIdByChannelId(state, thread?.channelId));
	const message = useAppSelector(
		(state) => selectMessageEntityById(state, thread?.channelId, messageId || thread?.lastSentMessage?.id) as MessagesEntity
	);
	const user = useAppSelector((state) =>
		selectMemberClanByUserId(state, message?.user?.id || thread?.lastSentMessage?.senderId)
	) as IChannelMember;

	const prioritySenderName = useMemo(() => {
		if (thread?.lastSentMessage?.senderId === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}

		return (
			user?.clanNick ||
			user?.user?.displayName ||
			user?.user?.username ||
			message?.user?.name ||
			message?.user?.username ||
			message?.username ||
			''
		);
	}, [
		message?.user?.name,
		message?.user?.username,
		message?.username,
		thread?.lastSentMessage?.senderId,
		user?.clanNick,
		user?.user?.displayName,
		user?.user?.username
	]);

	const handleNavigateThread = async (thread: ThreadsEntity) => {
		const store = await getStoreAsync();
		if (isTabletLandscape) {
			navigation.goBack();
		} else {
			navigation.navigate(APP_SCREEN.HOME_DEFAULT);
		}
		store.dispatch(
			listChannelRenderAction.addThreadToListRender({
				clanId: thread?.clanId ?? '',
				channel: thread as ChannelsEntity
			})
		);
		requestAnimationFrame(async () => {
			store.dispatch(channelsActions.upsertOne({ clanId: thread?.clanId ?? '', channel: thread as ChannelsEntity }));
			await store.dispatch(
				channelsActions.joinChannel({ clanId: thread?.clanId ?? '', channelId: thread?.channelId || '', noFetchMembers: false })
			);
		});
		const dataSave = getUpdateOrAddClanChannelCache(thread?.clanId, thread?.channelId);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
	};

	const lastTimeMessage = useMemo(() => {
		if (message?.createTimeSeconds) {
			return convertTimeMessage(message.createTimeSeconds, i18n.language);
		} else if (thread?.lastSentMessage?.timestampSeconds) {
			return convertTimeMessage(thread.lastSentMessage.timestampSeconds, i18n.language);
		}
	}, [message?.createTimeSeconds, thread?.lastSentMessage?.timestampSeconds]);

	const lastSentMessage = useMemo(() => {
		const textMsg =
			(message?.content?.t as string) ??
			(typeof thread?.lastSentMessage?.content === 'string'
				? safeJSONParse(thread.lastSentMessage.content || '{}')?.t
				: (thread?.lastSentMessage?.content as any)?.t || '');
		return textMsg ? textMsg : `[${t('attachments.attachment')}]`;
	}, [message?.content?.t, t, thread?.lastSentMessage?.content]);

	return (
		<Pressable
			onPress={() => {
				handleNavigateThread(thread);
			}}
			style={styles.threadItemWrapper}
		>
			<View style={styles.flex1}>
				<Text style={styles.threadName}>{thread?.channelLabel}</Text>
				<View style={styles.threadContent}>
					<View style={styles.username}>
						{prioritySenderName && (
							<Text numberOfLines={1} style={styles.textThreadCreateBy}>
								{`${prioritySenderName}: `}
							</Text>
						)}
						<Text numberOfLines={1} ellipsizeMode="tail" style={styles.messageContent}>
							{lastSentMessage}
						</Text>
					</View>
					<View style={styles.dateString}>
						<Text style={styles.bullet}>•</Text>
						<Text numberOfLines={1} style={styles.createTime}>
							{lastTimeMessage}
						</Text>
					</View>
				</View>
			</View>
			<View style={styles.iconMargin}>
				<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_24} height={size.s_24} color={themeValue.textDisabled} />
			</View>
		</Pressable>
	);
};

export default ThreadItem;
