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
import type { ContenSubmitEventProps } from '@mezon/utils';
import { ERepeatType, OptionEvent, Tabs_Option, generateE2eId } from '@mezon/utils';
import isEqual from 'lodash.isequal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { formatTimeStringToHourFormat, getCurrentTimeRounded, handleTimeISO } from '../timeFomatEvent';
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
	const { t } = useTranslation('eventCreator');
	const currentClanId = useSelector(selectCurrentClanId);
	const voicesChannel = useSelector(selectVoiceChannelAll);
	const textChannels = useSelector(selectAllTextChannel);

	const tabs = [t('tabs.location'), t('tabs.eventInfo'), t('tabs.review')];
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
		timeStart: currentEvent ? formatTimeStringToHourFormat(currentEvent.start_time_seconds || 0) || '00:00' : '00:00',
		timeEnd: currentEvent ? formatTimeStringToHourFormat(currentEvent.end_time_seconds || 0) || '00:00' : '00:00',
		selectedDateStart: currentEvent ? new Date(currentEvent.start_time_seconds || 0) : new Date(),
		selectedDateEnd: currentEvent ? new Date(currentEvent.end_time_seconds || 0) : new Date(),
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

		await createEventManagement(
			currentClanId || '',
			voice,
			address as string,
			contentSubmit.topic,
			contentSubmit.selectedDateStart.getTime(),
			contentSubmit.selectedDateEnd.getTime(),
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
			timeStart: currentEvent.start_time_seconds,
			timeEnd: currentEvent.end_time_seconds
		};

		const submittedContent = {
			topic: contentSubmit.topic,
			address: contentSubmit.address,
			voiceChannel: contentSubmit.voiceChannel,
			logo: contentSubmit.logo,
			description: contentSubmit.description,
			textChannelId: contentSubmit.textChannelId,
			repeatType: contentSubmit.repeatType,
			timeStart: contentSubmit.selectedDateStart.getTime(),
			timeEnd: contentSubmit.selectedDateEnd.getTime()
		};
		const changeTime =
			currentEvent.start_time_seconds !== submittedContent.timeStart || currentEvent.end_time_seconds !== submittedContent.timeEnd;
		return !isEqual(submittedContent, formattedCurrentEvent) || changeTime;
	}, [
		currentEvent?.title,
		currentEvent?.address,
		currentEvent?.channel_voice_id,
		currentEvent?.logo,
		currentEvent?.description,
		currentEvent?.channel_id,
		currentEvent?.repeat_type,
		currentEvent?.start_time_seconds,
		currentEvent?.end_time_seconds,

		contentSubmit?.topic,
		contentSubmit?.address,
		contentSubmit?.voiceChannel,
		contentSubmit?.logo,
		contentSubmit?.description,
		contentSubmit?.textChannelId,
		contentSubmit?.repeatType,
		contentSubmit?.selectedDateStart,
		contentSubmit?.selectedDateEnd,
		contentSubmit?.timeStart,
		contentSubmit?.timeEnd
	]);

	const handleUpdate = useCallback(async () => {
		try {
			const address = choiceLocation ? contentSubmit.address : '';
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
				start_time_seconds:
					contentSubmit.selectedDateStart.getTime() === currentEvent.start_time_seconds
						? undefined
						: contentSubmit.selectedDateStart.getTime(),
				end_time_seconds:
					contentSubmit.selectedDateEnd.getTime() === currentEvent.end_time_seconds ? undefined : contentSubmit.selectedDateEnd.getTime(),
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
			setContentSubmit((prev) => ({ ...prev, timeStart: formatTimeStringToHourFormat(currentEvent.start_time_seconds || 0) }));
			setContentSubmit((prev) => ({ ...prev, timeEnd: formatTimeStringToHourFormat(currentEvent.end_time_seconds || 0) }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const isDisabled = option === '' || errorOption || !isEventChanged;

	return (
		<div className="bg-theme-setting-primary rounded-lg text-sm p-4 text-theme-primary">
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
					timeStartDefault={currentEvent ? formatTimeStringToHourFormat(currentEvent.start_time_seconds || 0) : defaultTimeStart}
					timeEndDefault={currentEvent ? formatTimeStringToHourFormat(currentEvent.end_time_seconds || 0) : defaultTimeEnd}
					setContentSubmit={setContentSubmit}
					setErrorTime={(status: boolean) => setErrorTime(status)}
				/>
			)}
			{currentModal === Tabs_Option.REVIEW && (
				<ReviewModal onClose={onClose} event={currentEvent} contentSubmit={contentSubmit} option={option} />
			)}
			<div className="flex justify-between mt-4 w-full ">
				<button
					className={`px-4 py-2 text-[#84ADFF] font-bold whitespace-nowrap ${(currentModal === Tabs_Option.LOCATION || errorTime) && 'hidden'}`}
					onClick={() => handleBack(currentModal)}
				>
					{t('actions.back', 'Back')}
				</button>
				<div className="flex justify-end gap-x-4 w-full">
					<button
						className="px-4 py-2 rounded-md border-theme-primary text-theme-primary-hover font-semibold hover:underline"
						onClick={() => {
							onClose();
							clearEventId();
						}}
					>
						{t('actions.cancel', 'Cancel')}
					</button>
					{currentModal === Tabs_Option.REVIEW ? (
						eventId !== '' ? (
							<button
								className={`px-4 py-2 rounded-md text-white font-semibold bg-primary ${isDisabled && ' bg-opacity-50 cursor-not-allowed'}`}
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onClick={handleUpdate}
							>
								{t('actions.edit')}
							</button>
						) : (
							<button
								disabled={createStatus === 'loading'}
								className={`px-4 py-2 rounded font-semibold text-white bg-primary ${(option === '' || errorOption) && ' bg-opacity-50'}`}
								// eslint-disable-next-line @typescript-eslint/no-empty-function
								onClick={option === '' || errorOption ? () => {} : () => handleSubmit()}
								data-e2e={generateE2eId('clan_page.modal.create_event.button_create')}
							>
								{t('actions.create')}
							</button>
						)
					) : (
						<button
							className={`px-4 py-2 rounded font-semibold text-white bg-primary ${(!buttonWork || errorTime || errorOption || !option) && ' bg-opacity-50 cursor-not-allowed'}`}
							onClick={() => handleNext(currentModal)}
							disabled={!option || !buttonWork || errorTime || errorOption}
							data-e2e={generateE2eId('clan_page.modal.create_event.next')}
						>
							{t('actions.next')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

export default ModalCreate;
