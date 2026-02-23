import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, ThemeModeBase, useTheme } from '@mezon/mobile-ui';
import type { ChannelTimelineAttachment } from '@mezon/store-mobile';
import { channelMediaActions, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { createImgproxyUrl, getMobileUploadedAttachments } from '@mezon/utils';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Alert,
	DeviceEventEmitter,
	Image,
	NativeModules,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { styles as createStyles } from './styles';

const isUploaded = (att: ChannelTimelineAttachment) => att.file_url?.startsWith('https');
const isVideoFile = (att: ChannelTimelineAttachment) => att.file_type?.startsWith('video/');

const VideoThumbnailView: React.FC<{
	videoUrl: string;
	style: any;
	resizeMode?: 'cover' | 'contain';
}> = React.memo(({ videoUrl, style: imgStyle, resizeMode = 'cover' }) => {
	const [thumbUri, setThumbUri] = useState('');

	useEffect(() => {
		if (!videoUrl) return;
		if (Platform.OS === 'ios') {
			NativeModules.VideoThumbnailModule?.getThumbnail(videoUrl)
				.then((result: { uri?: string }) => setThumbUri(result?.uri || ''))
				.catch(() => setThumbUri(''));
		} else {
			NativeModules.VideoThumbnail?.getThumbnail(videoUrl)
				.then((path: string) => setThumbUri(typeof path === 'string' ? path : ''))
				.catch(() => setThumbUri(''));
		}
	}, [videoUrl]);

	if (!thumbUri) {
		return (
			<View style={[imgStyle, { alignItems: 'center', justifyContent: 'center' }]}>
				<ActivityIndicator size="small" color="#8B5CF6" />
			</View>
		);
	}

	return <Image source={{ uri: thumbUri }} style={imgStyle} resizeMode={resizeMode} />;
});

const videoStyles = StyleSheet.create({
	playIconOverlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.25)',
		borderRadius: size.s_12
	}
});

const DatePickerContent: React.FC<{
	initialDate: Date;
	onConfirm: (date: Date) => void;
	themeValue: any;
	themeBasic: string;
	styles: any;
	t: any;
}> = ({ initialDate, onConfirm, themeValue, themeBasic, styles, t }) => {
	const [tempDate, setTempDate] = useState(initialDate);

	const handleDone = () => {
		onConfirm(tempDate);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const handleCancel = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<Pressable style={styles.modalOverlay} onPress={handleCancel}>
			<View style={styles.modalContent}>
				<View style={styles.modalHeader}>
					<TouchableOpacity onPress={handleCancel}>
						<Text style={[styles.modalButtonText, { color: themeValue.text }]}>{t('createMilestone.cancel')}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={handleDone}>
						<Text style={styles.modalButtonText}>Done</Text>
					</TouchableOpacity>
				</View>
				<RNDateTimePicker
					value={tempDate}
					mode="date"
					display="spinner"
					onChange={(_, date) => date && setTempDate(date)}
					textColor={themeValue.text}
					themeVariant={themeBasic === ThemeModeBase.DARK ? 'dark' : 'light'}
				/>
			</View>
		</Pressable>
	);
};

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
	const [attachments, setAttachments] = useState<ChannelTimelineAttachment[]>([]);
	const attachmentsRef = useRef<ChannelTimelineAttachment[]>([]);
	const [isUploading, setIsUploading] = useState(false);
	const [showDatePicker, setShowDatePicker] = useState(false);

	const isSaveDisabled = useMemo(() => {
		return isUploading || !eventTitle.trim();
	}, [isUploading, eventTitle]);

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

	const openDatePicker = () => {
		if (Platform.OS === 'ios') {
			const data = {
				children: (
					<DatePickerContent
						initialDate={selectedDate}
						onConfirm={setSelectedDate}
						themeValue={themeValue}
						themeBasic={themeBasic}
						styles={styles}
						t={t}
					/>
				)
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		} else {
			setShowDatePicker(true);
		}
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
				mediaType: 'any',
				multiple: true,
				maxFiles: 40,
				compressImageQuality: 0.9
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
			const previewItems: ChannelTimelineAttachment[] = imageArray.map((img) => {
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
					<MezonIconCDN icon={IconCDN.backArrowLarge} width={size.s_28} height={size.s_28} color={themeValue.text} />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{t('createMilestone.headerTitle')}</Text>
				<TouchableOpacity onPress={handleCancel}>
					<Text style={styles.cancelText}>{t('createMilestone.cancel')}</Text>
				</TouchableOpacity>
			</View>

			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				{/* Form Content */}
				<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
					<View style={styles.formContainer}>
						{/* Event Title */}
						<View style={styles.fieldContainer}>
							<View style={styles.fieldLabelRow}>
								<Text style={styles.fieldLabel}>{t('createMilestone.eventTitleLabel')}</Text>
								<Text style={styles.requiredBadge}>{t('createMilestone.required')}</Text>
							</View>
							<TextInput
								style={styles.input}
								value={eventTitle}
								onChangeText={setEventTitle}
								placeholder={t('createMilestone.eventTitlePlaceholder')}
								placeholderTextColor={themeValue.textDisabled}
								maxLength={100}
							/>
							<View style={styles.wrapperFieldHintRow}>
								<View style={styles.fieldHintRow}>
									<MezonIconCDN
										icon={IconCDN.circleInformation}
										width={size.s_14}
										height={size.s_14}
										color={themeValue.textDisabled}
									/>
									<Text style={styles.fieldHintText}>{t('createMilestone.titleHint')}</Text>
								</View>
								<Text style={styles.charCount}>{eventTitle.length}/100</Text>
							</View>
						</View>

						{/* Date */}
						<View style={styles.fieldContainer}>
							<View style={styles.fieldLabelRow}>
								<Text style={styles.fieldLabel}>{t('createMilestone.dateLabel')}</Text>
							</View>
							<TouchableOpacity onPress={openDatePicker} style={styles.dateInput}>
								<Text style={[styles.dateText, { color: themeValue.text }]}>{formatDate(selectedDate)}</Text>
								<MezonIconCDN icon={IconCDN.calendarIcon} width={size.s_20} height={size.s_20} color={themeValue.text} />
							</TouchableOpacity>
						</View>

						{Platform.OS === 'android' && showDatePicker && (
							<RNDateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
						)}

						{/* The Story */}
						<View style={styles.fieldContainer}>
							<View style={styles.fieldLabelRow}>
								<Text style={styles.fieldLabel}>{t('createMilestone.storyLabel')}</Text>
								<Text style={styles.optionalBadge}>{t('createMilestone.optional')}</Text>
							</View>
							<TextInput
								style={[styles.input, styles.textArea]}
								value={story}
								onChangeText={setStory}
								placeholder={t('createMilestone.storyPlaceholder')}
								placeholderTextColor={themeValue.textDisabled}
								multiline
								numberOfLines={6}
								textAlignVertical="top"
								maxLength={250}
							/>
							<Text style={styles.charCount}>{story.length}/250</Text>
						</View>

						{/* Memories */}
						<View style={styles.fieldContainer}>
							<View style={styles.fieldLabelRow}>
								<Text style={styles.fieldLabel}>{t('createMilestone.memoriesLabel')}</Text>
							</View>
							{attachments.length > 0 ? (
								<View style={styles.mediaGrid}>
									{attachments.map((att) => {
										const originalUrl = att.thumbnail || att.file_url || '';
										const proxyUrl = isUploaded(att)
											? (createImgproxyUrl(originalUrl, { width: 200, height: 200, resizeType: 'fit' }) as string)
											: originalUrl;
										const isVideo = isVideoFile(att);
										return (
											<View key={att.id} style={styles.mediaItem}>
												{isVideo ? (
													<VideoThumbnailView videoUrl={att.file_url || ''} style={styles.mediaImage} resizeMode="cover" />
												) : (
													<View style={styles.mediaImageWrapper}>
														<ImageNative
															url={proxyUrl}
															urlOriginal={originalUrl}
															style={styles.mediaImage}
															resizeMode="cover"
														/>
													</View>
												)}
												{isVideo && (
													<View style={videoStyles.playIconOverlay}>
														<MezonIconCDN
															icon={IconCDN.playIcon}
															width={size.s_24}
															height={size.s_24}
															color={baseColor.white}
														/>
													</View>
												)}
												{!isUploaded(att) && (
													<View style={styles.uploadingOverlay}>
														<ActivityIndicator size="small" color={themeValue.text} />
													</View>
												)}
												<TouchableOpacity style={styles.removeMediaButton} onPress={() => handleRemoveAttachment(att.id)}>
													<MezonIconCDN
														icon={IconCDN.circleXIcon}
														width={size.s_24}
														height={size.s_24}
														color={baseColor.white}
													/>
												</TouchableOpacity>
											</View>
										);
									})}
								</View>
							) : null}

							<TouchableOpacity style={styles.uploadContainer} onPress={handleAddMedia} disabled={isUploading}>
								<View style={styles.uploadIconContainer}>
									<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_40} height={size.s_40} color="#8B5CF6" />
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
					<TouchableOpacity style={[styles.saveButton, isSaveDisabled && { opacity: 0.5 }]} onPress={handleSave} disabled={isSaveDisabled}>
						<Text style={styles.saveButtonText}>{t('createMilestone.saveButton')}</Text>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
};

export default CreateMilestone;
