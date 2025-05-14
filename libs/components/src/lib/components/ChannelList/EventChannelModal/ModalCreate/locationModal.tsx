import { useEscapeKeyClose } from '@mezon/core';
import { ChannelsEntity, selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ContenSubmitEventProps, OptionEvent, filterOptionReactSelect } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { FilterOptionOption } from 'react-select/dist/declarations/src/filters';
import { customStyles, lightCustomStyles } from '../../../NotificationSetting';

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
			<div className="flex items-center gap-x-2 dark:text-white text-black">
				{voice.channel_private ? <Icons.SpeakerLocked /> : <Icons.Speaker />}
				{voice.channel_label}
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
						<div className="flex items-center gap-x-2 dark:text-white text-black">
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
	const showClearButton = selectedOption && !isEditEventAction ? true : false;

	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	const memoizedFilterOption = useMemo<FilterOptionType>(() => (option, inputValue) => filterOptionReactSelect(option, inputValue), []);

	return (
		<div ref={modalRef}>
			<div className="flex flex-col mb-4">
				<h3 className="text-xl text-center font-semibold dark:text-white text-black ">Where is your event?</h3>
				<p className="text-slate-400 text-center">So no one gets lost on where to go.</p>
			</div>
			<div className={`flex flex-col mb-4 ${errorVoice ? 'gap-y-2' : 'gap-y-4'}`}>
				{displaySelectVoiceOrLocation && (
					<TitleOptionEvent
						icon={<Icons.Speaker />}
						title="Voice Channel"
						desc="Hang out with voice, video, Screen Share and Go Live."
						choose={choiceSpeaker}
						id="Speaker"
						onChange={voicesChannel.length > 0 ? () => handleOption(OptionEvent.OPTION_SPEAKER) : () => {}}
					/>
				)}

				{displaySelectVoiceOrLocation && (
					<TitleOptionEvent
						icon={<Icons.Location />}
						title="Somewhere Else"
						desc="Text channel, external link or in-person location."
						choose={choiceLocation}
						id="Hashtag"
						onChange={() => handleOption(OptionEvent.OPTION_LOCATION)}
					/>
				)}

				{displaySelectPrivate && (
					<TitleOptionEvent
						icon={<Icons.SpeakerLocked />}
						title="Create Private Event"
						desc="Invite-only voice & video room!"
						choose={!!choicePrivateEvent}
						id="Private"
						onChange={onChangePrivateEvent}
					/>
				)}
			</div>
			{choiceSpeaker && (
				<Select
					options={options}
					value={options.find((option) => option.value === contentSubmit.voiceChannel)}
					onChange={handleChangeVoice}
					styles={appearanceTheme === 'dark' ? customStyles : lightCustomStyles}
					placeholder="Search voice channels..."
					filterOption={memoizedFilterOption}
				/>
			)}
			{choiceLocation && (
				<div>
					<h3 className="uppercase text-[11px] font-semibold dark:text-white text-black ">Enter a location</h3>
					<input
						type="text"
						name="location"
						value={contentSubmit.address}
						onChange={onChangeAddress}
						placeholder="Add a location, link or something."
						className={`font-[400] rounded w-full dark:text-white text-black outline-none text-[15px]border border-black px-4 py-3 focus:outline-none focus:border-white-500 dark:bg-black bg-bgModifierHoverLight ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
					/>
				</div>
			)}
			{displaySelectAudiences && (
				<>
					<div className="flex flex-col mb-2 mt-3">
						<h3 className="text-xl text-center font-semibold dark:text-white text-black ">Who are audiences?</h3>
						<p className="text-slate-400 text-center">Choose members in the specified channel.</p>
					</div>

					<Select
						options={optionsTextChannel}
						value={isClear ? null : selectedOption}
						onChange={handleSelectChannelAudience}
						styles={customStyles}
						placeholder="Search channels..."
						filterOption={memoizedFilterOption}
					/>
					{showClearButton && (
						<div className="flex justify-end mt-1">
							<button onClick={handleClearAudience} className="text-blue-500 hover:underline">
								Clear audiences
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
		<label className="w-full dark:bg-[#2B2D31] bg-bgLightModeButton rounded flex justify-between items-center p-2" htmlFor={id}>
			<div className="flex items-center gap-x-2">
				{icon}
				<div>
					<h4 className={`font-semibold ${choose ? 'dark:text-white text-black' : 'text-slate-400'}`}>{title}</h4>
					<p className={choose ? 'dark:text-white text-black' : 'text-slate-400'}>{desc}</p>
				</div>
			</div>
			<input type="radio" checked={choose} id={id} value={id} className="focus:outline-none focus:ring-0" onChange={onChange} />
		</label>
	);
};

export default LocationModal;
