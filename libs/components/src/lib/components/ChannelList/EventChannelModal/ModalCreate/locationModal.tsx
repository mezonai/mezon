import { useEscapeKeyClose } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import { selectTheme } from '@mezon/store';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import type { ContentSubmitEventProps } from '@mezon/utils';
import { OptionEvent, filterOptionReactSelect, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { FilterOptionOption } from 'react-select';
import Select from 'react-select';
import { customStyles } from '../../../NotificationSetting';

export type LocationModalProps = {
	contentSubmit: ContentSubmitEventProps;
	voicesChannel: ChannelsEntity[];
	textChannels: ChannelsEntity[];
	choiceLocation: boolean;
	choiceSpeaker: boolean;
	choicePrivateEvent?: boolean;
	handleOption: (optionEvent: string) => void;
	setContentSubmit: React.Dispatch<React.SetStateAction<ContentSubmitEventProps>>;
	onClose: () => void;
	isEditEventAction?: boolean;
	isClanEvent?: boolean;
	isChannelEvent?: boolean;
	isPrivateEvent?: boolean;
	isAudienceRequired?: boolean;
};

type OptionType = {
	value: string;
	label: JSX.Element;
};

type FilterOptionType = (option: FilterOptionOption<OptionType>, inputValue: string) => boolean;

const LocationModal = (props: LocationModalProps) => {
	const {
		handleOption,
		voicesChannel,
		contentSubmit,
		setContentSubmit,
		choiceLocation,
		choiceSpeaker,
		textChannels,
		onClose,
		choicePrivateEvent,
		isEditEventAction = false,
		isClanEvent = false,
		isChannelEvent = false,
		isPrivateEvent = false,
		isAudienceRequired = false
	} = props;

	const { t } = useTranslation('eventCreator');
	const [errorVoice, setErrorVoice] = useState(false);

	const displaySelectAudiences = !choicePrivateEvent && (!isEditEventAction || !isPrivateEvent);
	const displaySelectPrivate = !isEditEventAction || (isEditEventAction && isPrivateEvent);
	const displaySelectVoiceOrLocation = !isEditEventAction || (isEditEventAction && !isPrivateEvent);

	const handleChangeVoice = (selectedOption: any) => {
		setContentSubmit({
			...contentSubmit,
			voiceChannel: selectedOption.value,
			isPrivate: false
		});
	};

	const LOCATION_MAX_LENGTH = 500;
	const locationTooLong = (contentSubmit.address?.length ?? 0) > LOCATION_MAX_LENGTH;

	const onChangeAddress = (e: any) => {
		setContentSubmit((prev) => ({ ...prev, address: e.target.value, isPrivate: false }));
	};

	const onChangePrivateEvent = () => {
		handleOption(OptionEvent.PRIVATE_EVENT);
		setContentSubmit((prev) => ({ ...prev, isPrivate: true }));
	};

	const appearanceTheme = useSelector(selectTheme);

	const options = voicesChannel.map((voice) => ({
		value: voice.id,
		label: (
			<div className="flex items-center gap-x-2 " data-e2e={generateE2eId('clan_page.modal.create_event.location.channel.item')}>
				{voice.channel_private ? (
					<MezonIcon icon={MzIcons20.mzSpeakerLock} className="text-[var(--mz-icon)]" />
				) : (
					<MezonIcon icon={MzIcons20.mzSpeaker} className="text-[var(--mz-icon)]" />
				)}
				<span className="truncate overflow-hidden max-w-[200px]">{voice.channel_label}</span>
			</div>
		)
	}));

	useEffect(() => {
		if (voicesChannel.length <= 0) {
			setErrorVoice(true);
		} else {
			setErrorVoice(false);
		}
	}, [voicesChannel]);

	const handleSelectChannelAudience = useCallback(
		(selectedOption: any) => {
			setIsClear(false);
			setContentSubmit((prevContentSubmit) => ({
				...prevContentSubmit,
				textChannelId: selectedOption.value
			}));
		},
		[setContentSubmit]
	);
	const [isClear, setIsClear] = useState<boolean>(false);
	const handleClearAudience = () => {
		setIsClear(true);
		setContentSubmit((prevContentSubmit) => ({
			...prevContentSubmit,
			textChannelId: ''
		}));
	};
	const optionsTextChannel = useMemo(
		() =>
			textChannels.map((channel) => {
				const isTextChannel = channel.type === ChannelType.CHANNEL_TYPE_CHANNEL;
				const isThread = channel.type === ChannelType.CHANNEL_TYPE_THREAD;
				const isPrivateChannel = channel.channel_private;

				const icon = isTextChannel ? (
					isPrivateChannel ? (
						<MezonIcon icon={MzIcons20.mzChannelPrivate} className="text-[var(--mz-icon)]" />
					) : (
						<MezonIcon icon={MzIcons20.mzChannel} className="text-[var(--mz-icon)]" />
					)
				) : isThread ? (
					isPrivateChannel ? (
						<MezonIcon icon={MzIcons20.mzThreadPrivate} className="text-[var(--mz-icon)]" />
					) : (
						<MezonIcon icon={MzIcons20.mzThread} className="text-[var(--mz-icon)]" />
					)
				) : null;

				return {
					value: channel.id,
					label: (
						<div className="flex items-center gap-x-2 " data-e2e={generateE2eId('clan_page.modal.create_event.location.channel.item')}>
							{icon}
							{channel.channel_label}
						</div>
					)
				};
			}),
		[textChannels]
	);

	const selectedOption = useMemo(
		() => (isClear ? undefined : optionsTextChannel.find((option) => option.value === contentSubmit.textChannelId)),
		[isClear, optionsTextChannel, contentSubmit.textChannelId]
	);
	const showClearButton = Boolean(selectedOption);
	const selectedVoiceChannel = voicesChannel.find((voice) => voice.id === contentSubmit.voiceChannel);
	const showPrivateVoiceAudienceTip = displaySelectAudiences && Boolean(selectedOption) && Boolean(selectedVoiceChannel?.channel_private);

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	const memoizedFilterOption = useMemo<FilterOptionType>(() => (option, inputValue) => filterOptionReactSelect(option, inputValue), []);

	return (
		<div ref={modalRef} className="p-6" data-e2e={generateE2eId('clan_page.modal.create_event.location')}>
			<div className="flex flex-col mb-4">
				<h3 className="text-xl text-center font-semibold ">{t('screens.eventType.title')}</h3>
				<p className=" text-center">{t('screens.eventType.subtitle')}</p>
			</div>
			<div className={`flex flex-col mb-4 ${errorVoice ? 'gap-y-2' : 'gap-y-4'}`}>
				{displaySelectVoiceOrLocation && (
					<TitleOptionEvent
						icon={
							<MezonIcon
								icon={MzIcons20.mzSpeaker}
								className={choiceSpeaker ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
							/>
						}
						title={t('fields.channelType.voiceChannel.title')}
						desc={t('fields.channelType.voiceChannel.description')}
						choose={choiceSpeaker}
						id="Speaker"
						onChange={() => {
							handleOption(OptionEvent.OPTION_SPEAKER);
							setContentSubmit((prev) => ({ ...prev, isPrivate: false }));
						}}
						disabled={voicesChannel.length === 0}
					/>
				)}

				{displaySelectVoiceOrLocation && (
					<TitleOptionEvent
						icon={
							<MezonIcon
								icon={MzIcons20.mzLocation}
								className={choiceLocation ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
							/>
						}
						title={t('fields.channelType.somewhere.title')}
						desc={t('fields.channelType.somewhere.description')}
						choose={choiceLocation}
						id="Hashtag"
						onChange={() => {
							handleOption(OptionEvent.OPTION_LOCATION);
							setContentSubmit((prev) => ({ ...prev, isPrivate: false }));
						}}
					/>
				)}

				{displaySelectPrivate && (
					<TitleOptionEvent
						icon={
							<MezonIcon
								icon={MzIcons20.mzSpeaker}
								className={choicePrivateEvent ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)]'}
							/>
						}
						title={t('fields.channelType.privateEvent.title')}
						desc={t('fields.channelType.privateEvent.description')}
						choose={!!choicePrivateEvent}
						id="Private"
						onChange={onChangePrivateEvent}
					/>
				)}
			</div>
			{choiceSpeaker && (
				<div>
					<Select
						classNames={{
							menuList: () => 'thread-scroll'
						}}
						options={options}
						value={options.find((option) => option.value === contentSubmit.voiceChannel)}
						onChange={handleChangeVoice}
						styles={customStyles}
						placeholder={t('fields.VoiceChannel.title')}
						filterOption={memoizedFilterOption}
						noOptionsMessage={() => t('invitation:noResults', 'No result')}
					/>
					{showPrivateVoiceAudienceTip && (
						<p
							className="mt-2 text-xs text-theme-primary break-words"
							data-e2e={generateE2eId('clan_page.modal.create_event.location.private_voice_audience_tip')}
						>
							<Trans
								t={t}
								i18nKey="fields.VoiceChannel.privateAudienceTip"
								values={{ channelName: selectedVoiceChannel?.channel_label }}
								components={{ channel: <span className="text-blue-500" /> }}
							/>
						</p>
					)}
				</div>
			)}
			{choiceLocation && (
				<div>
					<h3 className="uppercase text-[11px] font-semibold">
						{t('fields.address.title')}
						<span className="text-red-500 ml-1">*</span>
					</h3>
					<input
						type="text"
						name="location"
						value={contentSubmit.address}
						onChange={onChangeAddress}
						placeholder={t('fields.address.placeholder')}
						className={`font-[400] rounded w-full outline-none text-[15px] border px-4 py-3 focus:outline-none bg-theme-input ${locationTooLong ? 'border-red-500' : 'border-theme-primary focus:border-white-500'} ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
						data-e2e={generateE2eId('clan_page.modal.create_event.location.input')}
					/>
					{locationTooLong && <p className="text-red-500 text-xs mt-1">{t('errorMessages.locationMaxLength')}</p>}
				</div>
			)}
			{displaySelectAudiences && (
				<>
					<div className="flex flex-col mb-2 mt-3">
						<h3 className="text-xl text-center font-semibold  ">
							{t('screens.channelSelection.title')}
							{isAudienceRequired && <span className="text-red-500 ml-1">*</span>}
						</h3>
						<p className=" text-center">{t('screens.channelSelection.description')}</p>
					</div>

					<Select
						classNames={{
							menuList: () => 'thread-scroll',
							control: () => 'cursor-pointer'
						}}
						options={optionsTextChannel}
						value={isClear ? null : selectedOption}
						onChange={handleSelectChannelAudience}
						styles={customStyles}
						placeholder={t('fields.channel.title')}
						filterOption={memoizedFilterOption}
						menuPlacement="top"
						noOptionsMessage={() => t('invitation:noResults', 'No result')}
					/>
					{showClearButton && (
						<div className="flex justify-end mt-1">
							<button onClick={handleClearAudience} className="text-blue-500 hover:underline">
								{t('actions.clearAudiences')}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
};

const TitleOptionEvent = ({
	title,
	desc,
	choose,
	icon,
	onChange,
	id,
	disabled = false
}: {
	title: string;
	desc: string;
	choose: boolean;
	icon: JSX.Element;
	onChange?: () => void;
	id: string;
	disabled?: boolean;
}) => {
	return (
		<label
			className={`mz-hover w-full bg-item-theme rounded flex justify-between items-center p-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
			htmlFor={disabled ? undefined : id}
		>
			<div className={`flex items-center gap-x-2 ${choose ? 'text-theme-primary-active' : ''} `}>
				{icon}
				<div>
					<h4 className={`font-semibold`} data-e2e={generateE2eId('clan_page.modal.create_event.location.type')}>
						{title}
					</h4>
					<p>{desc}</p>
				</div>
			</div>
			<input
				type="radio"
				checked={choose}
				id={id}
				value={id}
				className="focus:outline-none focus:ring-0"
				onChange={onChange}
				disabled={disabled}
			/>
		</label>
	);
};

export default LocationModal;
