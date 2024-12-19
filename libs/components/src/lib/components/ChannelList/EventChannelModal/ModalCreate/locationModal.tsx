import { ChannelsEntity, selectTheme } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ContenSubmitEventProps, OptionEvent } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { customStyles, lightCustomStyles } from '../../../notificationSetting';

export type LocationModalProps = {
	contentSubmit: ContenSubmitEventProps;
	voicesChannel: ChannelsEntity[];
	textChannels: ChannelsEntity[];
	choiceLocation: boolean;
	choiceSpeaker: boolean;
	choiceChannel: boolean;
	handleOption: (optionEvent: string) => void;
	setContentSubmit: React.Dispatch<React.SetStateAction<ContenSubmitEventProps>>;
};

const LocationModal = (props: LocationModalProps) => {
	const { handleOption, voicesChannel, contentSubmit, setContentSubmit, choiceLocation, choiceSpeaker, choiceChannel, textChannels } = props;
	const [errorVoice, setErrorVoice] = useState(false);

	const handleChangeVoice = (selectedOption: any) => {
		setContentSubmit({
			...contentSubmit,
			voiceChannel: selectedOption.value
		});
	};

	const onChangeTitle = (e: any) => {
		setContentSubmit((prev) => ({ ...prev, titleEvent: e.target.value }));
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

	const optionsTextChannel = textChannels.map((channel) => ({
		value: channel.id,
		label: (
			<div className="flex items-center gap-x-2 dark:text-white text-black">
				{channel.channel_private ? <Icons.Hashtag /> : <Icons.HashtagLocked />}
				{channel.channel_label}
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

	return (
		<div>
			<div className="flex flex-col mb-4">
				<h3 className="text-xl text-center font-semibold dark:text-white text-black ">Where is your event?</h3>
				<p className="text-slate-400 text-center">So no one gets lost on where to go.</p>
			</div>
			<div className={`flex flex-col mb-4 ${errorVoice ? 'gap-y-2' : 'gap-y-4'}`}>
				<label
					className={`w-full rounded flex justify-between items-center p-2 ${errorVoice ? 'bg-transparent opacity-80' : 'dark:bg-[#2B2D31] bg-bgLightModeButton'}`}
					htmlFor="Speaker"
				>
					<div className="flex items-center gap-x-2">
						<Icons.Speaker />
						<div>
							<h4 className={`font-semibold ${choiceSpeaker ? 'dark:text-white text-black' : 'text-slate-400'}`}>Voice Channel</h4>
							<p className={choiceSpeaker ? 'dark:text-white text-black' : 'text-slate-400'}>
								Hang out with voice, video, Screen Share and Go Live.
							</p>
						</div>
					</div>
					<input
						checked={choiceSpeaker}
						onChange={voicesChannel.length > 0 ? () => handleOption(OptionEvent.OPTION_SPEAKER) : () => {}}
						type="radio"
						className="relative disabled:bg-slate-500  float-left -ml-[1.5rem] mr-1 mt-0.5 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
						value="Speaker"
						id="Speaker"
					/>
				</label>
				<label className="w-full dark:bg-[#2B2D31] bg-bgLightModeButton rounded flex justify-between items-center p-2" htmlFor="Hashtag">
					<div className="flex items-center gap-x-2">
						<Icons.Location />
						<div>
							<h4 className={`font-semibold ${choiceLocation ? 'dark:text-white text-black' : 'text-slate-400'}`}>Somewhere Else</h4>
							<p className={choiceLocation ? 'dark:text-white text-black' : 'text-slate-400'}>
								Text channel, external link or in-person location.
							</p>
						</div>
					</div>
					<input
						checked={choiceLocation}
						onChange={() => handleOption(OptionEvent.OPTION_LOCATION)}
						type="radio"
						className="relative disabled:bg-slate-500  float-left -ml-[1.5rem] mr-1 mt-0.5 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
						value="Hashtag"
						id="Hashtag"
					/>
				</label>
			</div>

			{choiceSpeaker && (
				<Select
					options={options}
					value={options.find((option) => option.value === contentSubmit.voiceChannel)}
					onChange={handleChangeVoice}
					styles={appearanceTheme === 'dark' ? customStyles : lightCustomStyles}
				/>
			)}

			{choiceLocation && (
				<div>
					<h3 className="uppercase text-[11px] font-semibold dark:text-white text-black ">Enter a location</h3>
					<input
						type="text"
						name="location"
						value={contentSubmit.titleEvent}
						onChange={onChangeTitle}
						placeholder="Add a location, link or something."
						className={`font-[400] rounded w-full dark:text-white text-black outline-none text-[15px]border border-black px-4 py-3 focus:outline-none focus:border-white-500 dark:bg-black bg-bgModifierHoverLight ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
					/>
				</div>
			)}
			<div className="flex flex-col mb-4 mt-3">
				<h3 className="text-xl text-center font-semibold dark:text-white text-black ">Who are audiences?</h3>
				<p className="text-slate-400 text-center">Choose members in the specified channel.</p>
			</div>

			<Select
				options={optionsTextChannel}
				value={optionsTextChannel.find((option) => option.value === contentSubmit.textChannel)}
				onChange={handleChangeVoice}
				styles={appearanceTheme === 'dark' ? customStyles : lightCustomStyles}
			/>
		</div>
	);
};

export default LocationModal;
