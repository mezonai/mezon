import { size, useTheme } from '@mezon/mobile-ui';
import { selectMemberClanByUserId, selectMemberDMByUserId, useAppSelector } from '@mezon/store-mobile';
import type { IAttachmentEntity } from '@mezon/utils';
import { convertTimeHour } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './styles';

type ChannelFileItemProps = {
	file: IAttachmentEntity;
	isDM: boolean;
};

const ChannelFileItem = memo(({ file, isDM }: ChannelFileItemProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('message');
	const userProfile = useAppSelector((state) => selectMemberDMByUserId(state, file?.uploader || ''));
	const clanProfile = useAppSelector((state) => selectMemberClanByUserId(state, file?.uploader || ''));

	const prioritySenderName = useMemo(() => {
		if (file?.uploader === process.env.NX_CHAT_APP_ANNONYMOUS_USER_ID) {
			return 'Anonymous';
		}

		if (isDM) {
			return userProfile?.display_name || userProfile?.username || '';
		}

		return clanProfile?.clan_nick || clanProfile?.user?.display_name || clanProfile?.user?.username || '';
	}, [
		clanProfile?.clan_nick,
		clanProfile?.user?.display_name,
		clanProfile?.user?.username,
		file?.uploader,
		isDM,
		userProfile?.display_name,
		userProfile?.username
	]);

	const onPressItem = () => {
		Linking.openURL(file?.url);
	};

	return (
		<TouchableOpacity style={styles.container} onPress={onPressItem}>
			<MezonIconCDN icon={IconCDN.fileIcon} height={size.s_34} width={size.s_34} color={themeValue.bgViolet} />
			<View style={styles.content}>
				<Text style={[styles.fileName, { color: themeValue.bgViolet }]} numberOfLines={1} ellipsizeMode="tail">
					{file?.filename || ''}
				</Text>
				<View style={styles.footer}>
					<Text style={styles.footerTitle} numberOfLines={1} ellipsizeMode="tail">
						{t('sharedBy', { username: prioritySenderName })}
					</Text>
					<Text style={styles.footerTime} numberOfLines={1}>
						{convertTimeHour(file?.create_time as string)}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
});

export default ChannelFileItem;
