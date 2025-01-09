import { useEventManagement } from '@mezon/core';
import {
	eventManagementActions,
	selectAllTextChannel,
	selectChannelById,
	selectCreatingLoaded,
	selectCurrentClanId,
	selectEventById,
	selectVoiceChannelAll,
	toastActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { ContenSubmitEventProps, ERepeatType, OptionEvent, Tabs_Option } from '@mezon/utils';
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

const ModalCreate = (props: ModalCreateProps) => {
	const { onClose, onCloseEventModal, eventId, clearEventId } = props;
	const currentClanId = useSelector(selectCurrentClanId);
	const voicesChannel = useSelector(selectVoiceChannelAll);
	const textChannels = useSelector(selectAllTextChannel);

	const tabs = ['Location', 'Event Info', 'Review'];
	const [currentModal, setCurrentModal] = useState(0);
	const currentEvent = useAppSelector((state) => selectEventById(state, currentClanId ?? '', eventId ?? ''));
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
		repeatType: currentEvent ? currentEvent.repeat_type || 0 : 0
	});

	const [buttonWork, setButtonWork] = useState(true);
	const [errorOption, setErrorOption] = useState(false);
	const [errorTime, setErrorTime] = useState(false);

	const { createEventManagement } = useEventManagement();

	const [option, setOption] = useState<string>('');

	const isExistChannelVoice = Boolean(currentEvent?.channel_voice_id);
	const isExistAddress = Boolean(currentEvent?.address);

	useEffect(() => {
		if (currentEvent && eventChannel) {
			if (isExistChannelVoice) {
				setOption(OptionEvent.OPTION_SPEAKER);
			} else if (isExistAddress) {
				setOption(OptionEvent.OPTION_LOCATION);
			}
		}
	}, [currentEvent, eventChannel]);

	const choiceSpeaker = useMemo(() => {
		return (isExistChannelVoice || option === OptionEvent.OPTION_SPEAKER) && option !== OptionEvent.OPTION_LOCATION;
	}, [isExistChannelVoice, option]);

	const choiceLocation = useMemo(() => {
		return (isExistAddress || option === OptionEvent.OPTION_LOCATION) && option !== OptionEvent.OPTION_SPEAKER;
	}, [isExistAddress, option]);

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

		if (buttonWork || number < 1) {
			setCurrentModal(number);
		}
	};

	const handleSubmit = useCallback(async () => {
		const voice = choiceSpeaker ? contentSubmit.voiceChannel : '';
		const address = choiceLocation ? contentSubmit.address : '';

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
			contentSubmit.repeatType as ERepeatType
		);

		hanldeCloseModal();
	}, [choiceSpeaker, contentSubmit, choiceLocation, currentClanId, createEventManagement]);

	const handleUpdate = useCallback(async () => {
		try {
			const address = choiceLocation ? contentSubmit.address : '';
			const timeValueStart = handleTimeISO(contentSubmit.selectedDateStart, contentSubmit.timeStart);
			const timeValueEnd = handleTimeISO(contentSubmit.selectedDateEnd, contentSubmit.timeEnd);
			const voiceChannel = (eventChannel || eventId) && choiceSpeaker ? contentSubmit.voiceChannel : '';
			const creatorId = currentEvent?.creator_id;

			const baseEventFields: Partial<Record<string, string | number>> = {
				event_id: eventId,
				clan_id: currentClanId as string,
				creator_id: creatorId as string,
				channel_id_old: currentEvent?.channel_id
			};

			const updatedEventFields: Partial<Record<string, string | number | undefined>> = {
				channel_voice_id: contentSubmit.voiceChannel === currentEvent.channel_voice_id ? undefined : voiceChannel,
				address: contentSubmit.address === currentEvent.address ? undefined : address,
				title: contentSubmit.topic === currentEvent.title ? undefined : contentSubmit.topic,
				start_time: timeValueStart === convertToLongUTCFormat(currentEvent.start_time as string) ? undefined : timeValueStart,
				end_time: timeValueEnd === convertToLongUTCFormat(currentEvent.end_time as string) ? undefined : timeValueEnd,
				repeat_type: contentSubmit.repeatType === currentEvent.repeat_type ? ERepeatType.DEFAULT : contentSubmit.repeatType
			};

			const additionalFields: Partial<Record<string, string | number | undefined>> = {
				description: contentSubmit.description,
				logo: contentSubmit.logo,
				channel_id: contentSubmit.textChannelId
			};

			const areUpdatedFieldsEmpty = Object.values(updatedEventFields).every((value) => value === undefined || value === '');

			const combinedUpdatedFields: Partial<Record<string, string | number>> = {
				...baseEventFields,
				...updatedEventFields
			};

			const validatedFieldsToUpdate = Object.entries(combinedUpdatedFields).reduce<Record<string, string | number>>((acc, [key, value]) => {
				if (value) {
					acc[key] = value;
				}
				return acc;
			}, {});

			const finalFieldsToSubmit: Partial<Record<string, string | number>> = {
				...validatedFieldsToUpdate,
				...additionalFields
			};

			if (!areUpdatedFieldsEmpty) {
				await dispatch(eventManagementActions.updateEventManagement(finalFieldsToSubmit));
				hanldeCloseModal();
			} else {
				dispatch(
					toastActions.addToast({
						message: 'Nothing has changed',
						type: 'warning',
						autoClose: 3000
					})
				);
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
		if (contentSubmit.topic !== '') {
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

	return (
		<div className="dark:bg-[#313339] bg-bgLightMode rounded-lg text-sm p-4">
			<div className="flex gap-x-4 mb-4">
				<HeaderEventCreate tabs={tabs} currentModal={currentModal} onHandleTab={(num: number) => handleCurrentModal(num)} />
			</div>
			<div>
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
				{currentModal === Tabs_Option.REVIEW && <ReviewModal onClose={onClose} contentSubmit={contentSubmit} option={option} />}
			</div>
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
								className={`px-4 py-2 rounded font-semibold bg-primary ${(option === '' || errorOption) && 'dark:text-slate-400 text-slate-500 bg-opacity-50'}`}
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onClick={option === '' || errorOption ? () => {} : () => handleUpdate()}
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
