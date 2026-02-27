import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelTimelineAttachment } from '@mezon/store-mobile';
import { channelMediaActions, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { createImgproxyUrl, getMobileUploadedAttachments } from '@mezon/utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Alert,
	DeviceEventEmitter,
	FlatList,
	Image,
	KeyboardAvoidingView,
	NativeModules,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import Entypo from 'react-native-vector-icons/Entypo';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { Icons } from '../../componentUI/MobileIcons';
import { EventImageViewer } from '../../components/EventImageViewer';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { AlbumDetailSkeleton } from './AlbumDetailSkeleton';
import { styles as createStyles } from './styles';

interface RouteParams {
	eventId: string;
	channelId: string;
	clanId: string;
	startTimeSeconds: number;
}

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

const AlbumDetail: React.FC = () => {
	const { t } = useTranslation('channelCreator');
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();
	const route = useRoute();
	const params = route.params as RouteParams;
	const dispatch = useAppDispatch();
	const { clientRef, sessionRef } = useMezon();

	const channelId = params.channelId || '';
	const clanId = params.clanId || '';
	const startTimeSeconds = params?.startTimeSeconds || 0;
	const [isUploading, setIsUploading] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const [attachments, setAttachments] = useState<ChannelTimelineAttachment[]>([]);
	const attachmentsRef = useRef<ChannelTimelineAttachment[]>([]);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');

	useEffect(() => {
		const fetchDetail = async () => {
			try {
				setIsLoading(true);
				const result = await dispatch(
					channelMediaActions.detailChannelTimeline({
						id: params.eventId,
						clan_id: clanId,
						channel_id: channelId,
						start_time_seconds: startTimeSeconds
					})
				).unwrap();
				const event = result.event;
				if (event) {
					setTitle(event.title || '');
					setDescription(event.description || '');
					const imgs = event.attachments || [];
					setAttachments(imgs);
					attachmentsRef.current = imgs;
					if (event.start_time_seconds) {
						const d = new Date(event.start_time_seconds * 1000);
						const day = String(d.getDate()).padStart(2, '0');
						const month = String(d.getMonth() + 1).padStart(2, '0');
						const year = d.getFullYear();
						setDate(`${day}/${month}/${year}`);
					}
				}
			} catch {
				// keep empty state
			} finally {
				setIsLoading(false);
			}
		};
		fetchDetail();
	}, [dispatch, params.eventId, clanId, channelId, startTimeSeconds]);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleOpenEdit = useCallback(() => {
		const data = {
			heightFitContent: true,
			children: (
				<EditEventContent
					initialTitle={title}
					initialDescription={description}
					onSave={async (newTitle, newDescription) => {
						await dispatch(
							channelMediaActions.updateChannelTimeline({
								id: params.eventId,
								clan_id: clanId,
								channel_id: channelId,
								title: newTitle,
								description: newDescription,
								start_time_seconds: startTimeSeconds
							})
						).unwrap();
						setTitle(newTitle);
						setDescription(newDescription);
					}}
				/>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
	}, [title, description, dispatch, params.eventId, clanId, channelId, startTimeSeconds]);

	const handleImagePicker = useCallback(async () => {
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
				Alert.alert(t('albumDetail.errorTitle'), t('albumDetail.sessionNotAvailable'));
				return;
			}

			// Step 1: Create preview items with local URIs and add to grid immediately
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

			// Step 2: Upload to CDN in background
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

			// Step 4: Sync only new uploads with server
			const newUploadedIds = new Set(previewItems.map((item) => item.id));
			const newAttachments = attachmentsRef.current.filter((att) => newUploadedIds.has(att.id) && isUploaded(att));
			await dispatch(
				channelMediaActions.updateChannelTimeline({
					id: params.eventId,
					clan_id: clanId,
					channel_id: channelId,
					start_time_seconds: startTimeSeconds,
					attachments: newAttachments
				})
			).unwrap();
		} catch (error: unknown) {
			const err = error as { code?: string };
			if (err?.code !== 'E_PICKER_CANCELLED') {
				// Remove preview items that failed to upload
				setAttachments((prev) => {
					const updated = prev.filter((att) => isUploaded(att));
					attachmentsRef.current = updated;
					return updated;
				});
				Alert.alert(t('albumDetail.errorTitle'), t('albumDetail.uploadFailed'));
			}
		} finally {
			setIsUploading(false);
		}
	}, [clientRef, sessionRef, dispatch, params.eventId, clanId, channelId, startTimeSeconds, t]);

	const handleUploadPress = useCallback(() => {
		handleImagePicker();
	}, [handleImagePicker]);

	const handleImagePress = useCallback(
		(attachment: ChannelTimelineAttachment) => {
			const data = {
				children: <EventImageViewer images={attachments} imageSelected={attachment} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[attachments]
	);

	const getAttachmentUri = useCallback((att: ChannelTimelineAttachment) => att.thumbnail || att.file_url || '', []);
	const getProxyUri = useCallback((att: ChannelTimelineAttachment) => {
		const originalUrl = att.thumbnail || att.file_url || '';
		if (!originalUrl || !isUploaded(att)) return originalUrl;
		return String(createImgproxyUrl(originalUrl, { width: 300, height: 300, resizeType: 'fit' }) || '');
	}, []);

	const featuredAttachment = attachments[0];
	const gridAttachments = attachments.slice(1);

	const renderGridItem = useCallback(
		({ item }: { item: ChannelTimelineAttachment | 'upload_placeholder' }) => {
			if (item === 'upload_placeholder') {
				return (
					<TouchableOpacity style={styles.uploadPlaceholder} onPress={handleUploadPress} activeOpacity={0.7}>
						<View style={styles.uploadIconContainer}>
							<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_32} height={size.s_32} color="#8B5CF6" />
						</View>
					</TouchableOpacity>
				);
			}

			const isVideo = isVideoFile(item);

			return (
				<TouchableOpacity style={styles.gridItem} onPress={() => handleImagePress(item)} activeOpacity={0.8}>
					<View style={styles.wrapperGridImage}>
						{isVideo ? (
							<VideoThumbnailView videoUrl={item.file_url || ''} style={styles.gridImage} />
						) : (
							<ImageNative url={getProxyUri(item)} urlOriginal={getAttachmentUri(item)} style={styles.gridImage} resizeMode="cover" />
						)}
					</View>
					{isVideo && isUploaded(item) && (
						<View style={videoStyles.playIconOverlay}>
							<Entypo name="controller-play" size={size.s_30} color="white" />
						</View>
					)}
					{!isUploaded(item) && (
						<View style={styles.uploadingOverlay}>
							<ActivityIndicator size="small" color="white" />
						</View>
					)}
				</TouchableOpacity>
			);
		},
		[styles, handleUploadPress, handleImagePress, getAttachmentUri, getProxyUri]
	);

	const listHeaderComponent = useCallback(
		() => (
			<>
				{description ? (
					<View style={styles.descriptionContainer}>
						<Text style={styles.descriptionText}>{description}</Text>
					</View>
				) : null}
				{featuredAttachment ? (
					<View style={styles.wrapperImageContainer}>
						<TouchableOpacity
							style={styles.featuredImageContainer}
							onPress={() => handleImagePress(featuredAttachment)}
							activeOpacity={0.9}
						>
							{isVideoFile(featuredAttachment) ? (
								<VideoThumbnailView videoUrl={featuredAttachment.file_url || ''} style={styles.featuredImage} />
							) : (
								<ImageNative
									url={getProxyUri(featuredAttachment)}
									urlOriginal={getAttachmentUri(featuredAttachment)}
									style={styles.featuredImage}
									resizeMode="cover"
								/>
							)}
							{isVideoFile(featuredAttachment) && isUploaded(featuredAttachment) && (
								<View style={videoStyles.playIconOverlayLarge}>
									<Entypo name="controller-play" size={size.s_50} color="white" />
								</View>
							)}
							{!isUploaded(featuredAttachment) && (
								<View style={[styles.uploadingOverlay, { margin: 0 }]}>
									<ActivityIndicator size="small" color="white" />
								</View>
							)}
						</TouchableOpacity>
					</View>
				) : null}
			</>
		),
		[featuredAttachment, description, styles, handleImagePress, getAttachmentUri, getProxyUri]
	);

	const gridData: (ChannelTimelineAttachment | 'upload_placeholder')[] = [...gridAttachments, 'upload_placeholder'];

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
				<TouchableOpacity onPress={handleBack} style={styles.headerButton}>
					<MezonIconCDN icon={IconCDN.backArrowLarge} width={size.s_28} height={size.s_28} color={themeValue.text} />
				</TouchableOpacity>
				<View style={styles.headerContent}>
					<Text style={styles.headerTitle} numberOfLines={2}>
						{title || t('albumDetail.eventDetails')}
					</Text>
					<View style={styles.dateContainer}>
						<Icons.EventIcon color={themeValue.text} width={size.s_14} height={size.s_14} />
						<Text style={styles.headerDate}>{date || t('albumDetail.date')}</Text>
					</View>
				</View>
				<TouchableOpacity onPress={handleOpenEdit} style={styles.headerButton}>
					<MezonIconCDN icon={IconCDN.pencilIcon} width={size.s_28} height={size.s_20} color={themeValue.text} />
				</TouchableOpacity>
			</View>

			{isLoading ? (
				<AlbumDetailSkeleton />
			) : (
				<FlatList
					data={gridData}
					renderItem={renderGridItem}
					keyExtractor={(item) => (item === 'upload_placeholder' ? 'upload_placeholder' : item.id)}
					numColumns={2}
					ListHeaderComponent={listHeaderComponent}
					contentContainerStyle={styles.gridContainer}
					showsVerticalScrollIndicator={false}
					initialNumToRender={6}
					maxToRenderPerBatch={6}
					windowSize={5}
					removeClippedSubviews={true}
					ListFooterComponent={<View style={styles.bottomSpacer} />}
				/>
			)}

			<TouchableOpacity style={styles.fab} onPress={handleUploadPress} activeOpacity={0.8} disabled={isUploading}>
				<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_24} height={size.s_24} color="white" />
			</TouchableOpacity>
		</View>
	);
};

interface EditEventContentProps {
	initialTitle: string;
	initialDescription: string;
	onSave: (title: string, description: string) => Promise<void>;
}

const EditEventContent: React.FC<EditEventContentProps> = ({ initialTitle, initialDescription, onSave }) => {
	const { t } = useTranslation('channelCreator');
	const { themeValue } = useTheme();
	const [editTitle, setEditTitle] = React.useState(initialTitle);
	const [editDescription, setEditDescription] = React.useState(initialDescription);
	const [isSaving, setIsSaving] = React.useState(false);

	const handleDismiss = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	const handleSave = async () => {
		if (!editTitle.trim()) {
			Alert.alert(t('albumDetail.errorTitle'), t('albumDetail.titleRequired'));
			return;
		}
		setIsSaving(true);
		try {
			await onSave(editTitle.trim(), editDescription.trim());
			handleDismiss();
		} catch {
			Alert.alert(t('albumDetail.errorTitle'), t('albumDetail.updateFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<KeyboardAvoidingView style={editStyles.modalWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
			<View style={[editStyles.container, { backgroundColor: themeValue.secondary }]}>
				<Text style={[editStyles.modalTitle, { color: themeValue.textStrong }]}>{t('albumDetail.editEvent')}</Text>
				<Text style={[editStyles.label, { color: themeValue.text }]}>{t('albumDetail.titleLabel')}</Text>
				<TextInput
					style={[editStyles.input, { color: themeValue.textStrong, backgroundColor: themeValue.primary, borderColor: themeValue.border }]}
					value={editTitle}
					onChangeText={setEditTitle}
					placeholder={t('albumDetail.titlePlaceholder')}
					placeholderTextColor={themeValue.text}
					maxLength={100}
				/>
				<Text style={[editStyles.charCount, { color: themeValue.textDisabled }]}>{editTitle.length}/100</Text>
				<Text style={[editStyles.label, { color: themeValue.text }]}>{t('albumDetail.descriptionLabel')}</Text>
				<TextInput
					style={[
						editStyles.input,
						editStyles.textArea,
						{ color: themeValue.textStrong, backgroundColor: themeValue.primary, borderColor: themeValue.border }
					]}
					value={editDescription}
					onChangeText={setEditDescription}
					placeholder={t('albumDetail.descriptionPlaceholder')}
					placeholderTextColor={themeValue.text}
					multiline
					numberOfLines={4}
					textAlignVertical="top"
					maxLength={250}
				/>
				<Text style={[editStyles.charCount, { color: themeValue.textDisabled }]}>{editDescription.length}/250</Text>
				<View style={editStyles.buttonRow}>
					<TouchableOpacity style={[editStyles.button, { backgroundColor: themeValue.primary }]} onPress={handleDismiss}>
						<Text style={[editStyles.buttonText, { color: themeValue.text }]}>{t('albumDetail.cancel')}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[editStyles.button, editStyles.saveButton]} onPress={handleSave} disabled={isSaving}>
						{isSaving ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<Text style={editStyles.saveButtonText}>{t('albumDetail.save')}</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
};

const editStyles = StyleSheet.create({
	modalWrapper: {
		width: '100%',
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	container: {
		width: '85%',
		borderRadius: size.s_16,
		padding: size.s_20
	},
	modalTitle: {
		fontSize: size.s_20,
		fontWeight: '700',
		textAlign: 'center',
		marginBottom: size.s_16
	},
	label: {
		fontSize: size.s_14,
		fontWeight: '600',
		marginBottom: size.s_6
	},
	input: {
		borderWidth: 1,
		borderRadius: size.s_10,
		paddingHorizontal: size.s_12,
		paddingVertical: size.s_10,
		fontSize: size.s_16
	},
	textArea: {
		minHeight: 100
	},
	charCount: {
		fontSize: size.s_12,
		textAlign: 'right',
		marginTop: size.s_4,
		marginBottom: size.s_10
	},
	buttonRow: {
		flexDirection: 'row',
		gap: size.s_10,
		marginTop: size.s_6
	},
	button: {
		flex: 1,
		paddingVertical: size.s_12,
		borderRadius: size.s_10,
		alignItems: 'center'
	},
	buttonText: {
		fontSize: size.s_16,
		fontWeight: '600'
	},
	saveButton: {
		backgroundColor: baseColor.blurple
	},
	saveButtonText: {
		fontSize: size.s_16,
		fontWeight: '600',
		color: 'white'
	}
});

const videoStyles = StyleSheet.create({
	playIconOverlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		margin: size.s_8,
		borderRadius: size.s_16,
		backgroundColor: 'rgba(0, 0, 0, 0.2)'
	},
	playIconOverlayLarge: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.2)'
	}
});

export default AlbumDetail;
