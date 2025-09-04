import { Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import React from 'react';
interface ChannelTypeProps {
	type: ChannelType;
	onChange: (value: number) => void;
	error?: string;
	disable?: boolean;
	dataE2E?: string;
}

const labelMap: Partial<Record<ChannelType, string>> = {
	[ChannelType.CHANNEL_TYPE_CHANNEL]: 'Text',
	[ChannelType.CHANNEL_TYPE_GMEET_VOICE]: 'Voice',
	[ChannelType.CHANNEL_TYPE_MEZON_VOICE]: 'Voice',
	[ChannelType.CHANNEL_TYPE_FORUM]: 'Forum',
	[ChannelType.CHANNEL_TYPE_ANNOUNCEMENT]: 'Announcement',
	[ChannelType.CHANNEL_TYPE_APP]: 'Apps',
	[ChannelType.CHANNEL_TYPE_STREAMING]: 'Stream',
	// 2 lines below only get index
	[ChannelType.CHANNEL_TYPE_DM]: '',
	[ChannelType.CHANNEL_TYPE_GROUP]: ''
};

const descriptionMap: Partial<Record<ChannelType, string>> = {
	[ChannelType.CHANNEL_TYPE_CHANNEL]: 'Send messages, images, GIFs, emoji, opinions, and puns',
	[ChannelType.CHANNEL_TYPE_GMEET_VOICE]: 'Hang out together with voice, video, and screen share',
	[ChannelType.CHANNEL_TYPE_MEZON_VOICE]: 'Hang out together with voice, video, and screen share',
	[ChannelType.CHANNEL_TYPE_FORUM]: 'Create a space for organized discussions',
	[ChannelType.CHANNEL_TYPE_ANNOUNCEMENT]: 'Important updates for people in and out of the clan',
	[ChannelType.CHANNEL_TYPE_APP]: 'Apps',
	[ChannelType.CHANNEL_TYPE_STREAMING]: 'Sharing hobbies activity',
	// 2 lines below only get index
	[ChannelType.CHANNEL_TYPE_DM]: '',
	[ChannelType.CHANNEL_TYPE_GROUP]: ''
};

export const ChannelTypeComponent: React.FC<ChannelTypeProps> = ({ type, onChange, error, disable, dataE2E }) => {
	const iconMap: Partial<Record<ChannelType, JSX.Element>> = {
		[ChannelType.CHANNEL_TYPE_CHANNEL]: <Icons.Hashtag defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_GMEET_VOICE]: <Icons.Speaker defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_MEZON_VOICE]: <Icons.Speaker defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_FORUM]: <Icons.Forum defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_ANNOUNCEMENT]: <Icons.Announcement defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_STREAMING]: <Icons.Stream defaultSize="w-6 h-6" />,
		// 2 lines below only get index
		[ChannelType.CHANNEL_TYPE_DM]: <Icons.Hashtag defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_GROUP]: <Icons.Hashtag defaultSize="w-6 h-6" />,
		[ChannelType.CHANNEL_TYPE_APP]: <Icons.AppChannelIcon className="w-6 h-6" />
	};

	const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(Number(e.target.value));
	};

	return (
		<label
			className={`Frame403 self-stretch px-2 py-2 bg-item-theme rounded-lg justify-center items-center gap-4  inline-flex ${disable ? 'hover:bg-none hover:cursor-not-allowed' : 'bg-item-hover text-theme-primary-hover hover:cursor-pointer'}  ${error ? 'border border-red-500' : ' border border-none'}`}
			htmlFor={type?.toString()}
			data-e2e={dataE2E}
		>
			<div className={type === ChannelType.CHANNEL_TYPE_CHANNEL ? 'w-6 h-9' : 'w-6 h-6'}>{iconMap[type]}</div>
			<div className="Frame402 grow shrink basis-0 flex-col justify-start items-start gap-1 inline-flex ">
				<div className="Text self-stretch text-sm font-bold leading-normal text-[10px]">
					<p className="">{labelMap[type]}</p>
				</div>
				<div className="SendMessagesImagesGifsEmojiOpinionsAndPuns self-stretch text-sm font-normal leading-[18.20px] text-[10px] w-widthChannelTypeText">
					<p className="one-line ">{descriptionMap[type]}</p>
				</div>
			</div>
			<div className={`RadioButton p-0.5 justify-start items-start flex `}>
				<div className="relative flex items-center">
					<input
						disabled={disable}
						className="relative disabled:bg-slate-500  float-left -ml-[1.5rem] mr-1 mt-0.5 h-5 w-5 appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-primary checked:after:bg-primary checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] dark:border-neutral-600 dark:checked:border-primary dark:checked:after:border-primary dark:checked:after:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:border-primary dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
						type="radio"
						value={type}
						id={type.toString()}
						name="drone"
						onChange={onValueChange}
					/>
				</div>
			</div>
		</label>
	);
};
