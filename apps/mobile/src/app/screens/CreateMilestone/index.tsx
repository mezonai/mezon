import { size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import type { ChannelEventAttachment } from '@mezon/store-mobile';
import { channelMediaActions, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { createImgproxyUrl, getMobileUploadedAttachments } from '@mezon/utils';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { styles as createStyles } from './styles';

const isUploaded = (att: ChannelEventAttachment) => att.file_url?.startsWith('https');

const CreateMilestone: React.FC = () => {
	const { t } = useTranslation('channelCreator');
	const { themeValue, themeBasic } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();
	const route = useRoute<any>();
	const dispatch = useAppDispatch();
	const { clientRef, sessionRef } = useMezon();

	const channelId = route.params?.channelId || '';
	const clanId = route.params?.clanId || '';

	const [eventTitle, setEventTitle] = useState('');
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [story, setStory] = useState('');
	const [attachments, setAttachments] = useState<ChannelEventAttachment[]>([]);
	const attachmentsRef = useRef<ChannelEventAttachment[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [tempDate, setTempDate] = useState<Date>(selectedDate);

	const formatDate = (date: Date) => {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	};

	const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}
		if (date) {
			setSelectedDate(date);
		}
	};

	const onIOSDateChange = (event: DateTimePickerEvent, date?: Date) => {
		if (date) {
			setTempDate(date);
		}
	};

	const confirmIOSDate = () => {
		setSelectedDate(tempDate);
		setShowDatePicker(false);
	};

	const openDatePicker = () => {
		setTempDate(selectedDate);
		setShowDatePicker(true);
	};

	const handleClose = () => {
		navigation.goBack();
	};

	const handleCancel = () => {
		Alert.alert(t('createMilestone.cancelAlertTitle'), t('createMilestone.cancelAlertMessage'), [
			{ text: t('createMilestone.continueEditing'), style: 'cancel' },
			{ text: t('createMilestone.discard'), style: 'destructive', onPress: () => navigation.goBack() }
		]);
	};

	const handleAddMedia = useCallback(async () => {
		try {
			const selectedImages = await openPicker({
				mediaType: 'photo',
				multiple: true,
				maxFiles: 10,
				compressImageQuality: 0.8
			});

			const imageArray = Array.isArray(selectedImages) ? selectedImages : [selectedImages];

			const client = clientRef?.current;
			const session = sessionRef?.current;

			if (!client || !session) {
				Toast.show({
					type: 'error',
					text1: t('createMilestone.errorTitle'),
					text2: 'Session not available'
				});
				return;
			}

			// Step 1: Create preview items with local URIs
			const previewItems: ChannelEventAttachment[] = imageArray.map((img) => {
				const id = Snowflake.generate();
				const localUri = Platform.OS === 'ios' ? img.sourceURL || img.path : img.path;
				return {
					id: id?.toString(),
					file_name: img.filename || `photo-${Date.now()}`,
					file_url: localUri,
					file_type: img.mime || 'image/jpeg',
					file_size: String(img.size || 0),
					width: img.width || 0,
					height: img.height || 0,
					thumbnail: '',
					duration: 0,
					message_id: '0'
				};
			});

			setAttachments((prev) => {
				const updated = [...prev, ...previewItems];
				attachmentsRef.current = updated;
				return updated;
			});
			setIsUploading(true);

			// Step 2: Upload to CDN
			const pickedFiles: ApiMessageAttachment[] = imageArray.map((img) => ({
				url: Platform.OS === 'ios' ? img.sourceURL || img.path : img.path,
				filetype: img.mime || 'image/jpeg',
				filename: img.filename || `photo-${Date.now()}`,
				width: img.width,
				height: img.height,
				size: img.size
			}));

			const uploadedFiles = await getMobileUploadedAttachments({ attachments: pickedFiles, client, session });

			// Step 3: Replace local URIs with CDN URLs
			const uploadedMap = new Map<string, ApiMessageAttachment>();
			previewItems.forEach((item, index) => {
				if (uploadedFiles[index]) {
					uploadedMap.set(item.id, uploadedFiles[index]);
				}
			});

			setAttachments((prev) => {
				const updated = prev.map((att) => {
					const uploaded = uploadedMap.get(att.id);
					if (uploaded) {
						return {
							...att,
							file_url: uploaded.url || att.file_url,
							file_name: uploaded.filename || att.file_name,
							file_size: String(uploaded.size || att.file_size)
						};
					}
					return att;
				});
				attachmentsRef.current = updated;
				return updated;
			});
		} catch (error: unknown) {
			const err = error as { code?: string };
			if (err?.code !== 'E_PICKER_CANCELLED') {
				setAttachments((prev) => {
					const updated = prev.filter((att) => isUploaded(att));
					attachmentsRef.current = updated;
					return updated;
				});
				Toast.show({
					type: 'error',
					text1: t('createMilestone.errorTitle'),
					text2: t('createMilestone.errorMessage')
				});
			}
		} finally {
			setIsUploading(false);
		}
	}, [clientRef, sessionRef, t]);

	const handleRemoveAttachment = useCallback((id: string) => {
		setAttachments((prev) => {
			const updated = prev.filter((att) => att.id !== id);
			attachmentsRef.current = updated;
			return updated;
		});
	}, []);

	const handleSave = async () => {
		if (!eventTitle.trim()) {
			Toast.show({
				type: 'error',
				text1: t('createMilestone.requiredTitle'),
				text2: t('createMilestone.requiredMessage')
			});
			return;
		}

		try {
			const startTimeSeconds = Math.floor(selectedDate.getTime() / 1000);
			const endTimeSeconds = startTimeSeconds + 86400;
			const uploadedAttachments = attachmentsRef.current.filter((att) => isUploaded(att));

			await dispatch(
				channelMediaActions.createChannelTimeline({
					clan_id: clanId,
					channel_id: channelId,
					title: eventTitle.trim(),
					description: story.trim() || undefined,
					start_time_seconds: startTimeSeconds,
					end_time_seconds: endTimeSeconds,
					attachments: uploadedAttachments
				})
			).unwrap();

			Toast.show({
				type: 'success',
				text1: t('createMilestone.successTitle'),
				text2: t('createMilestone.successMessage')
			});
			navigation.goBack();
		} catch (error) {
			Toast.show({
				type: 'error',
				text1: t('createMilestone.errorTitle'),
				text2: t('createMilestone.errorMessage')
			});
		}
	};

	return (
		<View style={styles.container}>
			<StatusBarHeight />
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleClose} style={styles.closeButton}>
					<MezonIconCDN icon={IconCDN.backArrowLarge} width={size.s_28} height={size.s_28} color="white" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t('createMilestone.headerTitle')}</Text>
				<TouchableOpacity onPress={handleCancel}>
					<Text style={styles.cancelText}>{t('createMilestone.cancel')}</Text>
				</TouchableOpacity>
			</View>

			{/* Form Content */}
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				<View style={styles.formContainer}>
					{/* Event Title */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>{t('createMilestone.eventTitleLabel')}</Text>
						<TextInput
							style={styles.input}
							value={eventTitle}
							onChangeText={setEventTitle}
							placeholder={t('createMilestone.eventTitlePlaceholder')}
							placeholderTextColor={themeValue.textDisabled}
						/>
					</View>

					{/* Date */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>{t('createMilestone.dateLabel')}</Text>
						<TouchableOpacity onPress={openDatePicker} style={styles.dateInput}>
							<Text style={[styles.dateText, { color: themeValue.text }]}>{formatDate(selectedDate)}</Text>
							<MezonIconCDN icon={IconCDN.calendarIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
						</TouchableOpacity>
					</View>

					{Platform.OS === 'ios' && (
						<Modal transparent visible={showDatePicker} animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
							<View style={styles.modalOverlay}>
								<View style={styles.modalContent}>
									<View style={styles.modalHeader}>
										<TouchableOpacity onPress={() => setShowDatePicker(false)}>
											<Text style={[styles.modalButtonText, { color: themeValue.text }]}>{t('createMilestone.cancel')}</Text>
										</TouchableOpacity>
										<TouchableOpacity onPress={confirmIOSDate}>
											<Text style={styles.modalButtonText}>Done</Text>
										</TouchableOpacity>
									</View>
									<RNDateTimePicker
										value={tempDate}
										mode="date"
										display="spinner"
										onChange={onIOSDateChange}
										textColor={themeValue.text}
										themeVariant={themeBasic === ThemeModeBase.DARK ? 'dark' : 'light'}
									/>
								</View>
							</View>
						</Modal>
					)}

					{Platform.OS === 'android' && showDatePicker && (
						<RNDateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
					)}

					{/* The Story */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>{t('createMilestone.storyLabel')}</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							value={story}
							onChangeText={setStory}
							placeholder={t('createMilestone.storyPlaceholder')}
							placeholderTextColor={themeValue.textDisabled}
							multiline
							numberOfLines={6}
							textAlignVertical="top"
						/>
					</View>

					{/* Memories */}
					<View style={styles.fieldContainer}>
						<Text style={styles.fieldLabel}>{t('createMilestone.memoriesLabel')}</Text>

						{attachments.length > 0 ? (
							<View style={styles.mediaGrid}>
								{attachments.map((att) => {
									const originalUrl = att.thumbnail || att.file_url || '';
									const proxyUrl = isUploaded(att)
										? (createImgproxyUrl(originalUrl, { width: 200, height: 200, resizeType: 'fit' }) as string)
										: originalUrl;
									return (
										<View key={att.id} style={styles.mediaItem}>
											<ImageNative url={proxyUrl} urlOriginal={originalUrl} style={styles.mediaImage} resizeMode="cover" />
											{!isUploaded(att) && (
												<View style={styles.uploadingOverlay}>
													<ActivityIndicator size="small" color="white" />
												</View>
											)}
											<TouchableOpacity style={styles.removeMediaButton} onPress={() => handleRemoveAttachment(att.id)}>
												<MezonIconCDN icon={IconCDN.circleXIcon} width={size.s_24} height={size.s_24} color="white" />
											</TouchableOpacity>
										</View>
									);
								})}
							</View>
						) : null}

						<TouchableOpacity style={styles.uploadContainer} onPress={handleAddMedia} disabled={isUploading}>
							<View style={styles.uploadIconContainer}>
								{isUploading ? (
									<ActivityIndicator size="large" color="#8B5CF6" />
								) : (
									<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_40} height={size.s_40} color="#8B5CF6" />
								)}
							</View>
							<Text style={styles.uploadTitle}>{t('createMilestone.uploadTitle')}</Text>
							<Text style={styles.uploadSubtitle}>{t('createMilestone.uploadSubtitle')}</Text>
							<View style={styles.addMediaButton}>
								<Text style={styles.addMediaButtonText}>{t('createMilestone.addMedia')}</Text>
							</View>
						</TouchableOpacity>
					</View>

					{/* Bottom Spacing */}
					<View style={styles.bottomSpacer} />
				</View>
			</ScrollView>

			{/* Save Button */}
			<View style={styles.footer}>
				<TouchableOpacity style={styles.saveButton} onPress={handleSave}>
					<MezonIconCDN icon={IconCDN.checkmarkLargeIcon} width={size.s_24} height={size.s_24} color="white" />
					<Text style={styles.saveButtonText}>{t('createMilestone.saveButton')}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

export default CreateMilestone;
