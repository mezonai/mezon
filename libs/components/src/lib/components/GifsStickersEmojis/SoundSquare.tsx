/* eslint-disable react-hooks/exhaustive-deps */
import { useChatSending, useCurrentInbox, useEscapeKeyClose, useGifsStickersEmoji } from '@mezon/core';
import { referencesActions, selectCurrentClan, selectDataReferences, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IMessageSendPayload, SubPanelName, blankReferenceObj } from '@mezon/utils';
import { ApiChannelDescription, ApiMessageAttachment, ApiMessageMention, ApiMessageRef } from 'mezon-js/api.gen';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageAudio } from '../MessageWithUser/MessageAudio/MessageAudio';

type ChannelMessageBoxProps = {
	channel: ApiChannelDescription | undefined;
	mode: number;
	onClose: () => void;
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

const sounds = [
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '1',
		filename: 'fail-sound-effect.mp3',
		size: 64503,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/fail-sound-effect.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '2',
		filename: 'huh_.mp3',
		size: 130430,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/huh_.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '3',
		filename: 'dun-dun-dun-sound-effect-brass_8nFBc.mp3',
		size: 101189,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/dun-dun-dun-sound-effect-brass_8nFBccR.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '4',
		filename: 'oh-my-god-meme.mp3',
		size: 303744,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/oh-my-god-meme.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '5',
		filename: 'nani-meme-sound-effect.mp3',
		size: 49780,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/nani-meme-sound-effect.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '6',
		filename: 'bruh.mp3',
		size: 284194,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/bruh.mp3`,
		filetype: 'audio/mpeg'
	},
	// SYSTEM SOUNDS

	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '7',
		filename: 'shocked-sound-effect.mp3',
		size: 343658,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/shocked-sound-effect.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '8',
		filename: 'anime-wow-sound-effect-mp3cut.mp3',
		size: 326558,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/anime-wow-sound-effect-mp3cut.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '9',
		filename: 'directed-by-robert-b.mp3',
		size: 107519,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/directed-by-robert-b.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '10',
		filename: 'punch-gaming-sound.mp3',
		size: 107519,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/punch-gaming-sound.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '11',
		filename: 'vine-boom-sound.mp3',
		size: 340902,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/vine-boom-sound.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '12',
		filename: 'run.mp3',
		size: 93308,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/run.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '13',
		filename: 'among-us-role-reveal-sound.mp3',
		size: 112695,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/among-us-role-reveal-sound.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '14',
		filename: 'meme_fail.mp3',
		size: 151822,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/meme_fail.mp3`,
		filetype: 'audio/mpeg'
	},

	// komu -3
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '15',
		filename: 'error_sound.mp3',
		size: 304211,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/error_sound.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '16',
		filename: 'emotional_damage_meme.mp3',
		size: 151822,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/emotional_damage_meme.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '17',
		filename: 'are_you_crazy.mp3',
		size: 132363,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/are_you_crazy.mp3`,
		filetype: 'audio/mpeg'
	},
	{
		clan_name: 'SYSTEM SOUNDS',
		logo: 'https://fastly.picsum.photos/id/391/536/354.jpg?hmac=29BA6wFw5oDS6512JTZGg8jXcA_-hnW9154Cqs9OZqw',
		clan_id: '1775731152322039809',
		id: '18',
		filename: 'sad_violin.mp3',
		size: 361889,
		url: `https://${process.env.NX_BASE_IMG_URL}/soundboard/meme/sad_violin.mp3`,
		filetype: 'audio/mpeg'
	}
];

function SoundSquare({ channel, mode, onClose }: ChannelMessageBoxProps) {
	const dispatch = useDispatch();
	const { sendMessage } = useChatSending({ channelOrDirect: channel, mode });
	const currentId = useCurrentInbox()?.channel_id;
	const dataReferences = useSelector(selectDataReferences(currentId ?? ''));
	const isReplyAction = dataReferences.message_ref_id && dataReferences.message_ref_id !== '';
	const { valueInputToCheckHandleSearch, subPanelActive, setSubPanelActive } = useGifsStickersEmoji();
	const [searchedSounds, setSearchSounds] = useState<ExtendedApiMessageAttachment[]>([]);

	useEffect(() => {
		const result = searchSounds(sounds, valueInputToCheckHandleSearch ?? '');
		setSearchSounds(result);
	}, [valueInputToCheckHandleSearch, subPanelActive, sounds]);

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
		return sounds
			.map((sound) => ({
				id: sound.clan_id,
				type: sound.clan_name,
				url: sound.logo
			}))
			.filter((sound, index, self) => index === self.findIndex((s) => s.id === sound.id));
	}, [sounds]);

	const [selectedType, setSelectedType] = useState('');
	const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
	const containerRef = useRef<HTMLDivElement>(null);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	const onClickSendSound = useCallback(
		(sound: ExtendedApiMessageAttachment) => {
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
		[isReplyAction, handleSend, dispatch, currentId, dataReferences, blankReferenceObj, setSubPanelActive]
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
		<div ref={modalRef} tabIndex={-1} className="outline-none flex h-full w-full md:w-[500px] max-sm:ml-1">
			<div className="overflow-y-auto overflow-x-hidden hide-scrollbar h-[25rem] rounded md:ml-2 ">
				<div className="w-11 flex flex-col gap-y-1 dark:bg-[#1E1F22] bg-bgLightModeSecond pt-1 px-1 md:items-start pb-1 rounded items-center min-h-[25rem]">
					{categoryLogo.map((cat) => (
						<button
							title={cat.type}
							key={cat.id}
							onClick={(e) => scrollToClanSidebar(e, cat.type)}
							className="flex justify-center items-center w-9 h-9 rounded-lg hover:bg-[#41434A]"
						>
							{cat.type === 'SYSTEM SOUNDS' ? (
								<div className="w-7 h-7 rounded-full dark:bg-bgLightModeSecond flex justify-center items-center">
									<Icons.SoundIcon className="w-5 h-5" />
								</div>
							) : cat.url !== '' ? (
								<img
									src={cat.url}
									alt={cat.type}
									className="w-7 h-7 object-cover aspect-square cursor-pointer border border-bgHoverMember rounded-full"
								/>
							) : (
								<div className="dark:text-textDarkTheme text-textLightTheme">{cat?.type?.charAt(0).toUpperCase()}</div>
							)}
						</button>
					))}
				</div>
			</div>
			<div className="flex flex-col h-[400px] overflow-y-auto flex-1 hide-scrollbar" ref={containerRef}>
				{valueInputToCheckHandleSearch ? (
					<SoundPanel soundList={searchedSounds} onClickSendSound={onClickSendSound} />
				) : (
					<>
						{categoryLogo.map((avt) => (
							<div ref={(el) => (categoryRefs.current[avt.type || ''] = el)} key={avt.id}>
								<CategorizedSounds
									valueInputToCheckHandleSearch={valueInputToCheckHandleSearch}
									soundList={sounds}
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
		const currentClan = useAppSelector(selectCurrentClan);

		const handleToggleButton = useCallback(() => {
			setIsShowSoundList((prev) => !prev);
		}, []);

		return (
			<div>
				<button
					onClick={handleToggleButton}
					className="w-full flex flex-row justify-start items-center pl-1 mb-1 mt-0 py-1 gap-[2px] sticky top-[-0.5rem] dark:bg-[#2B2D31] bg-bgLightModeSecond z-10 dark:text-white text-black max-h-full"
				>
					<p className="uppercase">{categoryName !== 'custom' ? categoryName : currentClan?.clan_name}</p>
					<span className={`${isShowSoundList ? ' rotate-90' : ''}`}>
						<Icons.ArrowRight />
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
		<div className="w-auto pb-2 px-2">
			<div className="grid grid-cols-2 gap-4">
				{soundList.map((sound, index) => (
					<div
						key={sound.id}
						className="relative flex flex-col justify-between items-start border border-gray-600 rounded-md w-full h-[7rem]"
					>
						<MessageAudio audioUrl={sound.url || ''} posInPopUp={true} />
						<div className="flex justify-center w-full mt-1" onClick={() => onClickSendSound(sound)} title="Send the sound">
							<Icons.SoundIcon className="w-10 h-10 text-[#2B2D31] dark:text-bgLightModeSecond dark:bg-bgLightModeSecond rounded-md" />
						</div>

						<span title={sound.filename} className="text-xs mx-1 w-full truncate cursor-text">
							{sound.filename}
						</span>
					</div>
				))}
			</div>
		</div>
	);
});
