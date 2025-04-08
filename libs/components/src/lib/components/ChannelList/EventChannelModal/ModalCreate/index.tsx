/* eslint-disable react-hooks/exhaustive-deps */
import { useEventManagement } from '@mezon/core';
import {
	eventManagementActions,
	selectAllTextChannel,
	selectChannelById,
	selectCreatingLoaded,
	selectCurrentClanId,
	selectEventById,
	selectVoiceChannelAll,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ContenSubmitEventProps, ERepeatType, OptionEvent, Tabs_Option } from '@mezon/utils';
import isEqual from 'lodash.isequal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
	convertToLongUTCFormat,
	formatTimeStringToHourFormat,
	formatToLocalDateString,
	getCurrentTimeRounded,
	handleTimeISO
} from '../timeFomatEvent';
import EventInfoModal from './eventInfoModal';
import HeaderEventCreate from './headerEventCreate';
import LocationModal from './locationModal';
import ReviewModal from './reviewModal';

export type ModalCreateProps = {
	onClose: () => void;
	onCloseEventModal: () => void;
	clearEventId: () => void;
	eventId?: string;
};

enum EventTabIndex {
	LOCATION = 0,
	EVENTINFO = 1,
	REVIEW = 2
}

const ModalCreate = (props: ModalCreateProps) => {
	const { onClose, onCloseEventModal, eventId, clearEventId } = props;
	const currentClanId = useSelector(selectCurrentClanId);
	const voicesChannel = useSelector(selectVoiceChannelAll);
	const textChannels = useSelector(selectAllTextChannel);

	const tabs = ['Location', 'Event Info', 'Review'];
	const [currentModal, setCurrentModal] = useState(0);
	const currentEvent = useAppSelector((state) => selectEventById(state, currentClanId ?? '', eventId ?? ''));
	// detach event type
	const isEditEventAction = Boolean(currentEvent);
	const isClanEvent = currentEvent?.channel_id === undefined;
	const isChannelEvent = Boolean(currentEvent?.channel_id && currentEvent?.channel_id !== '0');
	const isPrivateEvent = currentEvent?.is_private;
	const eventChannel = useAppSelector((state) => selectChannelById(state, currentEvent ? currentEvent.channel_id || '' : '')) || {};

	const createStatus = useSelector(selectCreatingLoaded);
	const dispatch = useAppDispatch();

	const [contentSubmit, setContentSubmit] = useState<ContenSubmitEventProps>({
		topic: currentEvent ? currentEvent.title || '' : '',
		address: currentEvent ? currentEvent?.address || '' : '',
		timeStart: currentEvent ? currentEvent.start_time || '00:00' : '00:00',
		timeEnd: currentEvent ? currentEvent.end_time || '00:00' : '00:00',
		selectedDateStart: currentEvent ? new Date(formatToLocalDateString(currentEvent.start_time || '')) : new Date(),
		selectedDateEnd: currentEvent ? new Date(formatToLocalDateString(currentEvent.end_time || '')) : new Date(),
		voiceChannel: currentEvent ? currentEvent?.channel_voice_id || '' : '',
		logo: currentEvent ? currentEvent.logo || '' : '',
		description: currentEvent ? currentEvent.description || '' : '',
		textChannelId: currentEvent ? currentEvent.channel_id || '' : '',
		repeatType: currentEvent ? currentEvent.repeat_type || ERepeatType.DOES_NOT_REPEAT : ERepeatType.DOES_NOT_REPEAT,
		isPrivate: Boolean(currentEvent?.is_private)
	});
	const [buttonWork, setButtonWork] = useState(true);
	const [errorOption, setErrorOption] = useState(false);
	const [errorTime, setErrorTime] = useState(false);

	const { createEventManagement } = useEventManagement();

	const [option, setOption] = useState<string>('');

	const isExistChannelVoice = Boolean(currentEvent?.channel_voice_id);
	const isExistAddress = Boolean(currentEvent?.address);
	const isExistPrivateEvent = currentEvent?.is_private;

	useEffect(() => {
		if (currentEvent && eventChannel) {
			if (isExistChannelVoice) {
				setOption(OptionEvent.OPTION_SPEAKER);
			} else if (isExistAddress) {
				setOption(OptionEvent.OPTION_LOCATION);
			} else if (isExistPrivateEvent) {
				setOption(OptionEvent.PRIVATE_EVENT);
			}
		}
	}, [currentEvent, eventChannel]);

	const choiceSpeaker = useMemo(() => {
		return option === OptionEvent.OPTION_SPEAKER || (!option && isExistChannelVoice && !isExistAddress && !isExistPrivateEvent);
	}, [isExistChannelVoice, isExistAddress, isExistPrivateEvent, option]);

	const choiceLocation = useMemo(() => {
		return option === OptionEvent.OPTION_LOCATION || (!option && isExistAddress && !isExistChannelVoice && !isExistPrivateEvent);
	}, [isExistChannelVoice, isExistAddress, isExistPrivateEvent, option]);

	const choicePrivateEvent = useMemo(() => {
		return option === OptionEvent.PRIVATE_EVENT || (!option && isExistPrivateEvent && !isExistChannelVoice && !isExistAddress);
	}, [isExistChannelVoice, isExistAddress, isExistPrivateEvent, option]);

	const handleNext = (currentModal: number) => {
		if (buttonWork && currentModal < tabs.length - 1 && !errorTime && !errorOption) {
			setCurrentModal(currentModal + 1);
		}
	};

	const handleBack = (currentModal: number) => {
		setCurrentModal(currentModal - 1);
	};

	const handleOption = (option: string) => {
		setOption(option);
	};

	const handleCurrentModal = (number: number) => {
		if (errorOption || errorTime) {
			return;
		}

		if (!option) {
			return;
		}

		if (currentModal === EventTabIndex.LOCATION && number === EventTabIndex.REVIEW && !contentSubmit.topic) {
			return;
		}

		if (buttonWork || number < 1) {
			setCurrentModal(number);
		}
	};

	const handleSubmit = useCallback(async () => {
		const voice = choiceSpeaker ? contentSubmit.voiceChannel : '';
		const address = choiceLocation ? contentSubmit.address : '';
		const privateEvent = choicePrivateEvent ? contentSubmit.isPrivate : false;

		const timeValueStart = handleTimeISO(contentSubmit.selectedDateStart, contentSubmit.timeStart);
		const timeValueEnd = handleTimeISO(contentSubmit.selectedDateEnd, contentSubmit.timeEnd);

		await createEventManagement(
			currentClanId || '',
			voice,
			address as string,
			contentSubmit.topic,
			timeValueStart,
			timeValueEnd,
			contentSubmit.description,
			contentSubmit.logo,
			contentSubmit.textChannelId as string,
			contentSubmit.repeatType as ERepeatType,
			privateEvent as boolean
		);

		hanldeCloseModal();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [choiceSpeaker, contentSubmit, choiceLocation, currentClanId, createEventManagement]);

	const isEventChanged = useMemo(() => {
		if (!currentEvent || !contentSubmit) return false;

		const formattedCurrentEvent = {
			topic: currentEvent.title,
			address: currentEvent.address ?? '',
			voiceChannel: currentEvent.channel_voice_id ?? '',
			logo: currentEvent.logo ?? '',
			description: currentEvent.description ?? '',
			textChannelId: currentEvent.channel_id ?? '',
			repeatType: currentEvent.repeat_type,
			timeStart: formatToLocalDateString(currentEvent.start_time || ''),
			timeEnd: formatToLocalDateString(currentEvent.end_time || '')
		};

		const submittedContent = {
			topic: contentSubmit.topic,
			address: contentSubmit.address,
			voiceChannel: contentSubmit.voiceChannel,
			logo: contentSubmit.logo,
			description: contentSubmit.description,
			textChannelId: contentSubmit.textChannelId,
			repeatType: contentSubmit.repeatType,
			timeStart: formatToLocalDateString(contentSubmit.selectedDateStart || ''),
			timeEnd: formatToLocalDateString(contentSubmit.selectedDateEnd || '')
		};

		return !isEqual(submittedContent, formattedCurrentEvent);
	}, [
		currentEvent?.title,
		currentEvent?.address,
		currentEvent?.channel_voice_id,
		currentEvent?.logo,
		currentEvent?.description,
		currentEvent?.channel_id,
		currentEvent?.repeat_type,
		currentEvent?.start_time,
		currentEvent?.end_time,

		contentSubmit?.topic,
		contentSubmit?.address,
		contentSubmit?.voiceChannel,
		contentSubmit?.logo,
		contentSubmit?.description,
		contentSubmit?.textChannelId,
		contentSubmit?.repeatType,
		contentSubmit?.selectedDateStart,
		contentSubmit?.selectedDateEnd
	]);

	const handleUpdate = useCallback(async () => {
		try {
			const address = choiceLocation ? contentSubmit.address : '';
			const timeValueStart = handleTimeISO(contentSubmit.selectedDateStart, contentSubmit.timeStart);
			const timeValueEnd = handleTimeISO(contentSubmit.selectedDateEnd, contentSubmit.timeEnd);
			const voiceChannel = (eventChannel || eventId) && choiceSpeaker ? contentSubmit.voiceChannel : '';
			const creatorId = currentEvent?.creator_id;

			const baseEventFields: Partial<Record<string, string | number | boolean>> = {
				event_id: eventId,
				clan_id: currentClanId as string,
				creator_id: creatorId as string,
				channel_id_old: currentEvent?.channel_id,
				is_private: Boolean(currentEvent?.is_private)
			};

			const updatedEventFields: Partial<Record<string, string | number | undefined>> = {
				channel_voice_id: contentSubmit.voiceChannel === currentEvent.channel_voice_id ? undefined : voiceChannel,
				address: contentSubmit.address === currentEvent.address ? undefined : address,
				title: contentSubmit.topic === currentEvent.title ? undefined : contentSubmit.topic,
				start_time: timeValueStart === convertToLongUTCFormat(currentEvent.start_time as string) ? undefined : timeValueStart,
				end_time: timeValueEnd === convertToLongUTCFormat(currentEvent.end_time as string) ? undefined : timeValueEnd,
				repeat_type: contentSubmit.repeatType === currentEvent.repeat_type ? ERepeatType.DOES_NOT_REPEAT : contentSubmit.repeatType
			};

			const additionalFields: Partial<Record<string, string | number | undefined>> = {
				description: contentSubmit.description,
				logo: contentSubmit.logo,
				channel_id: contentSubmit.textChannelId
			};

			const combinedUpdatedFields: Partial<Record<string, string | number | boolean>> = {
				...baseEventFields,
				...updatedEventFields
			};

			const validatedFieldsToUpdate = Object.entries(combinedUpdatedFields).reduce<Record<string, string | number | boolean>>(
				(acc, [key, value]) => {
					if (value) {
						acc[key] = value;
					}
					return acc;
				},
				{}
			);

			const finalFieldsToSubmit: Partial<Record<string, string | number | boolean>> = {
				...validatedFieldsToUpdate,
				...additionalFields
			};

			if (isEventChanged) {
				await dispatch(eventManagementActions.updateEventManagement(finalFieldsToSubmit));
				hanldeCloseModal();
			}
		} catch (error) {
			console.error('Error in handleUpdate:', error);
		}
	}, [choiceLocation, contentSubmit, currentEvent, eventChannel, eventId, choiceSpeaker, currentClanId, dispatch]);

	const hanldeCloseModal = () => {
		onClose();
		onCloseEventModal();
	};

	useEffect(() => {
		if (currentModal >= 1) {
			setButtonWork(false);
		} else {
			setButtonWork(true);
		}

		if (contentSubmit.topic) {
			setButtonWork(true);
		}
	}, [currentModal, contentSubmit.topic]);

	useEffect(() => {
		if ((choiceLocation && contentSubmit.address === '') || (choiceSpeaker && contentSubmit.voiceChannel === '')) {
			setErrorOption(true);
		} else {
			setErrorOption(false);
		}
	}, [choiceLocation, choiceSpeaker, contentSubmit.address, contentSubmit.voiceChannel, option]);

	const defaultTimeStart = useMemo(() => getCurrentTimeRounded(), []);
	const defaultTimeEnd = useMemo(() => getCurrentTimeRounded(true), []);

	useEffect(() => {
		if (eventId === '') {
			setContentSubmit((prev) => ({ ...prev, timeStart: defaultTimeStart }));
			setContentSubmit((prev) => ({ ...prev, timeEnd: defaultTimeEnd }));
		} else {
			setContentSubmit((prev) => ({ ...prev, timeStart: formatTimeStringToHourFormat(currentEvent.start_time || '') }));
			setContentSubmit((prev) => ({ ...prev, timeEnd: formatTimeStringToHourFormat(currentEvent.end_time || '') }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const isDisabled = option === '' || errorOption || !isEventChanged;

	return (
		<div className="dark:bg-[#313339] bg-bgLightMode rounded-lg text-sm p-4">
			<div className="flex gap-x-4 mb-4">
				<HeaderEventCreate tabs={tabs} currentModal={currentModal} onHandleTab={(num: number) => handleCurrentModal(num)} />
			</div>

			{currentModal === Tabs_Option.LOCATION && (
				<LocationModal
					onClose={onClose}
					contentSubmit={contentSubmit}
					choiceSpeaker={choiceSpeaker}
					choiceLocation={choiceLocation}
					voicesChannel={voicesChannel}
					handleOption={handleOption}
					setContentSubmit={setContentSubmit}
					textChannels={textChannels}
					choicePrivateEvent={choicePrivateEvent}
					isEditEventAction={isEditEventAction}
					isChannelEvent={isChannelEvent}
					isClanEvent={isClanEvent}
					isPrivateEvent={isPrivateEvent}
				/>
			)}
			{currentModal === Tabs_Option.EVENT_INFO && (
				<EventInfoModal
					onClose={onClose}
					contentSubmit={contentSubmit}
					choiceLocation={choiceLocation}
					timeStartDefault={currentEvent ? formatTimeStringToHourFormat(currentEvent.start_time || '') : defaultTimeStart}
					timeEndDefault={currentEvent ? formatTimeStringToHourFormat(currentEvent.end_time || '') : defaultTimeEnd}
					setContentSubmit={setContentSubmit}
					setErrorTime={(status: boolean) => setErrorTime(status)}
				/>
			)}
			{currentModal === Tabs_Option.REVIEW && (
				<ReviewModal onClose={onClose} event={currentEvent} contentSubmit={contentSubmit} option={option} />
			)}
			<div className="flex justify-between mt-4 w-full text-white">
				<button
					className={`py-2 text-[#84ADFF] font-bold ${(currentModal === Tabs_Option.LOCATION || errorTime) && 'hidden'}`}
					onClick={() => handleBack(currentModal)}
				>
					Back
				</button>
				<div className="flex justify-end gap-x-4 w-full">
					<button
						className="px-4 py-2 rounded bg-slate-500 font-semibold"
						onClick={() => {
							onClose();
							clearEventId();
						}}
					>
						Cancel
					</button>
					{currentModal === Tabs_Option.REVIEW ? (
						eventId !== '' ? (
							<button
								className={`px-4 py-2 rounded font-semibold bg-primary ${isDisabled && 'dark:text-slate-400 text-slate-500 bg-opacity-50 cursor-not-allowed'}`}
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onClick={handleUpdate}
							>
								Update Event
							</button>
						) : (
							<button
								disabled={createStatus === 'loading'}
								className={`px-4 py-2 rounded font-semibold bg-primary ${(option === '' || errorOption) && 'dark:text-slate-400 text-slate-500 bg-opacity-50'}`}
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onClick={option === '' || errorOption ? () => {} : () => handleSubmit()}
							>
								Create Event
							</button>
						)
					) : (
						<button
							className={`px-4 py-2 rounded font-semibold bg-primary ${(!buttonWork || errorTime || errorOption) && 'dark:text-slate-400 text-slate-500 bg-opacity-50'}`}
							onClick={() => handleNext(currentModal)}
						>
							Next
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ModalCreate;
