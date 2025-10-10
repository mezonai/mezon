import { ChatContext } from '@mezon/core';
import {
	ActionEmitEvent,
	getAttachmentUnique,
	getUpdateOrAddClanChannelCache,
	save,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectBlockedUsersForMessage, selectDirectsOpenlist } from '@mezon/store';
import {
	channelMetaActions,
	channelsActions,
	clansActions,
	directActions,
	getStore,
	getStoreAsync,
	selectAllChannelsByUser,
	selectClansEntities,
	selectCurrentChannelId,
	selectCurrentClanId,
	selectDirectById,
	useAppDispatch
} from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import type { ILinkOnMessage } from '@mezon/utils';
import { checkIsThread, createImgproxyUrl, EBacktickType, IMAGE_MAX_FILE_SIZE, isPublicChannel, isYouTubeLink, MAX_FILE_SIZE } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	DeviceEventEmitter,
	FlatList,
	Image as ImageRN,
	Platform,
	ScrollView,
	StatusBar,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native';
import { Flow } from 'react-native-animated-spinkit';
import { Image, Video } from 'react-native-compressor';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { isImage, isVideo } from '../../../utils/helpers';
import AttachmentFilePreview from '../../home/homedrawer/components/AttachmentFilePreview';
import { RecentInteractiveSearch } from './SearchBar/RecentInteractiveSearch';
import SharingSuggestItem from './SharingSuggestItem';
import { style } from './styles';
interface ISharing {
	topUserSuggestionId?: string;
	data: any;
	onClose?: (isSend?: boolean) => void;
}

export const Sharing = ({ data, topUserSuggestionId, onClose }: ISharing) => {
	const store = getStore();
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const { t } = useTranslation(['sharing']);
	const styles = style(themeValue);
	const mezon = useMezon();
	const [dataText, setDataText] = useState<string>('');
	const [dataShareTo, setDataShareTo] = useState<any>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [channelSelected, setChannelSelected] = useState<any>();
	const [attachmentUpload, setAttachmentUpload] = useState<any>([]);
	const [attachmentPreview, setAttachmentPreview] = useState<any[]>([]);

	const listDM = useSelector(selectDirectsOpenlist);
	const topUserSuggestion = useRef(useSelector((state: any) => selectDirectById(state, topUserSuggestionId)));
	const listChannels = useRef(useSelector(selectAllChannelsByUser));
	const clans = useRef(useSelector(selectClansEntities));
	const listBlockUsers = useSelector(selectBlockedUsersForMessage);
	const { handleReconnect } = useContext(ChatContext);

	useEffect(() => {
		handleReconnect('Initial reconnect attempt');
	}, [handleReconnect]);

	const onCloseSharing = (isSend = false) => {
		onClose && onClose(isSend);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	useEffect(() => {
		if (!listDM?.length) dispatch(directActions.fetchDirectMessage({ noCache: true }));
		if (data && data?.length === 1 && (data?.[0]?.weblink || data?.[0]?.text)) setDataText(data?.[0]?.weblink || data?.[0]?.text);
		if (dataMedia?.length) convertFileFormat();
	}, [data, dispatch, listDM?.length]);

	const listChannelsText = useMemo(() => {
		return listChannels.current
			?.filter((channel) => channel.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE)
			.sort((a, b) => {
				const aLastSeen = a?.last_seen_message?.timestamp_seconds || 0;
				const bLastSeen = b?.last_seen_message?.timestamp_seconds || 0;
				return bLastSeen - aLastSeen;
			});
	}, []);

	const listDMText = useMemo(() => {
		try {
			const data = (
				listDM?.filter?.(
					(channel) =>
						!!channel?.channel_label &&
						channel?.id !== topUserSuggestionId &&
						!listBlockUsers?.some((user) => user?.id === channel?.user_ids?.[0])
				) || []
			).sort((a, b) => {
				const aLastSeen = a?.last_seen_message?.timestamp_seconds || 0;
				const bLastSeen = b?.last_seen_message?.timestamp_seconds || 0;
				return bLastSeen - aLastSeen;
			});

			return data || [];
		} catch (e) {
			return [];
		}
	}, [listDM, topUserSuggestionId]);

	useEffect(() => {
		setDataShareTo([...(topUserSuggestion.current ? [topUserSuggestion.current] : []), ...listDMText, ...listChannelsText]);
	}, [listChannelsText, listDMText]);

	const dataMedia = useMemo(() => {
		return data?.filter?.((data: { contentUri: string; filePath: string }) => !!data?.contentUri || !!data?.filePath);
	}, [data]);

	const handleSearchResults = useCallback((results: any[]) => {
		setDataShareTo(results);
	}, []);

	const handleChannelSelection = useCallback((channel: any) => {
		setChannelSelected(channel);
	}, []);

	const onChooseSuggestion = useCallback(async (channel: any) => {
		if (channel?.type === ChannelStreamMode.STREAM_MODE_DM || channel.type === ChannelStreamMode.STREAM_MODE_GROUP) {
			const store = await getStoreAsync();
			store.dispatch(
				directActions.joinDirectMessage({
					directMessageId: channel?.id,
					channelName: channel?.channel_label,
					type: channel?.type
				})
			);
		}

		handleChannelSelection(channel);
	}, []);

	const sendToDM = async (dataSend: { text: any; links: any[] }) => {
		const store = await getStoreAsync();
		await store.dispatch(
			channelsActions.joinChat({
				clanId: channelSelected?.clan_id,
				channelId: channelSelected?.channel_id,
				channelType: channelSelected?.type,
				isPublic: false
			})
		);

		await mezon.socketRef.current.writeChatMessage(
			'0',
			channelSelected?.id,
			Number(channelSelected?.user_id?.length) === 1 ? ChannelStreamMode.STREAM_MODE_DM : ChannelStreamMode.STREAM_MODE_GROUP,
			false,
			{
				t: dataSend.text,
				mk: dataSend.links || []
			},
			[],
			getAttachmentUnique(attachmentUpload) || [],
			[]
		);
	};

	const sendToGroup = async (dataSend: { text: any; links: any[] }) => {
		const clanIdStore = selectCurrentClanId(store.getState());
		const isPublic = channelSelected ? isPublicChannel(channelSelected) : false;
		const isDiffClan = clanIdStore !== channelSelected?.clan_id;
		requestAnimationFrame(async () => {
			if (isDiffClan) {
				await store.dispatch(clansActions.joinClan({ clanId: channelSelected?.clan_id }));
				await store.dispatch(clansActions.changeCurrentClan({ clanId: channelSelected?.clan_id }));
			}
			await store.dispatch(
				channelsActions.joinChannel({
					clanId: channelSelected?.clan_id ?? '',
					channelId: channelSelected?.channel_id,
					noFetchMembers: false,
					noCache: true
				})
			);
		});
		const dataSave = getUpdateOrAddClanChannelCache(channelSelected?.clan_id, channelSelected?.channel_id);
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
		save(STORAGE_CLAN_ID, channelSelected?.clan_id);
		await store.dispatch(
			channelsActions.joinChat({
				clanId: channelSelected?.clan_id,
				channelId: channelSelected?.channel_id,
				channelType: channelSelected?.type,
				isPublic
			})
		);

		await mezon.socketRef.current.writeChatMessage(
			channelSelected?.clan_id,
			channelSelected?.channel_id,
			checkIsThread(channelSelected) ? ChannelStreamMode.STREAM_MODE_THREAD : ChannelStreamMode.STREAM_MODE_CHANNEL,
			isPublic,
			{
				t: dataSend.text,
				mk: dataSend.links || []
			},
			[], //mentions
			getAttachmentUnique(attachmentUpload) || [], //attachments
			[], //references
			false, //anonymous
			false //mentionEveryone
		);
		const timestamp = Date.now() / 1000;
		dispatch(channelMetaActions.setChannelLastSeenTimestamp({ channelId: channelSelected.channel_id, timestamp }));
	};

	const processText = (inputString: string) => {
		const links: ILinkOnMessage[] = [];
		const httpPrefix = 'http';

		let i = 0;
		while (i < inputString.length) {
			if (inputString.startsWith(httpPrefix, i)) {
				// Link processing
				const startIndex = i;
				i += httpPrefix.length;
				while (i < inputString.length && ![' ', '\n', '\r', '\t'].includes(inputString[i])) {
					i++;
				}
				const endIndex = i;
				const isYoutube = isYouTubeLink(inputString);
				links.push({
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-expect-error
					type: isYoutube ? EBacktickType.LINKYOUTUBE : EBacktickType.LINK,
					s: startIndex,
					e: endIndex
				});
			} else {
				i++;
			}
		}

		return { links };
	};
	const onSend = async () => {
		setIsLoading(true);
		const { links } = processText(dataText);
		const dataSend = {
			text: dataText,
			links
		};
		// Send to DM message
		if (channelSelected.type === ChannelType.CHANNEL_TYPE_GROUP || channelSelected.type === ChannelType.CHANNEL_TYPE_DM) {
			await sendToDM(dataSend);
		} else {
			await sendToGroup(dataSend);
		}
		setIsLoading(false);
		onCloseSharing(true);
	};

	const getSizeImage = async (media: any) => {
		try {
			const fileInfo = await RNFS.stat(media.filePath || media?.contentUri);
			return fileInfo?.size || 0;
		} catch (e) {
			return 0;
		}
	};
	const convertFileFormat = async () => {
		try {
			const fileFormats = await Promise.all(
				dataMedia.map(async (media) => {
					if (!media?.filePath && !media?.contentUri) return null;
					const fileName = media?.fileName || media?.contentUri || media?.filePath;
					// Add to preview immediately
					setAttachmentPreview((prev) => [
						...prev,
						{
							url: media?.contentUri || media?.filePath,
							filename: fileName?.originalFilename || fileName,
							isUploaded: false,
							error: false
						}
					]);
					const fileSize = await getSizeImage(media);
					const checkIsVideo =
						(media?.filetype && media?.filetype?.startsWith('video')) ||
						(media?.mimeType && media?.mimeType?.startsWith('video')) ||
						isVideo(media?.filePath?.toLowerCase());
					const checkIsImage =
						(media?.filetype && media?.filetype?.startsWith('image')) ||
						(media?.mimeType && media?.mimeType?.startsWith('image')) ||
						isImage(media?.filePath?.toLowerCase());

					const maxAllowedSize = checkIsImage ? IMAGE_MAX_FILE_SIZE : MAX_FILE_SIZE;
					if (fileSize > maxAllowedSize) {
						const fileTypeText = checkIsImage ? t('common:image') : t('common:files');
						const maxSizeMB = Math.round(maxAllowedSize / (1024 * 1024));

						Toast.show({
							type: 'error',
							text1: t('fileTooLarge'),
							text2: t('fileSizeExceeded', { fileType: fileTypeText, maxSize: maxSizeMB })
						});

						setAttachmentPreview((prev) =>
							prev.map((p) => (p.url === (media?.contentUri || media?.filePath) ? { ...p, error: true, isUploaded: false } : p))
						);

						if (media?.filePath?.includes('/cache/')) await RNFS.unlink(media?.filePath);
						return null;
					}

					const pathCompressed = checkIsVideo
						? await compressVideo(media?.filePath || media?.contentUri)
						: checkIsImage
							? await compressImage(media?.filePath || media?.contentUri)
							: null;
					const fileData = await RNFS.readFile(pathCompressed || media?.contentUri || media?.filePath, 'base64');
					let width = 600;
					let height = 900;
					if (checkIsImage) {
						await new Promise((resolve, reject) => {
							ImageRN.getSize(
								media?.contentUri || media?.filePath,
								(w, h) => {
									width = w;
									height = h;
									resolve(null);
								},
								(error) => {
									console.error('Failed to get image size: ', error);
									reject(error);
								}
							);
						});
					}
					return {
						uri: media?.contentUri || media?.filePath,
						name: media?.fileName || media?.contentUri || media?.filePath,
						type: media?.mimeType,
						size: fileSize,
						width,
						height,
						fileData
					};
				})
			);
			handleFiles(fileFormats.filter((file) => !!file));
		} catch (e) {
			console.error(e);
		}
	};

	const compressImage = async (image: string) => {
		try {
			return await Image.compress(image, {
				compressionMethod: 'auto',
				quality: 1
			});
		} catch (error) {
			console.error('log  => error compressImage', error);
			return '';
		}
	};

	const compressVideo = async (video: string) => {
		try {
			return await Video.compress(video, {
				compressionMethod: 'auto'
			});
		} catch (error) {
			console.error('log  => error compressVideo', error);
			return video;
		}
	};

	const handleFiles = async (files: any) => {
		const maxRetries = 5;
		const retryDelay = 4000; // 4 seconds
		const clanIdStore = selectCurrentClanId(store.getState());
		const currentChannelId = selectCurrentChannelId(store.getState() as any);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const session = mezon.sessionRef.current;
				const client = mezon.clientRef.current;
				if (!files || !client || !session) {
					throw new Error('Client or files are not initialized');
				}

				const promises = Array.from(files).map((file: any) => {
					return handleUploadFileMobile(client, session, clanIdStore, currentChannelId, file.name, file);
				});

				const response = await Promise.all(promises);
				setAttachmentUpload(response);
				setAttachmentPreview((prev) =>
					prev.map((p) => {
						const matched = response.find((r: any) => r?.filename === p?.filename || r?.name === p?.filename || r?.url === p?.url);
						return matched ? { ...p, isUploaded: true, url: matched?.url || p.url } : p;
					})
				);
				break;
			} catch (error) {
				if (attempt === maxRetries) {
					/* empty */
				} else {
					// alert(`Attempt ${attempt} failed. Retrying in ${retryDelay / 1000} seconds...`);
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}
	};

	function removeAttachmentByUrl(urlToRemove: string) {
		setAttachmentUpload((prevAttachments) => prevAttachments.filter((attachment) => attachment.url !== urlToRemove));
		setAttachmentPreview((prev) => prev.filter((attachment) => attachment.url !== urlToRemove));
	}

	const isAttachmentUploaded = useMemo(() => {
		if (!attachmentPreview?.length) return true;
		return attachmentPreview.every((item) => item.isUploaded || item.error);
	}, [attachmentPreview]);

	const renderItemSuggest = useCallback(({ item, index }) => {
		return (
			<SharingSuggestItem
				key={`${item?.channel_id}_${index}_share_suggest_item`}
				item={item}
				clans={clans.current}
				onChooseItem={onChooseSuggestion}
			/>
		);
	}, []);

	return (
		<View style={styles.wrapper}>
			<KeyboardAvoidingView
				style={{ flex: 1, width: '100%' }}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
			>
				<StatusBarHeight />
				<View style={styles.header}>
					<TouchableOpacity onPress={() => onCloseSharing()}>
						<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_28} height={size.s_28} color={themeValue.white} />
					</TouchableOpacity>
					<Text style={styles.titleHeader}>{t('share')}</Text>
				</View>
				<RecentInteractiveSearch
					clans={clans.current}
					topUserSuggestionUser={topUserSuggestion.current}
					listDMText={listDMText}
					listChannelsText={listChannelsText}
					onSearchResults={handleSearchResults}
					onChannelSelected={handleChannelSelection}
					selectedChannel={channelSelected}
					placeholder={t('selectChannelPlaceholder')}
				/>

				<View style={styles.container}>
					<View>
						<Text style={styles.title}>{t('suggestions')}</Text>
						<FlatList
							data={dataShareTo?.length ? dataShareTo : []}
							keyExtractor={(item, index) => `${item?.id}_${index}_suggestion`}
							renderItem={renderItemSuggest}
							keyboardShouldPersistTaps={'handled'}
							onEndReachedThreshold={0.1}
							initialNumToRender={1}
							maxToRenderPerBatch={5}
							windowSize={100}
							updateCellsBatchingPeriod={10}
							decelerationRate={'fast'}
							disableVirtualization={true}
							showsVerticalScrollIndicator={false}
							removeClippedSubviews={true}
							getItemLayout={(_, index) => ({
								length: size.s_42,
								offset: size.s_42 * index,
								index
							})}
						/>
					</View>
				</View>
				<View style={styles.chatArea}>
					{!!attachmentPreview?.length && (
						<View style={[styles.attachmentRow]}>
							<ScrollView horizontal keyboardShouldPersistTaps={'always'}>
								{attachmentPreview?.map((media: any, index) => {
									const isFile =
										Platform.OS === 'android'
											? !isImage(media?.filename?.toLowerCase()) && !isVideo(media?.filename?.toLowerCase())
											: !isImage(media?.url?.toLowerCase()) && !isVideo(media?.url?.toLowerCase());
									const isUploaded = media?.isUploaded;

									return (
										<View
											key={`${media?.url}_${index}_media_sharing`}
											style={[styles.wrapperItemMedia, isFile && { height: size.s_60, width: size.s_50 * 3 }]}
										>
											{isVideo(media?.filename?.toLowerCase()) && isVideo(media?.url?.toLowerCase()) && (
												<View style={styles.videoOverlay}>
													<MezonIconCDN icon={IconCDN.playIcon} width={size.s_20} height={size.s_20} />
												</View>
											)}
											{isFile ? (
												<AttachmentFilePreview attachment={media} />
											) : (
												<FastImage
													source={{
														uri: createImgproxyUrl(media?.url ?? '', { width: 300, height: 300, resizeType: 'fit' })
													}}
													style={styles.itemMedia}
												/>
											)}
											{(isUploaded || media?.error) && (
												<TouchableOpacity
													style={styles.iconRemoveMedia}
													onPress={() => removeAttachmentByUrl(media.url ?? '')}
												>
													<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} height={size.s_18} />
												</TouchableOpacity>
											)}

											{!isUploaded && !media?.error && (
												<View style={styles.videoOverlay}>
													<ActivityIndicator size={'small'} color={'white'} />
												</View>
											)}
											{media?.error && (
												<View style={styles.videoOverlay}>
													<View style={styles.errorIconWrapper}>
														<MezonIconCDN
															icon={IconCDN.circleExlaimionIcon}
															width={size.s_14}
															height={size.s_14}
															color={baseColor.redStrong}
														/>
													</View>
												</View>
											)}
										</View>
									);
								})}
							</ScrollView>
						</View>
					)}

					<View style={styles.inputRow}>
						<View style={styles.chatInput}>
							<TextInput
								style={[styles.textInput, { height: size.s_40 }]}
								value={dataText}
								onChangeText={(text) => setDataText(text)}
								placeholder={t('addCommentPlaceholder')}
								placeholderTextColor={themeValue.textDisabled}
							/>
							{!!dataText?.length && (
								<TouchableOpacity activeOpacity={0.8} onPress={() => setDataText('')} style={styles.iconRightInput}>
									<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} />
								</TouchableOpacity>
							)}
						</View>

						<TouchableOpacity
							onPress={onSend}
							disabled={!channelSelected || !isAttachmentUploaded}
							style={[styles.sendButton, { opacity: channelSelected && isAttachmentUploaded ? 1 : 0.5 }]}
						>
							{isLoading ? (
								<Flow size={size.s_28} color={'white'} />
							) : (
								<MezonIconCDN icon={IconCDN.sendMessageIcon} width={size.s_28} height={size.s_20} color={'white'} />
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
};
