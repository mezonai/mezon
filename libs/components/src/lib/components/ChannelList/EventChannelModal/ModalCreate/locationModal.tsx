import { useEscapeKeyClose } from '@mezon/core';
import type { ChannelsEntity } from '@mezon/store';
import { selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ContenSubmitEventProps } from '@mezon/utils';
import { OptionEvent, filterOptionReactSelect, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import type { FilterOptionOption } from 'react-select/dist/declarations/src/filters';
import { customStyles } from '../../../NotificationSetting';

export type LocationModalProps = {
	contentSubmit: ContenSubmitEventProps;
	voicesChannel: ChannelsEntity[];
	textChannels: ChannelsEntity[];
	choiceLocation: boolean;
	choiceSpeaker: boolean;
	choicePrivateEvent?: boolean;
	handleOption: (optionEvent: string) => void;
	setContentSubmit: React.Dispatch<React.SetStateAction<ContenSubmitEventProps>>;
	onClose: () => void;
	isEditEventAction?: boolean;
	isClanEvent?: boolean;
	isChannelEvent?: boolean;
	isPrivateEvent?: boolean;
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
		isPrivateEvent = false
	} = props;
	const { t } = useTranslation('eventCreator');
	const [errorVoice, setErrorVoice] = useState(false);

	const displaySelectAudiences = (!isEditEventAction && !choicePrivateEvent) || (isEditEventAction && isChannelEvent);
	const displaySelectPrivate = !isEditEventAction || (isEditEventAction && isPrivateEvent);
	const displaySelectVoiceOrLocation = !isEditEventAction || (isEditEventAction && !isPrivateEvent);

	const handleChangeVoice = (selectedOption: any) => {
		setContentSubmit({
			...contentSubmit,
			voiceChannel: selectedOption.value,
			isPrivate: false
		});
	};

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
				{voice.channelPrivate ? <Icons.SpeakerLocked /> : <Icons.Speaker />}
				<span className="truncate overflow-hidden max-w-[200px]">{voice.channelLabel}</span>
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
				const isPrivateChannel = channel.channelPrivate;

				const icon = isTextChannel ? (
					isPrivateChannel ? (
						<Icons.HashtagLocked />
					) : (
						<Icons.Hashtag />
					)
				) : isThread ? (
					isPrivateChannel ? (
						<Icons.ThreadIconLocker />
					) : (
						<Icons.ThreadIcon />
					)
				) : null;

				return {
					value: channel.id,
					label: (
						<div className="flex items-center gap-x-2 " data-e2e={generateE2eId('clan_page.modal.create_event.location.channel.item')}>
							{icon}
							{channel.channelLabel}
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
	const showClearButton = selectedOption && !isEditEventAction ? true : false;

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
						icon={<Icons.Speaker />}
						title={t('fields.channelType.voiceChannel.title')}
						desc={t('fields.channelType.voiceChannel.description')}
						choose={choiceSpeaker}
						id="Speaker"
						onChange={voicesChannel.length > 0 ? () => handleOption(OptionEvent.OPTION_SPEAKER) : () => {}}
					/>
				)}

				{displaySelectVoiceOrLocation && (
					<TitleOptionEvent
						icon={<Icons.Location />}
						title={t('fields.channelType.somewhere.title')}
						desc={t('fields.channelType.somewhere.description')}
						choose={choiceLocation}
						id="Hashtag"
						onChange={() => handleOption(OptionEvent.OPTION_LOCATION)}
					/>
				)}

				{displaySelectPrivate && (
					<TitleOptionEvent
						icon={<Icons.Speaker />}
						title={t('fields.channelType.privateEvent.title')}
						desc={t('fields.channelType.privateEvent.description')}
						choose={!!choicePrivateEvent}
						id="Private"
						onChange={onChangePrivateEvent}
					/>
				)}
			</div>
			{choiceSpeaker && (
				<Select
					classNames={{
						menuList: () => 'thread-scroll'
					}}
					options={options}
					value={options.find((option) => option.value === contentSubmit.voiceChannel)}
					onChange={handleChangeVoice}
					styles={customStyles}
					placeholder={t('fields.channel.title')}
					filterOption={memoizedFilterOption}
					noOptionsMessage={() => t('invitation:noResults', 'No result')}
				/>
			)}
			{choiceLocation && (
				<div>
					<h3 className="uppercase text-[11px] font-semibold  ">{t('fields.address.title')}</h3>
					<input
						type="text"
						name="location"
						value={contentSubmit.address}
						onChange={onChangeAddress}
						placeholder={t('fields.address.placeholder')}
						className={`font-[400] rounded w-full  outline-none text-[15px] border border-theme-primary px-4 py-3 focus:outline-none focus:border-white-500 bg-theme-input ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
						data-e2e={generateE2eId('clan_page.modal.create_event.location.input')}
					/>
				</div>
			)}
			{displaySelectAudiences && (
				<>
					<div className="flex flex-col mb-2 mt-3">
						<h3 className="text-xl text-center font-semibold  ">{t('screens.channelSelection.title')}</h3>
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
	id
}: {
	title: string;
	desc: string;
	choose: boolean;
	icon: JSX.Element;
	onChange?: () => void;
	id: string;
}) => {
	return (
		<label className="w-full bg-item-theme rounded flex justify-between items-center p-2 cursor-pointer" htmlFor={id}>
			<div className={`flex items-center gap-x-2 ${choose ? 'text-theme-primary-active' : ''} `}>
				{icon}
				<div>
					<h4 className={`font-semibold`} data-e2e={generateE2eId('clan_page.modal.create_event.location.type')}>
						{title}
					</h4>
					<p>{desc}</p>
				</div>
			</div>
			<input type="radio" checked={choose} id={id} value={id} className="focus:outline-none focus:ring-0" onChange={onChange} />
		</label>
	);
};

export default LocationModal;
