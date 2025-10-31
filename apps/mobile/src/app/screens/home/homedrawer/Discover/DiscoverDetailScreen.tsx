import { ActionEmitEvent, remove, save, STORAGE_CHANNEL_CURRENT_CACHE, STORAGE_CLAN_ID } from '@mezon/mobile-components';
import type { Attributes } from '@mezon/mobile-ui';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { clansActions, inviteActions } from '@mezon/store';
import { getStoreAsync, useAppDispatch } from '@mezon/store-mobile';
import type { ApiClanDiscover, ApiInviteUserRes } from 'mezon-js/api.gen';
import moment from 'moment/moment';
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, DeviceEventEmitter, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImageNative from '../../../../components/ImageNative';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';

interface DiscoverDetailScreenProps {
	clanDetail: ApiClanDiscover;
}

const detailStyle = (colors: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.primary
		},
		scrollContent: {
			flexGrow: 1
		},
		bannerContainer: {
			width: '100%',
			height: size.s_200,
			position: 'relative'
		},
		banner: {
			width: '100%',
			height: '100%'
		},
		backButton: {
			position: 'absolute',
			top: Platform.OS === 'android' ? size.s_20 : size.s_50,
			zIndex: 10,
			left: size.s_16,
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20,
			backgroundColor: 'rgba(0,0,0,0.5)',
			alignItems: 'center',
			justifyContent: 'center'
		},
		contentContainer: {
			padding: size.s_16,
			marginTop: -size.s_40,
			backgroundColor: colors.primary,
			borderTopLeftRadius: size.s_20,
			borderTopRightRadius: size.s_20
		},
		logoContainer: {
			alignSelf: 'center',
			overflow: 'hidden',
			marginTop: -size.s_50,
			marginBottom: size.s_16,
			backgroundColor: colors.primary,
			borderRadius: size.s_16
		},
		clanLogo: {
			width: size.s_80,
			height: size.s_80,
			overflow: 'hidden',
			borderRadius: size.s_16,
			borderWidth: size.s_4,
			borderColor: colors.primary
		},
		clanLogoImage: {
			width: '100%',
			height: '100%'
		},
		clanName: {
			fontSize: size.s_24,
			fontWeight: '700',
			color: colors.text,
			textAlign: 'center',
			marginBottom: size.s_8
		},
		description: {
			fontSize: size.s_14,
			color: colors.textDisabled,
			textAlign: 'center',
			lineHeight: size.s_20,
			marginBottom: size.s_16
		},
		membersRow: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: size.s_20
		},
		memberDot: {
			width: size.s_8,
			height: size.s_8,
			borderRadius: size.s_4,
			marginRight: size.s_6,
			backgroundColor: baseColor.green
		},
		memberText: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: colors.text
		},
		buttonContainer: {
			gap: size.s_12,
			marginBottom: size.s_24
		},
		joinButton: {
			backgroundColor: baseColor.blurple,
			paddingVertical: size.s_12,
			borderRadius: size.s_12,
			alignItems: 'center'
		},
		joinButtonText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: baseColor.white
		},
		shareButton: {
			backgroundColor: baseColor.blurple,
			paddingHorizontal: size.s_14,
			marginTop: size.s_8,
			paddingVertical: size.s_8,
			borderRadius: size.s_8,
			alignItems: 'center',
			borderWidth: 1,
			borderColor: colors.borderDim
		},
		shareButtonText: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: baseColor.white
		},
		infoSection: {
			gap: size.s_16,
			marginBottom: size.s_24
		},
		infoItem: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			gap: size.s_12
		},
		iconContainer: {
			width: size.s_40,
			height: size.s_40,
			borderRadius: size.s_20,
			backgroundColor: colors.secondary,
			alignItems: 'center',
			justifyContent: 'center'
		},
		infoContent: {
			flex: 1
		},
		infoTitle: {
			fontSize: size.s_14,
			fontWeight: '600',
			color: colors.text,
			marginBottom: size.s_4
		},
		infoDescription: {
			fontSize: size.s_12,
			color: colors.textDisabled,
			lineHeight: size.s_18
		},
		sectionTitle: {
			fontSize: size.s_16,
			fontWeight: '700',
			color: colors.text,
			marginBottom: size.s_12
		},
		aboutText: {
			fontSize: size.s_14,
			color: colors.textDisabled,
			lineHeight: size.s_20,
			marginBottom: size.s_16
		},
		tagsContainer: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: size.s_8,
			marginBottom: size.s_16
		},
		tag: {
			backgroundColor: colors.secondary,
			paddingHorizontal: size.s_12,
			paddingVertical: size.s_6,
			borderRadius: size.s_16,
			borderWidth: 1,
			borderColor: colors.borderDim
		},
		tagText: {
			fontSize: size.s_12,
			color: colors.text,
			fontWeight: '500'
		},
		socialContainer: {
			flexDirection: 'row',
			gap: size.s_12,
			justifyContent: 'flex-end'
		},
		socialButton: {
			width: size.s_36,
			height: size.s_36,
			borderRadius: size.s_18,
			backgroundColor: colors.secondary,
			alignItems: 'center',
			justifyContent: 'center',
			borderWidth: 1,
			borderColor: colors.borderDim
		},
		loadingContainer: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: colors.primary
		},
		errorContainer: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: size.s_20,
			backgroundColor: colors.primary
		},
		errorText: {
			fontSize: size.s_16,
			color: colors.textDisabled,
			textAlign: 'center'
		}
	});

const DiscoverDetailScreen: React.FC<DiscoverDetailScreenProps> = ({ clanDetail }) => {
	const { themeValue } = useTheme();
	const styles = detailStyle(themeValue);
	const [isLoadingJoinClan, setLoadingJoinClan] = useState(false);
	const dispatch = useAppDispatch();
	const { t } = useTranslation('discover');

	const onBack = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const onJoinClan = async () => {
		try {
			setLoadingJoinClan(true);
			const store = await getStoreAsync();
			const res = await dispatch(inviteActions.inviteUser({ inviteId: clanDetail.invite_id }));
			const payload = res.payload as ApiInviteUserRes;
			if (payload && payload?.clan_id) {
				await remove(STORAGE_CHANNEL_CURRENT_CACHE);
				save(STORAGE_CLAN_ID, payload?.clan_id);
				await store.dispatch(clansActions.fetchClans({ noCache: true, isMobile: true }));
				store.dispatch(clansActions.joinClan({ clanId: payload?.clan_id }));
				store.dispatch(clansActions.changeCurrentClan({ clanId: payload?.clan_id }));
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
			}
			setLoadingJoinClan(false);
		} catch (error) {
			console.error('log => error onJoinClan: ', error);
			setLoadingJoinClan(false);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
				<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} color={baseColor.white} width={size.s_20} height={size.s_20} />
			</TouchableOpacity>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={styles.bannerContainer}>
					<ImageNative url={clanDetail.banner} style={styles.banner} resizeMode="cover" />
				</View>

				<View style={styles.contentContainer}>
					<View style={styles.logoContainer}>
						<View style={styles.clanLogo}>
							<ImageNative url={clanDetail.clan_logo} style={styles.clanLogoImage} resizeMode="cover" />
						</View>
					</View>

					<Text style={styles.clanName}>{clanDetail.clan_name}</Text>

					<Text style={styles.description} numberOfLines={3}>
						{clanDetail.description}
					</Text>

					<View style={styles.membersRow}>
						<View style={styles.memberDot} />
						<Text style={styles.memberText}>
							{clanDetail.total_members} {t('members')}
						</Text>
					</View>

					<View style={styles.buttonContainer}>
						<TouchableOpacity disabled={isLoadingJoinClan} style={styles.joinButton} onPress={onJoinClan} activeOpacity={0.8}>
							{isLoadingJoinClan ? (
								<ActivityIndicator size="small" color={baseColor.white} />
							) : (
								<Text style={styles.joinButtonText}>{t('joinClan')}</Text>
							)}
						</TouchableOpacity>
					</View>

					<View style={styles.infoSection}>
						<View style={styles.infoItem}>
							<View style={styles.iconContainer}>
								<MezonIconCDN icon={IconCDN.messagePlusIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoTitle}>{t('howChatty')}</Text>
								<Text style={styles.infoDescription}>{t('desHowChatty')}</Text>
							</View>
						</View>

						<View style={styles.infoItem}>
							<View style={styles.iconContainer}>
								<MezonIconCDN icon={IconCDN.calendarIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoTitle}>{t('clanCreated')}</Text>
								<Text style={styles.infoDescription}>{moment(new Date(clanDetail.create_time)).format('DD/MM/YYYY HH:mm')}</Text>
							</View>
						</View>

						<View style={styles.infoItem}>
							<View style={styles.iconContainer}>
								<MezonIconCDN icon={IconCDN.starIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoTitle}>{t('feature')}</Text>
								<Text style={styles.infoDescription}>{t('desFeature')}</Text>
							</View>
						</View>

						<View style={styles.infoItem}>
							<View style={styles.iconContainer}>
								<MezonIconCDN icon={IconCDN.userGroupIcon} color={themeValue.text} width={size.s_20} height={size.s_20} />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoTitle}>{t('community')}</Text>
								<Text style={styles.infoDescription}>{t('desCommunity')}</Text>
							</View>
						</View>
					</View>

					{clanDetail.about && (
						<>
							<Text style={styles.sectionTitle}>{t('about')}</Text>
							<Text style={styles.aboutText}>{clanDetail.about}</Text>
						</>
					)}

					<View style={styles.tagsContainer}>
						<View style={styles.tag}>
							<Text style={styles.tagText}>Science & Tech</Text>
						</View>
						<View style={styles.tag}>
							<Text style={styles.tagText}>Entertainment</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</View>
	);
};

export default memo(DiscoverDetailScreen);
