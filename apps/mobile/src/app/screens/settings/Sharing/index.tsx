import { ChatContext } from '@mezon/core';
import {
	getAttachmentUnique,
	getUpdateOrAddClanChannelCache,
	PlayIcon,
	save,
	SendIcon,
	STORAGE_CLAN_ID,
	STORAGE_DATA_CLAN_CHANNEL_CACHE
} from '@mezon/mobile-components';
import { Colors, size, useTheme } from '@mezon/mobile-ui';
import { selectDirectsOpenlist } from '@mezon/store';
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
	useAppDispatch
} from '@mezon/store-mobile';
import { handleUploadFileMobile, useMezon } from '@mezon/transport';
import { checkIsThread, createImgproxyUrl, EBacktickType, ILinkOnMessage, isPublicChannel, isYouTubeLink } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
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
import { useSelector } from 'react-redux';
import Images from '../../../../assets/Images';
import StatusBarHeight from '../../../components/StatusBarHeight/StatusBarHeight';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { isImage, isVideo } from '../../../utils/helpers';
import AttachmentFilePreview from '../../home/homedrawer/components/AttachmentFilePreview';
import SharingSuggestItem from './SharingSuggestItem';
import { style } from './styles';
interface ISharing {
	data: any;
	onClose?: (isSend?: boolean) => void;
}

export const Sharing = ({ data, onClose }: ISharing) => {
	const store = getStore();
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const listDM = useSelector(selectDirectsOpenlist);

	useEffect(() => {
		if (!listDM?.length) dispatch(directActions.fetchDirectMessage({ noCache: true }));
	}, [listDM?.length]);

	const clans = useMemo(() => {
		return selectClansEntities(store.getState() as any);
	}, []);

	const listChannelsText = useMemo(() => {
		const listChannels = selectAllChannelsByUser(store.getState() as any);
		return listChannels.filter(
			(channel) => channel.type !== ChannelType.CHANNEL_TYPE_GMEET_VOICE && channel.type !== ChannelType.CHANNEL_TYPE_MEZON_VOICE
		);
	}, [store]);

	const listDMText = useMemo(() => {
		try {
			const data = listDM?.filter?.((channel) => !!channel?.channel_label);
			if (data?.length) return data;
			return [];
		} catch (e) {
			return [];
		}
	}, [listDM?.length]);

	const mezon = useMezon();
	const [dataText, setDataText] = useState<string>('');
	const [dataShareTo, setDataShareTo] = useState<any>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [inputFocus, setInputFocus] = useState<boolean>(false);
	const [searchText, setSearchText] = useState<string>('');
	const [channelSelected, setChannelSelected] = useState<any>();
	const inputSearchRef = useRef<any>(null);
	const [attachmentUpload, setAttachmentUpload] = useState<any>([]);
	const { handleReconnect } = useContext(ChatContext);
	const dataMedia = useMemo(() => {
		return data?.filter((data: { contentUri: string; filePath: string }) => !!data?.contentUri || !!data?.filePath);
	}, [data]);

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (data) {
			if (data?.length === 1 && (data?.[0]?.weblink || data?.[0]?.text)) {
				setDataText(data?.[0]?.weblink || data?.[0]?.text);
			}
		}
	}, [data]);

	useEffect(() => {
		handleReconnect('Initial reconnect attempt');
	}, [handleReconnect]);

	useEffect(() => {
		if (dataMedia?.length) {
			convertFileFormat();
		}
	}, [dataMedia]);

	// Memoize the combined channels list to avoid recreating it on every search
	const combinedChannels = useMemo(() => {
		return [...(listDMText || []), ...(listChannelsText || [])];
	}, [listDMText, listChannelsText]);

	useEffect(() => {
		setDataShareTo(combinedChannels);
	}, [combinedChannels]);

	// Optimized search function with better performance
	const generateChannelMatch = useCallback(
		(searchText: string) => {
			if (!searchText.trim()) return combinedChannels;

			const normalizedSearch = searchText.trim().toLowerCase();
			const matchChannels: any[] = [];
			const matchChannelIds = new Set<string>();

			// Single pass to find matching channels and collect their IDs
			for (const channel of combinedChannels) {
				const channelLabel = channel?.channel_label?.toString()?.toLowerCase();
				// Check if channel has user information for DM channels
				const hasUserMatch = (channel as any)?.usernames?.some?.((username: string) => username?.toLowerCase()?.includes(normalizedSearch));

				const isMatch = channelLabel?.includes(normalizedSearch) || hasUserMatch;

				if (isMatch) {
					matchChannels.push(channel);
					if (channel?.channel_id) {
						matchChannelIds.add(channel.channel_id);
					}
				}
			}

			// Find child channels in a single pass
			const childChannels = combinedChannels.filter((item) => item?.parent_id && matchChannelIds.has(item.parent_id));

			return [...matchChannels, ...childChannels];
		},
		[combinedChannels]
	);

	const debouncedSearch = useCallback(
		debounce((keyword: string) => {
			const matchedChannels = generateChannelMatch(keyword);
			setDataShareTo(matchedChannels);
		}, 300),
		[generateChannelMatch]
	);

	const onChooseSuggestion = useCallback(async (channel: any) => {
		setInputFocus(false);
		// Send to DM message
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

		setChannelSelected(channel);
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

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

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
				isPublic: isPublic
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
		onClose(true);
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
					setAttachmentUpload((prev) => [
						...prev,
						{ url: media?.contentUri || media?.filePath, filename: fileName?.originalFilename || fileName }
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
					const pathCompressed = checkIsVideo
						? await compressVideo(media?.filePath || media?.contentUri)
						: checkIsImage
							? await compressImage(media?.filePath || media?.contentUri)
							: null;
					const fileData = await RNFS.readFile(pathCompressed || media?.filePath || media?.contentUri, 'base64');
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
			handleFiles(fileFormats);
		} catch (e) {
			console.error(e);
		}
	};

	const compressImage = async (image: string) => {
		try {
			return await Image.compress(image, {
				compressionMethod: 'auto',
				quality: 0.9
			});
		} catch (error) {
			console.error('log  => error compressImage', error);
			return image;
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
	}

	const isAttachmentUploaded = useMemo(() => {
		if (!attachmentUpload) return true;

		return attachmentUpload.every((attachment: any) => attachment?.url?.includes('http'));
	}, [attachmentUpload]);

	const renderItemSuggest = useCallback(
		({ item, index }) => {
			return (
				<SharingSuggestItem
					key={`${item?.channel_id}_${index}_share_suggest_item`}
					item={item}
					clans={clans}
					onChooseItem={onChooseSuggestion}
				/>
			);
		},
		[clans]
	);

	return (
		<View style={styles.wrapper}>
			<KeyboardAvoidingView
				style={{ flex: 1, width: '100%' }}
				behavior={'padding'}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight + 5}
			>
				<StatusBarHeight />
				<View style={styles.header}>
					<TouchableOpacity onPress={() => onClose()}>
						<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_28} height={size.s_28} color={themeValue.white} />
					</TouchableOpacity>
					<Text style={styles.titleHeader}>Share</Text>
				</View>
				<View style={styles.searchInput}>
					<View style={styles.inputWrapper}>
						{channelSelected ? (
							<View style={styles.iconLeftInput}>
								{channelSelected?.type === ChannelType.CHANNEL_TYPE_GROUP ? (
									<FastImage
										source={Images.AVATAR_GROUP}
										style={{
											width: size.s_18,
											height: size.s_18,
											borderRadius: size.s_18
										}}
									/>
								) : (
									<MezonAvatar
										avatarUrl={channelSelected?.channel_avatar?.[0] || clans?.[channelSelected?.clan_id]?.logo}
										username={clans?.[channelSelected?.clan_id]?.clan_name || channelSelected?.channel_label}
										width={size.s_18}
										height={size.s_18}
									/>
								)}
							</View>
						) : (
							<View style={styles.iconLeftInput}>
								<MezonIconCDN icon={IconCDN.magnifyingIcon} width={size.s_18} height={size.s_18} color={themeValue.text} />
							</View>
						)}
						{channelSelected ? (
							<Text style={styles.textChannelSelected}>{channelSelected?.channel_label}</Text>
						) : (
							<TextInput
								ref={inputSearchRef}
								style={styles.textInput}
								onChangeText={(value) => {
									setSearchText(value);
									debouncedSearch(value);
								}}
								onFocus={() => setInputFocus(true)}
								onBlur={() => setInputFocus(false)}
								placeholder={'Select a channel or category...'}
								placeholderTextColor={themeValue.textDisabled}
							/>
						)}
						{channelSelected ? (
							<TouchableOpacity
								activeOpacity={0.8}
								onPress={() => {
									setChannelSelected(undefined);
									inputSearchRef?.current?.focus?.();
								}}
								style={styles.iconRightInput}
							>
								<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} color={themeValue.text} />
							</TouchableOpacity>
						) : (
							!!searchText?.length && (
								<TouchableOpacity
									activeOpacity={0.8}
									onPress={() => {
										setSearchText('');
										inputSearchRef?.current?.clear?.();
										debouncedSearch('');
									}}
									style={styles.iconRightInput}
								>
									<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} color={themeValue.text} />
								</TouchableOpacity>
							)
						)}
					</View>
				</View>

				<View style={styles.container}>
					{!!dataShareTo?.length && (
						<View>
							<Text style={styles.title}>Suggestions</Text>
							<FlatList
								data={dataShareTo}
								keyExtractor={(item, index) => `${item?.id}_${index}_suggestion`}
								renderItem={renderItemSuggest}
								keyboardShouldPersistTaps={'handled'}
								onEndReachedThreshold={0.1}
								initialNumToRender={1}
								maxToRenderPerBatch={5}
								windowSize={15}
								updateCellsBatchingPeriod={10}
								decelerationRate={'fast'}
								disableVirtualization={true}
								removeClippedSubviews={true}
								getItemLayout={(_, index) => ({
									length: size.s_42,
									offset: size.s_42 * index,
									index
								})}
							/>
						</View>
					)}
				</View>
				<View style={styles.chatArea}>
					{!!getAttachmentUnique(attachmentUpload)?.length && (
						<View style={[styles.attachmentRow]}>
							<ScrollView horizontal keyboardShouldPersistTaps={'always'}>
								{getAttachmentUnique(attachmentUpload)?.map((media: any, index) => {
									const isFile =
										Platform.OS === 'android'
											? !isImage(media?.filename?.toLowerCase()) && !isVideo(media?.filename?.toLowerCase())
											: !isImage(media?.url?.toLowerCase()) && !isVideo(media?.url?.toLowerCase());
									const isUploaded = media?.url?.includes('http');

									return (
										<View
											key={`${media?.url}_${index}_media_sharing`}
											style={[styles.wrapperItemMedia, isFile && { height: size.s_60, width: size.s_50 * 3 }]}
										>
											{isVideo(media?.filename?.toLowerCase()) && isVideo(media?.url?.toLowerCase()) && (
												<View style={styles.videoOverlay}>
													<PlayIcon width={size.s_20} height={size.s_20} />
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
											{isUploaded && (
												<TouchableOpacity
													style={styles.iconRemoveMedia}
													onPress={() => removeAttachmentByUrl(media.url ?? '')}
												>
													<MezonIconCDN icon={IconCDN.closeIcon} width={size.s_18} height={size.s_18} />
												</TouchableOpacity>
											)}

											{!isUploaded && (
												<View style={styles.videoOverlay}>
													<ActivityIndicator size={'small'} color={'white'} />
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
								placeholder={'Add a Comment (Optional)'}
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
								<Flow size={size.s_28} color={Colors.white} />
							) : (
								<SendIcon width={size.s_28} height={size.s_20} color={Colors.white} />
							)}
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
};
