/* eslint-disable react-hooks/exhaustive-deps */
import { useChatSending, useCurrentInbox, useEscapeKeyClose, useGifsStickersEmoji } from '@mezon/core';
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
import type { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ChannelMessageBoxProps = {
	channel: ApiChannelDescription | undefined;
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
	clan_id?: string;
	create_time?: string;
	creator_id?: string;
	id?: string;
	shortname?: string;
	source?: string;
	logo?: string;
	clan_name?: string;
}

const searchSounds = (sounds: ExtendedApiMessageAttachment[], searchTerm: string) => {
	if (!searchTerm) return sounds;
	const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
	return sounds.filter((item) => item?.filename?.toLowerCase().includes(lowerCaseSearchTerm));
};

function SoundSquare({ channel, mode, onClose, isTopic = false, onSoundSelect }: ChannelMessageBoxProps) {
	const dispatch = useAppDispatch();
	const { sendMessage } = useChatSending({
		channelOrDirect: channel,
		mode,
		fromTopic: isTopic
	});
	const currentId = useCurrentInbox()?.channel_id;
	const dataReferences = useAppSelector((state) => selectDataReferences(state, currentId ?? ''));
	const isReplyAction = dataReferences.message_ref_id && dataReferences.message_ref_id !== '';
	const { valueInputToCheckHandleSearch, subPanelActive, setSubPanelActive } = useGifsStickersEmoji();

	const currentClanId = useAppSelector(selectCurrentClanId) || '';

	const allStickersInStore = useAppSelector(selectAllStickerSuggestion);
	const allSoundsInStore = useMemo(
		() => allStickersInStore.filter((sticker) => (sticker as any).media_type === MediaType.AUDIO),
		[allStickersInStore]
	);

	useEffect(() => {
		dispatch(soundEffectActions.fetchSoundByUserId({ noCache: false, clanId: currentClanId }));
	}, [dispatch]);

	const userSounds = useMemo(() => {
		return allSoundsInStore.map((sound) => ({
			clan_name: sound.clan_name || 'MY SOUNDS',
			logo: sound.logo || '',
			clan_id: sound.clan_id || '',
			id: sound.id || '',
			filename: sound.shortname || 'sound.mp3',
			size: 100000,
			url: sound.source || '',
			filetype: 'audio/mpeg'
		}));
	}, [allSoundsInStore]);

	const allSounds = useMemo(() => {
		return [...userSounds];
	}, [userSounds]);

	const [searchedSounds, setSearchSounds] = useState<ExtendedApiMessageAttachment[]>([]);

	useEffect(() => {
		const result = searchSounds(allSounds, valueInputToCheckHandleSearch ?? '');
		setSearchSounds(result);
	}, [valueInputToCheckHandleSearch, subPanelActive, allSounds]);

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
		return allSounds
			.map((sound) => ({
				id: sound.clan_id,
				type: sound.clan_name,
				url: sound.logo
			}))
			.filter((sound, index, self) => index === self.findIndex((s) => s.id === sound.id));
	}, [allSounds]);

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
			const container = containerRef.current;
			if (!categoryDiv || !container) return;
			const containerTop = container.getBoundingClientRect().top;
			const categoryTop = categoryDiv.getBoundingClientRect().top;
			const offset = 0;
			const scrollTop = categoryTop - containerTop - offset;

			container.scrollTop += scrollTop;
		},
		[selectedType]
	);

	return (
		<div ref={modalRef} tabIndex={-1} className="outline-none flex h-full w-full md:w-[500px] max-sm:ml-1 pt-3">
			<div className="overflow-y-auto overflow-x-hidden hide-scrollbar h-[25rem]  md:ml-2">
				<div className="w-16 flex flex-col gap-y-2 bg-theme-setting-nav pt-3 px-1.5 md:items-start pb-3  items-center min-h-[25rem] shadow-sm rounded-l-lg">
					{categoryLogo.map((cat) => (
						<button
							title={cat.type}
							key={cat.id}
							onClick={(e) => scrollToClanSidebar(e, cat.type)}
							className={`flex justify-center items-center w-11 h-11 rounded-full bg-item-hover transition-all duration-200 ${
								selectedType === cat.type ? 'bg-[#5865f2] dark:shadow-md' : 'bg-item-theme'
							}`}
						>
							{cat.url !== '' ? (
								<img
									src={cat.url}
									alt={cat.type}
									className={`w-8 h-8 object-cover aspect-square cursor-pointer rounded-full ${
										selectedType === cat.type ? 'border-2 border-white' : ''
									}`}
								/>
							) : (
								<div className={`${selectedType === cat.type ? 'text-white' : ' text-[#2e3338]'} font-semibold text-sm`}>
									{cat?.type?.charAt(0).toUpperCase()}
								</div>
							)}
						</button>
					))}
				</div>
			</div>
			<div className="flex flex-col h-[400px] overflow-y-auto flex-1 hide-scrollbar bg-theme-setting-primary rounded-r-lg" ref={containerRef}>
				{valueInputToCheckHandleSearch ? (
					<SoundPanel soundList={searchedSounds} onClickSendSound={onClickSendSound} />
				) : (
					<>
						{categoryLogo.map((avt) => (
							<div ref={(el) => (categoryRefs.current[avt.type || ''] = el)} key={avt.id}>
								<CategorizedSounds
									valueInputToCheckHandleSearch={valueInputToCheckHandleSearch}
									soundList={allSounds}
									onClickSendSound={onClickSendSound}
									categoryName={avt.type || ''}
									key={avt.id}
								/>
							</div>
						))}
					</>
				)}
			</div>
		</div>
	);
}
export default SoundSquare;

interface ExtendedApiMessageAttachment extends ApiMessageAttachment, ClanSound {}

interface ICategorizedSoundProps {
	soundList: ExtendedApiMessageAttachment[];
	categoryName: string;
	onClickSendSound: (sound: ExtendedApiMessageAttachment) => void;
	valueInputToCheckHandleSearch?: string;
}

const CategorizedSounds: React.FC<ICategorizedSoundProps> = React.memo(
	({ soundList, categoryName, onClickSendSound, valueInputToCheckHandleSearch }) => {
		const soundListByCategoryName = useMemo(() => soundList.filter((sound) => sound.clan_name === categoryName), [soundList, categoryName]);
		const [isShowSoundList, setIsShowSoundList] = useState(true);
		const currentClanName = useAppSelector(selectCurrentClanName);

		const handleToggleButton = useCallback(() => {
			setIsShowSoundList((prev) => !prev);
		}, []);

		return (
			<div className="mb-3">
				<button
					onClick={handleToggleButton}
					className=" w-full flex flex-row justify-between items-center px-4 py-2 gap-[2px] sticky top-[-0.5rem]  bg-theme-setting-nav max-h-full z-10"
				>
					<p className="uppercase font-semibold text-xs tracking-wider text-theme-primary-active">
						{categoryName !== 'custom' ? categoryName : currentClanName}
					</p>
					<span className={`transition-transform duration-200 text-theme-primary ${isShowSoundList ? 'rotate-90' : ''}`}>
						<Icons.ArrowRight defaultFill="currentColor" className="w-3.5 h-3.5 opacity-70 " />
					</span>
				</button>
				{isShowSoundList && <SoundPanel soundList={soundListByCategoryName} onClickSendSound={onClickSendSound} />}
			</div>
		);
	}
);
interface ISoundPanelProps {
	soundList: ExtendedApiMessageAttachment[];
	onClickSendSound: (sound: ExtendedApiMessageAttachment) => void;
}

export const SoundPanel: React.FC<ISoundPanelProps> = React.memo(({ soundList, onClickSendSound }) => {
	return (
		<div className="w-full pb-3 px-3 pt-1 bg-theme-setting-primary">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{soundList.length === 0 && (
					<div className="col-span-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-color-primary rounded-lg  text-center">
						<Icons.Speaker className="w-10 h-10  mb-2" />
						<p className="t text-sm">No sound effects found.</p>
					</div>
				)}
				{soundList.map((sound) => (
					<div
						key={sound.id}
						className="flex flex-col w-full p-2 rounded-lg  shadow-sm hover:shadow-md transition duration-200 border-theme-primary items-center"
					>
						<div className="flex items-center justify-between mb-3">
							<p
								title={sound.filename}
								className="font-medium truncate w-full text-center  text-ellipsis whitespace-nowrap overflow-hidden max-w-20 px-2 rounded py-1 bg-item-hover transition-colors cursor-pointer text-theme-primary-active"
							>
								{sound.filename}
							</p>
						</div>
						<audio controls src={sound.url} className="w-full h-8 rounded-full border-theme-primary mb-2" />
						<button
							onClick={() => onClickSendSound(sound)}
							title="Send sound"
							className="flex items-center gap-2 px-4 py-1.5 btn-primary btn-primary-hover rounded-full  transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 mt-2"
						>
							<Icons.ArrowRight defaultFill="white" className="w-4 h-4" />
						</button>
					</div>
				))}
			</div>
		</div>
	);
});
