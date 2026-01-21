import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { ChannelType } from 'mezon-js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonMenuItem from '../../../../../componentUI/MezonMenu/MezonMenuItem';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../../../../constants/icon_cdn';
import type { ClanTemplate } from '../CreateClanModal';
import CreateClanModal from '../CreateClanModal';
import { style } from './styles';

const CLAN_TEMPLATES: ClanTemplate[] = [
	{
		id: 'gaming',
		name: 'clanTemplateModal.gamingTemplate',
		icon: <MezonIconCDN icon={IconCDN.gamingIcon} useOriginalColor />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'clips-highlights', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'looking-for-group', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'admin-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lobby', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Gaming', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'friends',
		name: 'clanTemplateModal.friendsTemplate',
		icon: <MezonIconCDN icon={IconCDN.addFriendImage} useOriginalColor />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'memes', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'photos', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Stream Room', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'study-group',
		name: 'clanTemplateModal.studyGroupTemplate',
		icon: <MezonIconCDN icon={IconCDN.studyIcon} useOriginalColor />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'homework-help', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'session-planning', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'off-topic', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Study Room 1', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Study Room 2', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'school-club',
		name: 'clanTemplateModal.schoolClubTemplate',
		icon: <MezonIconCDN icon={IconCDN.createImage} useOriginalColor />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'meeting-plans', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'off-topic', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Meeting Room 1', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Meeting Room 2', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'local-community',
		name: 'clanTemplateModal.localCommunityTemplate',
		icon: <MezonIconCDN icon={IconCDN.localCommunityIcon} useOriginalColor />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'events', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'introductions', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'resources', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Meeting Room', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'artists-creators',
		name: 'clanTemplateModal.artistsCreatorsTemplate',
		icon: <MezonIconCDN icon={IconCDN.artistIcon} useOriginalColor />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'showcase', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'ideas-and-feedback', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Community Hangout', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Stream Room', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	}
];

type CreateClanTemplateProps = {
	isProfileSetting?: boolean;
};

const CreateClanTemplate = ({ isProfileSetting = false }: CreateClanTemplateProps) => {
	const { t } = useTranslation('clan');
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [isVisible, setIsVisible] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<ClanTemplate | null>(null);

	const handleSelectTemplate = (template: ClanTemplate | null) => {
		setSelectedTemplate(template);
		setIsVisible(true);
	};

	const onClose = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const handleGoback = () => {
		setIsVisible(false);
	};

	return (
		<>
			{!isVisible && (
				<View style={styles.container}>
					<StatusBarHeight />
					<LinearGradient
						start={{ x: 1, y: 0 }}
						end={{ x: 0, y: 0 }}
						colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
						style={[StyleSheet.absoluteFillObject]}
					/>
					<View style={styles.headerContainer}>
						<TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
							<MezonIconCDN icon={IconCDN.closeIcon} color={themeValue.text} width={size.s_30} height={size.s_30} />
						</TouchableOpacity>
						<Text style={styles.title}>{t('clanTemplateModal.title')}</Text>
						<Text style={styles.description}>{t('clanTemplateModal.description')}</Text>
					</View>

					<View style={styles.section}>
						<MezonMenuItem
							title={t('clanTemplateModal.createMyOwn')}
							icon={<MezonIconCDN icon={IconCDN.sparkleIcon} useOriginalColor />}
							onPress={() => handleSelectTemplate(null)}
							styleBtn={styles.menuItem}
							textStyle={styles.menuItemText}
							isLast={true}
						/>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t('clanTemplateModal.startFromTemplate')}</Text>
						<View style={styles.listContainer}>
							{CLAN_TEMPLATES.map((template) => (
								<MezonMenuItem
									key={template.id}
									title={t(template.name)}
									icon={template.icon}
									onPress={() => handleSelectTemplate(template)}
									styleBtn={styles.menuItem}
									textStyle={styles.menuItemText}
									isShow
									isLast={true}
								/>
							))}
						</View>
					</View>
				</View>
			)}
			{isVisible && <CreateClanModal template={selectedTemplate} onGoback={handleGoback} isProfileSetting={isProfileSetting} />}
		</>
	);
};

export default CreateClanTemplate;
