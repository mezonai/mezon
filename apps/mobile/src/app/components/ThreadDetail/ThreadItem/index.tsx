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
import { convertTimeMessage, SHARE_CONTACT_KEY } from '@mezon/utils';
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
	const messageId = useAppSelector((state) => selectLastMessageIdByChannelId(state, thread?.channel_id));
	const message = useAppSelector(
		(state) => selectMessageEntityById(state, thread?.channel_id, messageId || thread?.last_sent_message?.id) as MessagesEntity
	);
	const user = useAppSelector((state) =>
		selectMemberClanByUserId(state, message?.user?.id || thread?.last_sent_message?.sender_id)
	) as IChannelMember;

	const prioritySenderName = useMemo(() => {
		if (thread?.last_sent_message?.sender_id === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}

		return (
			user?.clan_nick ||
			user?.user?.display_name ||
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
		thread?.last_sent_message?.sender_id,
		user?.clan_nick,
		user?.user?.display_name,
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
				clanId: thread?.clan_id ?? '',
				channel: thread as ChannelsEntity
			})
		);
		requestAnimationFrame(async () => {
			store.dispatch(channelsActions.upsertOne({ clanId: thread?.clan_id ?? '', channel: thread as ChannelsEntity }));
			await store.dispatch(
				channelsActions.joinChannel({ clanId: thread?.clan_id ?? '', channelId: thread?.channel_id || '0', noFetchMembers: false })
			);
		});
		const dataSave = getUpdateOrAddClanChannelCache(thread?.clan_id, thread?.channel_id);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
	};

	const lastTimeMessage = useMemo(() => {
		if (message?.create_time_seconds) {
			return convertTimeMessage(message.create_time_seconds, i18n.language);
		} else if (thread?.last_sent_message?.timestamp_seconds) {
			return convertTimeMessage(thread.last_sent_message.timestamp_seconds, i18n.language);
		}
	}, [message?.create_time_seconds, thread?.last_sent_message?.timestamp_seconds]);

	const lastSentMessage = useMemo(() => {
		const content =
			message?.content ??
			(typeof thread?.last_sent_message?.content === 'string'
				? safeJSONParse(thread?.last_sent_message?.content || '{}')
				: thread?.last_sent_message?.content);
		const isShareContact = content?.embed?.[0]?.fields?.[0]?.value === SHARE_CONTACT_KEY;

		if (content?.t) {
			return content.t;
		} else if (isShareContact) {
			return `[${t('attachments.contact')}]`;
		} else {
			return `[${t('attachments.file')}]`;
		}
	}, [message?.content, t, thread?.last_sent_message?.content]);

	return (
		<Pressable
			onPress={() => {
				handleNavigateThread(thread);
			}}
			style={styles.threadItemWrapper}
		>
			<View style={styles.flex1}>
				<Text style={styles.threadName}>{thread?.channel_label}</Text>
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
