import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { MessagesEntity } from '@mezon/store-mobile';
import { selectLatestMessageId, selectMemberClanByUserId, topicsActions, useAppDispatch } from '@mezon/store-mobile';
import { useNavigation } from '@react-navigation/native';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

const BASE_SEED_GID = BigInt(438845456274);

const MessageTopic = ({ message }: { message: MessagesEntity }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const topicCreator = useSelector((state) => selectMemberClanByUserId(state, message?.content?.cid as string));
	const lastTopicMessageId = useSelector((state) => selectLatestMessageId(state, message?.content?.tp));
	const { t } = useTranslation('message');
	const replyCount = lastTopicMessageId ? (BigInt(lastTopicMessageId) >> BigInt(22)) - BASE_SEED_GID : 0;

	const handleOpenTopic = () => {
		dispatch(topicsActions.setCurrentTopicId(message?.content?.tp || ''));
		dispatch(topicsActions.setInitTopicMessageId(message?.id || ''));
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.TOPIC_DISCUSSION
		});
	};

	const repliesCount = useMemo(() => {
		const numberMessages = message?.content?.rpl > 0 || Number(replyCount) > 0 ? Number(replyCount) || message?.content?.rpl : 0;
		return numberMessages > 99 ? '99+' : numberMessages;
	}, [message?.content?.rpl, replyCount]);

	const priorityCreatorAvatar = useMemo(() => {
		return topicCreator?.clan_avatar || topicCreator?.user?.avatar_url || '';
	}, [topicCreator?.clan_avatar, topicCreator?.user?.avatar_url]);

	return (
		<View style={styles.outerWrapper}>
			<TouchableOpacity onPress={handleOpenTopic} style={styles.container}>
				<View style={styles.avatarWrapper}>
					<MezonClanAvatar alt={topicCreator?.user?.username || ''} image={priorityCreatorAvatar} />
				</View>
				<Text style={styles.repliesText}>{t('creator')}</Text>
				<Text style={styles.dateMessageBox}>{t('viewTopic')}</Text>
				<Text style={styles.repliesText}>{`${repliesCount} ${repliesCount > 1 ? t('replies') : t('actions.reply')}`}</Text>
				<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} width={size.s_16} height={size.s_16} color={baseColor.gray} />
			</TouchableOpacity>
		</View>
	);
};

export default memo(MessageTopic);
