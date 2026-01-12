/* eslint-disable react-hooks/exhaustive-deps */
import { useChatSending, useCurrentInbox, useEscapeKeyClose, useGifsStickersEmoji } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import {
	MediaType,
	referencesActions,
	selectAllStickerSuggestion,
	selectCurrentClanId,
	selectCurrentClanName,
	selectDataReferences,
	soundEffectActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IMessageSendPayload } from '@mezon/utils';
import { SubPanelName, blankReferenceObj } from '@mezon/utils';
import type { ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ChannelMessageBoxProps = {
	mode: number;
	onClose: () => void;
	isTopic?: boolean;
	onSoundSelect?: (soundId: string, soundUrl: string) => void;
};

type SoundPanel = {
	type?: string;
	url?: string;
	id?: string;
};

export interface ClanSound {
	category?: string;
	clanId?: string;
	createTime?: string;
	creatorId?: string;
	id?: string;
	shortname?: string;
	source?: string;
	logo?: string;
	clanName?: string;
}

const searchSounds = (sounds: ExtendedApiMessageAttachment[], searchTerm: string) => {
	if (!searchTerm) return sounds;
	const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
	return sounds.filter((item) => item?.filename?.toLowerCase().includes(lowerCaseSearchTerm));
};

function SoundSquare({ mode, onClose, isTopic = false, onSoundSelect }: ChannelMessageBoxProps) {
	const dispatch = useAppDispatch();
	const channelOrDirect = useCurrentInbox() as ChannelsEntity;
	const { sendMessage } = useChatSending({
		channelOrDirect,
		mode,
		fromTopic: isTopic
	});
	const currentId = useCurrentInbox()?.channelId;
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentId ?? ''));
	const isReplyAction = dataReferences.message_ref_id && dataReferences.message_ref_id !== '';
	const { valueInputToCheckHandleSearch, subPanelActive, setSubPanelActive } = useGifsStickersEmoji();

	const currentClanId = useAppSelector(selectCurrentClanId) || '';

	const allStickersInStore = useAppSelector(selectAllStickerSuggestion);
	const allSoundsInStore = useMemo(
		() => allStickersInStore.filter((sticker) => (sticker as any).mediaType === MediaType.AUDIO),
		[allStickersInStore]
	);

	useEffect(() => {
		dispatch(soundEffectActions.fetchSoundByUserId({ noCache: false, clanId: currentClanId }));
	}, [dispatch]);

	const userSounds = useMemo(() => {
		return allSoundsInStore.map((sound) => ({
			clanName: sound.clanName || 'MY SOUNDS',
			logo: sound.logo || '',
			clanId: sound.clanId || '',
			id: sound.id || '',
			filename: sound.shortname || 'sound.mp3',
			size: 100000,
			url: sound.source || '',
			filetype: 'audio/mpeg'
		}));
	}, [allSoundsInStore]);

	const [searchedSounds, setSearchSounds] = useState<ExtendedApiMessageAttachment[]>([]);

	useEffect(() => {
		const result = searchSounds(userSounds, valueInputToCheckHandleSearch ?? '');
		setSearchSounds(result);
	}, [valueInputToCheckHandleSearch, subPanelActive, userSounds]);

	const handleSend = useCallback(
		(
			content: IMessageSendPayload,
			mentions?: Array<ApiMessageMention>,
			attachments?: Array<ApiMessageAttachment>,
			references?: Array<ApiMessageRef>
		) => {
			sendMessage(content, mentions, attachments, references);
		},
		[sendMessage]
	);

	// get list clan logo to show on leftside
	const categoryLogo = useMemo(() => {
		return userSounds
			.map((sound) => ({
				id: sound.clanId,
				type: sound.clanName,
				url: sound.logo
			}))
			.filter((sound, index, self) => index === self.findIndex((s) => s.id === sound.id));
	}, [userSounds]);

	const [selectedType, setSelectedType] = useState('');
	const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const containerRef = useRef<HTMLDivElement>(null);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	const onClickSendSound = useCallback(
		(sound: ExtendedApiMessageAttachment) => {
			if (onSoundSelect) {
				onSoundSelect(sound.id || '', sound.url || '');
				onClose();
				return;
			}

			if (isReplyAction) {
				handleSend({ t: '' }, [], [sound], [dataReferences]);
				dispatch(
					referencesActions.setDataReferences({
						channelId: currentId as string,
						dataReferences: blankReferenceObj as ApiMessageRef
					})
				);
			} else {
				handleSend({ t: '' }, [], [sound], []);
			}
			setSubPanelActive(SubPanelName.NONE);
		},
		[onSoundSelect, onClose, isReplyAction, handleSend, dispatch, currentId, dataReferences, blankReferenceObj, setSubPanelActive]
	);

	const scrollToClanSidebar = useCallback(
		(event: React.MouseEvent, clanName: string) => {
			event.stopPropagation();

			if (clanName === selectedType) return;
			setSelectedType(clanName);
			const categoryDiv = categoryRefs.current[clanName];
			if (!categoryDiv) return;

			categoryDiv.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		},
		[selectedType]
	);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="outline-none flex h-[430px] w-full md:w-[500px] max-h-[430px] bg-theme-setting-primary overflow-hidden rounded-lg shadow-xl"
		>
			<div className="flex flex-col gap-y-4 bg-theme-setting-nav py-4 items-center w-11 flex-shrink-0 overflow-y-auto hide-scrollbar rounded-tl-lg rounded-tr-lg bg-item-theme ">
				{categoryLogo.map((cat) => (
					<button
						title={cat.type}
						key={cat.id}
						onClick={(e) => scrollToClanSidebar(e, cat.type)}
						className={`group relative flex justify-center items-center w-7 h-7 transition-all duration-300 ${
							selectedType === cat.type
								? 'bg-[#5865f2] rounded-[16px] shadow-md text-white scale-125'
								: 'bg-item-theme rounded-[24px] hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white'
						}`}
					>
						{cat.url !== '' ? (
							<img src={cat.url} alt={cat.type} className="w-full h-full object-cover rounded-[inherit] transition-all duration-300" />
						) : (
							<div
								className={`font-bold text-sm transition-colors duration-200 ${selectedType === cat.type ? 'text-white' : 'text-theme-primary opacity-70 group-hover:text-white group-hover:opacity-100'}`}
							>
								{cat?.type?.charAt(0).toUpperCase()}
							</div>
						)}
					</button>
				))}
			</div>

			<div className="flex flex-col flex-1 min-w-0 bg-theme-setting-primary overflow-hidden relative" ref={containerRef}>
				<div className="flex-1 overflow-y-auto hide-scrollbar pb-4 px-4 ">
					{valueInputToCheckHandleSearch ? (
						<SoundPanel soundList={searchedSounds} onClickSendSound={onClickSendSound} />
					) : (
						<div className="flex flex-col gap-4">
							{categoryLogo.map((avt) => (
								<div
									ref={(el) => {
										categoryRefs.current[avt.type || ''] = el;
									}}
									key={avt.id}
									className="scroll-mt-4"
								>
									<CategorizedSounds
										valueInputToCheckHandleSearch={valueInputToCheckHandleSearch}
										soundList={userSounds}
										onClickSendSound={onClickSendSound}
										categoryName={avt.type || ''}
										key={avt.id}
									/>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
export default SoundSquare;

interface ExtendedApiMessageAttachment extends ApiMessageAttachment, ClanSound {
	filename?: string;
	url?: string;
}

interface ICategorizedSoundProps {
	soundList: ExtendedApiMessageAttachment[];
	categoryName: string;
	onClickSendSound: (sound: ExtendedApiMessageAttachment) => void;
	valueInputToCheckHandleSearch?: string;
}

const CategorizedSounds: React.FC<ICategorizedSoundProps> = React.memo(
	({ soundList, categoryName, onClickSendSound, valueInputToCheckHandleSearch }) => {
		const soundListByCategoryName = useMemo(() => soundList.filter((sound) => sound.clanName === categoryName), [soundList, categoryName]);
		const [isShowSoundList, setIsShowSoundList] = useState(true);
		const currentClanName = useAppSelector(selectCurrentClanName);
		const categoryLogo = useMemo(() => soundListByCategoryName[0]?.logo || '', [soundListByCategoryName]);

		const handleToggleButton = useCallback(() => {
			setIsShowSoundList((prev) => !prev);
		}, []);

		return (
			<div className="flex flex-col gap-2">
				<button onClick={handleToggleButton} className="flex flex-row items-center gap-2 w-full text-left group sticky top-0  z-10 py-1  ">
					{categoryLogo ? (
						<img src={categoryLogo} alt={categoryName} className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
					) : (
						<div className="w-4 h-4 rounded-full bg-theme-primary/20 flex items-center justify-center flex-shrink-0">
							<span className="text-[8px] font-bold text-theme-primary/60">{categoryName.charAt(0).toUpperCase()}</span>
						</div>
					)}
					<p className="uppercase font-bold text-xs tracking-wide text-theme-primary/60 group-hover:text-theme-primary transition-colors truncate overflow-hidden max-w-[300px]">
						{categoryName !== 'custom' ? categoryName : currentClanName}
					</p>
					<span
						className={`transition-transform duration-200 text-theme-primary/60 group-hover:text-theme-primary ${isShowSoundList ? 'rotate-90' : ''}`}
					>
						<Icons.ArrowRight defaultFill="currentColor" className="w-3 h-3" />
					</span>
					<div className="h-[1px] flex-1 bg-theme-primary/10 group-hover:bg-theme-primary/20 transition-colors ml-2"></div>
				</button>

				{isShowSoundList && (
					<div className="animate-fade-in">
						<SoundPanel soundList={soundListByCategoryName} onClickSendSound={onClickSendSound} />
					</div>
				)}
			</div>
		);
	}
);

interface ISoundPanelProps {
	soundList: ExtendedApiMessageAttachment[];
	onClickSendSound: (sound: ExtendedApiMessageAttachment) => void;
}

export const SoundPanel: React.FC<ISoundPanelProps> = React.memo(({ soundList, onClickSendSound }) => {
	const [playingPreview, setPlayingPreview] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const handlePreview = useCallback(
		(e: React.MouseEvent, sound: ExtendedApiMessageAttachment) => {
			e.stopPropagation();
			if (!sound.url) return;

			if (playingPreview === sound.id && audioRef.current) {
				if (audioRef.current.paused) {
					audioRef.current.play().catch(console.error);
				} else {
					audioRef.current.pause();
					setPlayingPreview(null);
				}
				return;
			}

			if (audioRef.current) {
				audioRef.current.pause();
			}

			const audio = new Audio(sound.url);
			audio.onended = () => setPlayingPreview(null);
			audio.play().catch(console.error);
			audioRef.current = audio;
			setPlayingPreview(sound.id || null);
		},
		[playingPreview]
	);

	useEffect(() => {
		return () => {
			if (audioRef.current) audioRef.current.pause();
		};
	}, []);

	return (
		<div className="grid grid-cols-2 gap-3">
			{soundList.length === 0 && (
				<div className="col-span-full flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed border-theme-primary/10 rounded-lg">
					<Icons.Speaker className="w-8 h-8 mb-2 text-theme-primary" />
					<p className="text-xs text-theme-primary font-medium">No sounds available</p>
				</div>
			)}
			{soundList.map((sound) => (
				<div
					key={sound.id}
					className="group relative flex items-center gap-3 p-2 h-10 rounded-lg bg-item-theme hover:bg-[#5865f2]/10 transition-all duration-200 hover:shadow-md border border-transparent hover:border-[#5865f2]/30"
					title={sound.filename}
				>
					<button
						onClick={(e) => handlePreview(e, sound)}
						className={`flex-shrink-0 flex text-theme-primary items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${playingPreview === sound.id ? 'text-green-500 bg-green-500/10' : 'text-theme-primary/60 hover:text-theme-primary hover:bg-theme-primary/10'}`}
						title="Preview sound"
					>
						{playingPreview === sound.id ? (
							<svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
								<rect x="6" y="4" width="4" height="16" rx="1" />
								<rect x="14" y="4" width="4" height="16" rx="1" />
							</svg>
						) : (
							<Icons.Speaker className="w-4 h-4" />
						)}
					</button>
					<span className="flex-1 text-xs font-bold text-theme-primary truncate select-none">{sound.filename}</span>
					<button
						onClick={() => onClickSendSound(sound)}
						className="flex-shrink-0 flex items-center justify-center text-theme-primary duration-200  hover:scale-110 active:scale-95"
						title="Send sound"
					>
						<Icons.ResendMessageRightClick defaultSize="h-5 w-5" />
					</button>
				</div>
			))}
		</div>
	);
});
