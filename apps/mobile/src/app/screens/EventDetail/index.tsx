import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { ChannelEventAttachment } from '@mezon/store-mobile';
import { channelMediaActions, useAppDispatch } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { createImgproxyUrl, getMobileUploadedAttachments } from '@mezon/utils';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import React, { useCallback, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	DeviceEventEmitter,
	FlatList,
	Modal,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { openPicker } from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { EventImageViewer } from '../../components/EventImageViewer';
import ImageNative from '../../components/ImageNative';
import StatusBarHeight from '../../components/StatusBarHeight/StatusBarHeight';
import { IconCDN } from '../../constants/icon_cdn';
import { styles as createStyles } from './styles';

interface RouteParams {
	eventId: string;
	title: string;
	description?: string;
	date: string;
	attachments?: ChannelEventAttachment[];
	channelId?: string;
	clanId?: string;
	startTimeSeconds?: number;
}

const isUploaded = (att: ChannelEventAttachment) => att.file_url?.startsWith('https');

const EventDetail: React.FC = () => {
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

	const [attachments, setAttachments] = useState<ChannelEventAttachment[]>(params.attachments || []);
	const attachmentsRef = useRef<ChannelEventAttachment[]>(params.attachments || []);

	const [title, setTitle] = useState(params.title || '');
	const [description, setDescription] = useState(params.description || '');
	const [showEditModal, setShowEditModal] = useState(false);
	const [editTitle, setEditTitle] = useState(title);
	const [editDescription, setEditDescription] = useState(description);
	const [isSaving, setIsSaving] = useState(false);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleOpenEdit = useCallback(() => {
		setEditTitle(title);
		setEditDescription(description);
		setShowEditModal(true);
	}, [title, description]);

	const handleSaveEdit = useCallback(async () => {
		if (!editTitle.trim()) {
			Alert.alert('Error', 'Title cannot be empty');
			return;
		}
		setIsSaving(true);
		try {
			await dispatch(
				channelMediaActions.updateChannelTimeline({
					id: params.eventId,
					clan_id: clanId,
					channel_id: channelId,
					title: editTitle.trim(),
					description: editDescription.trim(),
					start_time_seconds: startTimeSeconds,
					attachments: attachmentsRef.current.filter((att) => isUploaded(att))
				})
			).unwrap();
			setTitle(editTitle.trim());
			setDescription(editDescription.trim());
			setShowEditModal(false);
		} catch (error) {
			Alert.alert('Error', 'Failed to update event');
		} finally {
			setIsSaving(false);
		}
	}, [editTitle, editDescription, dispatch, params.eventId, clanId, channelId, startTimeSeconds]);

	const handleImagePicker = useCallback(async () => {
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
				Alert.alert('Error', 'Session not available');
				return;
			}

			// Step 1: Create preview items with local URIs and add to grid immediately
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

			// Step 4: Sync with server
			const serverAttachments = attachmentsRef.current.filter((att) => isUploaded(att));
			await dispatch(
				channelMediaActions.updateChannelTimeline({
					id: params.eventId,
					clan_id: clanId,
					channel_id: channelId,
					start_time_seconds: startTimeSeconds,
					attachments: serverAttachments
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
				Alert.alert('Error', 'Failed to upload images');
			}
		} finally {
			setIsUploading(false);
		}
	}, [clientRef, sessionRef, dispatch, params.eventId, clanId, channelId, startTimeSeconds]);

	const handleUploadPress = useCallback(() => {
		handleImagePicker();
	}, [handleImagePicker]);

	const handleImagePress = useCallback(
		(attachment: ChannelEventAttachment) => {
			const data = {
				children: <EventImageViewer images={attachments} imageSelected={attachment} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
		},
		[attachments]
	);

	const getAttachmentUri = useCallback((att: ChannelEventAttachment) => att.thumbnail || att.file_url || '', []);
	const getProxyUri = useCallback((att: ChannelEventAttachment) => {
		const originalUrl = att.thumbnail || att.file_url || '';
		if (!originalUrl || !isUploaded(att)) return originalUrl;
		return String(createImgproxyUrl(originalUrl, { width: 300, height: 300, resizeType: 'fit' }) || '');
	}, []);

	const featuredAttachment = attachments[0];
	const gridAttachments = attachments.slice(1);

	const renderGridItem = useCallback(
		({ item }: { item: ChannelEventAttachment | 'upload_placeholder' }) => {
			if (item === 'upload_placeholder') {
				return (
					<TouchableOpacity style={styles.uploadPlaceholder} onPress={handleUploadPress} activeOpacity={0.7}>
						<View style={styles.uploadIconContainer}>
							<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_32} height={size.s_32} color="#8B5CF6" />
						</View>
					</TouchableOpacity>
				);
			}

			return (
				<TouchableOpacity style={styles.gridItem} onPress={() => handleImagePress(item)} activeOpacity={0.8}>
					<View style={styles.wrapperGridImage}>
						<ImageNative url={getProxyUri(item)} urlOriginal={getAttachmentUri(item)} style={styles.gridImage} resizeMode="cover" />
					</View>
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
		() =>
			featuredAttachment ? (
				<View style={styles.wrapperImageContainer}>
					<TouchableOpacity style={styles.featuredImageContainer} onPress={() => handleImagePress(featuredAttachment)} activeOpacity={0.9}>
						<ImageNative
							url={getProxyUri(featuredAttachment)}
							urlOriginal={getAttachmentUri(featuredAttachment)}
							style={styles.featuredImage}
							resizeMode="cover"
						/>
						<View style={styles.featuredBadge}>
							<Text style={styles.featuredBadgeText}>FEATURED</Text>
						</View>
						{!isUploaded(featuredAttachment) && (
							<View style={styles.uploadingOverlay}>
								<ActivityIndicator size="small" color="white" />
							</View>
						)}
					</TouchableOpacity>
				</View>
			) : null,
		[featuredAttachment, styles, handleImagePress, getAttachmentUri, getProxyUri]
	);

	const gridData: (ChannelEventAttachment | 'upload_placeholder')[] = [...gridAttachments, 'upload_placeholder'];

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
					<MezonIconCDN icon={IconCDN.backArrowLarge} width={size.s_28} height={size.s_28} color="white" />
				</TouchableOpacity>
				<View style={styles.headerContent}>
					<Text style={styles.headerTitle} numberOfLines={2}>
						{title || 'Event Details'}
					</Text>
					<View style={styles.dateContainer}>
						<MezonIconCDN icon={IconCDN.calendarIcon} width={size.s_14} height={size.s_14} color="white" />
						<Text style={styles.headerDate}>{params.date || 'Date'}</Text>
					</View>
				</View>
				<TouchableOpacity onPress={handleOpenEdit} style={styles.headerButton}>
					<MezonIconCDN icon={IconCDN.pencilIcon} width={size.s_28} height={size.s_20} color="white" />
				</TouchableOpacity>
			</View>

			{/* Content */}
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

			{/* Floating Action Button */}
			<TouchableOpacity style={styles.fab} onPress={handleUploadPress} activeOpacity={0.8} disabled={isUploading}>
				{isUploading ? (
					<ActivityIndicator size="small" color="white" />
				) : (
					<MezonIconCDN icon={IconCDN.uploadPlusIcon} width={size.s_24} height={size.s_24} color="white" />
				)}
			</TouchableOpacity>

			{/* Edit Event Modal */}
			<Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
				<Pressable style={editModalStyles.overlay} onPress={() => setShowEditModal(false)}>
					<Pressable style={[editModalStyles.container, { backgroundColor: themeValue.secondary }]} onPress={(e) => e.stopPropagation()}>
						<Text style={[editModalStyles.modalTitle, { color: themeValue.textStrong }]}>Edit Event</Text>
						<Text style={[editModalStyles.label, { color: themeValue.text }]}>Title</Text>
						<TextInput
							style={[
								editModalStyles.input,
								{ color: themeValue.textStrong, backgroundColor: themeValue.primary, borderColor: themeValue.border }
							]}
							value={editTitle}
							onChangeText={setEditTitle}
							placeholder="Event title"
							placeholderTextColor={themeValue.text}
							maxLength={100}
						/>
						<Text style={[editModalStyles.label, { color: themeValue.text }]}>Description</Text>
						<TextInput
							style={[
								editModalStyles.input,
								editModalStyles.textArea,
								{ color: themeValue.textStrong, backgroundColor: themeValue.primary, borderColor: themeValue.border }
							]}
							value={editDescription}
							onChangeText={setEditDescription}
							placeholder="Event description"
							placeholderTextColor={themeValue.text}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
							maxLength={500}
						/>
						<View style={editModalStyles.buttonRow}>
							<TouchableOpacity
								style={[editModalStyles.button, { backgroundColor: themeValue.primary }]}
								onPress={() => setShowEditModal(false)}
							>
								<Text style={[editModalStyles.buttonText, { color: themeValue.text }]}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[editModalStyles.button, editModalStyles.saveButton]}
								onPress={handleSaveEdit}
								disabled={isSaving}
							>
								{isSaving ? (
									<ActivityIndicator size="small" color="white" />
								) : (
									<Text style={editModalStyles.saveButtonText}>Save</Text>
								)}
							</TouchableOpacity>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</View>
	);
};

const editModalStyles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center'
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
		fontSize: size.s_16,
		marginBottom: size.s_14
	},
	textArea: {
		minHeight: 100
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

export default EventDetail;
