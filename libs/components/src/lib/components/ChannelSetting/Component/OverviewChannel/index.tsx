import {
	channelsActions,
	ChannelsEntity,
	checkDuplicateChannelInCategory,
	checkDuplicateThread,
	fetchSystemMessageByClanId,
	IUpdateChannelRequest,
	IUpdateSystemMessage,
	selectAppChannelById,
	selectChannelById,
	selectClanSystemMessage,
	selectTheme,
	updateSystemMessage,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons, Image, InputField, TextArea } from '@mezon/ui';
import { checkIsThread, IChannel, ValidateSpecialCharacters, ValidateURL } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { ModalSaveChanges } from 'libs/components/src/lib/components';
import Dropdown from 'libs/ui/src/lib/DropDown';
import { ChannelType } from 'mezon-js';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';

export type OverviewChannelProps = {
	channel: IChannel;
	onDisplayLabelChange?: (label: string) => void;
};

const OverviewChannel = (props: OverviewChannelProps) => {
	const { channel, onDisplayLabelChange } = props;
	const appearanceTheme = useSelector(selectTheme);

	const channelId = (channel?.channel_id || (channel as any)?.id || '') as string;
	const currentChannel = useAppSelector((state) => selectChannelById(state, channelId));

	const channelApp = useAppSelector((state) => selectAppChannelById(state, channelId));

	const [appUrlInit, setAppUrlInit] = useState(channelApp?.app_url || '');
	const [appUrl, setAppUrl] = useState(appUrlInit);
	const dispatch = useAppDispatch();
	const [channelLabelInit, setChannelLabelInit] = useState(currentChannel.channel_label || '');
	const [topicInit, setTopicInit] = useState(currentChannel.topic);
	const [ageRestrictedInit, setAgeRestrictedInit] = useState(currentChannel.age_restricted);
	const [e2eeInit, setE2eeInit] = useState(currentChannel.e2ee);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const [topic, setTopic] = useState(topicInit);
	const [channelLabel, setChannelLabel] = useState(channelLabelInit);
	const [checkValidate, setCheckValidate] = useState('');
	const [checkValidateUrl, setCheckValidateUrl] = useState(!ValidateURL().test(appUrlInit || ''));
	const [countCharacterTopic, setCountCharacterTopic] = useState(1024);
	const isThread = checkIsThread(currentChannel as ChannelsEntity);
	const [isAgeRestricted, setIsAgeRestricted] = useState(ageRestrictedInit);
	const [isE2ee, setIsE2ee] = useState(e2eeInit);

	const fetchSystemMessage = async () => {
		if (!currentChannel.clan_id) return;
		await dispatch(fetchSystemMessageByClanId({ clanId: currentChannel.clan_id }));
	};

	useEffect(() => {
		fetchSystemMessage();
	}, [currentChannel.channel_id]);
	useEffect(() => {
		if (!currentChannel) return;
		setChannelLabelInit(currentChannel.channel_label || '');
		setChannelLabel(currentChannel.channel_label || '');
		setTopicInit(currentChannel.topic);
		setTopic(currentChannel.topic);
		setAgeRestrictedInit(currentChannel.age_restricted);
		setIsAgeRestricted(currentChannel.age_restricted);
		setE2eeInit(currentChannel.e2ee);
		setIsE2ee(currentChannel.e2ee);
	}, [currentChannel?.channel_id, currentChannel?.channel_label, currentChannel?.topic, currentChannel?.age_restricted, currentChannel?.e2ee]);

	const handleCheckboxAgeRestricted = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setIsAgeRestricted(checked ? 1 : 0);
	};

	const handleCheckboxE2ee = (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setIsE2ee(checked ? 1 : 0);
	};

	const [isCheckForSystemMsg, setIsCheckForSystemMsg] = useState(false);
	const currentSystemMessage = useSelector(selectClanSystemMessage);
	const thisIsSystemMessageChannel = useMemo(() => {
		return currentChannel.channel_id === currentSystemMessage;
	}, [currentChannel.channel_id, currentSystemMessage]);

	const label = useMemo(() => {
		return isThread ? 'thread' : 'channel';
	}, [isThread]);

	const parentLabel = useMemo(() => {
		return isThread ? 'channel' : 'category';
	}, [isThread]);

	const messages = {
		INVALID_NAME: `Please enter a valid ${label} name (max 64 characters, only words, numbers, _ or -).`,
		DUPLICATE_NAME: `The ${label}  name already exists in the ${parentLabel} . Please enter another name.`,
		INVALID_URL: `Please enter a valid URL (e.g., https://example.com).`
	};

	const handleChangeTextArea = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setTopic(e.target.value);
			setCountCharacterTopic(1024 - e.target.value.length);
		},
		[topic, countCharacterTopic]
	);

	const debouncedSetChannelName = useDebouncedCallback(async (value: string) => {
		if (channelLabelInit && value.trim() === channelLabelInit.trim()) {
			setCheckValidate('');
			return;
		}

		const regex = ValidateSpecialCharacters();
		if (regex.test(value)) {
			const checkDuplicate = async (checkFunction: any, payload: any) => {
				await dispatch(checkFunction(payload))
					.then(unwrapResult)
					.then((result: any) => {
						if (result) {
							setCheckValidate(messages.DUPLICATE_NAME);
							return;
						}
						setCheckValidate('');
					});
			};

			if (isThread) {
				await checkDuplicate(checkDuplicateThread, {
					thread_name: value.trim(),
					channel_id: currentChannel.parent_id ?? ''
				});
			} else {
				await checkDuplicate(checkDuplicateChannelInCategory, {
					channelName: value.trim(),
					categoryId: currentChannel.category_id ?? ''
				});
			}
			return;
		}

		setCheckValidate(messages.INVALID_NAME);
	}, 300);

	const handleDisplayChannelLabel = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setChannelLabel(value);
			onDisplayLabelChange?.(value);
			debouncedSetChannelName(value);
		},
		[debouncedSetChannelName, onDisplayLabelChange]
	);

	const handleDisplayAppUrl = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setAppUrl(value);
			const regex = ValidateURL();
			if (regex.test(value) && value !== '') {
				setCheckValidateUrl(false);
			} else {
				setCheckValidateUrl(true);
			}
		},
		[appUrl, checkValidateUrl]
	);

	const handleReset = useCallback(() => {
		setTopic(topicInit);
		setChannelLabel(channelLabelInit);
		setAppUrl(appUrlInit);
		setIsCheckForSystemMsg(false);
		setIsAgeRestricted(ageRestrictedInit);
		setIsE2ee(e2eeInit);
	}, [topicInit, channelLabelInit, appUrlInit, ageRestrictedInit, e2eeInit]);

	const handleSave = useCallback(async () => {
		const updatedChannelLabel = channelLabel === channelLabelInit ? '' : channelLabel;
		const updatedAppUrl = appUrl === appUrlInit ? '' : appUrl;

		if (isCheckForSystemMsg) {
			const request: IUpdateSystemMessage = {
				clanId: currentChannel.clan_id as string,
				newMessage: {
					channel_id: currentChannel.channel_id,
					boost_message: currentSystemMessage.boost_message,
					setup_tips: currentSystemMessage.setup_tips,
					welcome_random: currentSystemMessage.welcome_random,
					welcome_sticker: currentSystemMessage.welcome_sticker
				}
			};
			await dispatch(updateSystemMessage(request));
			setIsCheckForSystemMsg(false);
		}

		setChannelLabelInit(channelLabel);
		setAppUrlInit(appUrl);
		setTopicInit(topic);
		setAgeRestrictedInit(isAgeRestricted);
		setE2eeInit(isE2ee);

		const updateChannel = {
			channel_id: currentChannel.channel_id || '',
			channel_label: updatedChannelLabel,
			category_id: currentChannel.category_id,
			app_url: updatedAppUrl,
			app_id: currentChannel.app_id || '',
			topic: topic,
			age_restricted: isAgeRestricted,
			e2ee: isE2ee,
			parent_id: currentChannel?.parent_id,
			channel_private: currentChannel?.channel_private
		} as IUpdateChannelRequest;
		await dispatch(channelsActions.updateChannel(updateChannel));
	}, [channelLabel, channelLabelInit, appUrl, appUrlInit, topic, currentChannel, isCheckForSystemMsg, dispatch, isAgeRestricted, isE2ee]);

	useEffect(() => {
		const textArea = textAreaRef.current;
		if (textArea) {
			textArea.style.height = 'auto';
			textArea.style.height = textArea.scrollHeight + 'px';
		}
	}, [topic]);

	const slowModeValues = [
		'Off',
		'5 seconds',
		'10 seconds',
		'15 seconds',
		'30 seconds',
		'1 minute',
		'2 minutes',
		'5 minutes',
		'10 minutes',
		'15 minutes',
		'30 minutes',
		'1 hour',
		'2 hours',
		'6 hours'
	];

	const [slowModeDropdown, setSlowDropdown] = useState(slowModeValues[0]);
	const hideInactivityTimes = ['1 Hour', '24 Hours', '3 Days', '1 Week'];
	const [hideTimeDropdown, setHideTimeDropdown] = useState(hideInactivityTimes[2]);

	const hasChange = useMemo(() => {
		return (
			(channelLabelInit !== channelLabel ||
				appUrlInit !== appUrl ||
				topicInit !== topic ||
				ageRestrictedInit !== isAgeRestricted ||
				e2eeInit !== isE2ee ||
				isCheckForSystemMsg) &&
			!checkValidate &&
			(!appUrl || !checkValidateUrl)
		);
	}, [
		channelLabelInit,
		channelLabel,
		appUrlInit,
		appUrl,
		topicInit,
		topic,
		checkValidate,
		checkValidateUrl,
		isCheckForSystemMsg,
		ageRestrictedInit,
		isAgeRestricted,
		e2eeInit,
		isE2ee
	]);

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink  w-1/2 pt-[94px] sbm:pb-7 text-theme-primary bg-theme-setting-primary sbm:pr-[10px] sbm:pl-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<div className=" text-[15px]">
				<h3 className="mb-4 font-bold text-xl text-theme-primary-active">Overview</h3>
				<p className="text-xs font-bold uppercase mb-2">{label} name</p>
				<InputField
					type="text"
					placeholder={channelLabel}
					value={channelLabel}
					onChange={handleDisplayChannelLabel}
					className="pl-3 border-theme-primary bg-input-secondary  py-2 w-full  outline-none rounded-lg"
					maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
				/>
				{checkValidate && <p className="text-[#e44141] text-xs italic font-thin">{checkValidate}</p>}

				{channel.type === ChannelType.CHANNEL_TYPE_APP && (
					<>
						<hr className="border-t-theme-primary my-10" />
						<p className="text-xs font-bold uppercase mb-2">App URL</p>
						<InputField
							disabled={true}
							type="text"
							placeholder={appUrl}
							value={appUrl}
							onChange={handleDisplayAppUrl}
							className="pl-3 py-2 w-full border-theme-primary outline-none rounded-lg bg-input-secondary"
						/>
						{checkValidateUrl && <p className="text-[#e44141] text-xs italic font-thin">{messages.INVALID_URL}</p>}
					</>
				)}

				<hr className="border-t-theme-primary my-10" />
				<p className="text-xs font-bold  uppercase mb-2">{label} Topic</p>
				<div className="relative">
					<TextArea
						placeholder={`Let everyone know how to use this ${label}!`}
						className="resize-none bg-theme-input h-auto min-h-[87px] w-full overflow-y-hidden outline-none py-2 pl-3 pr-5 border-theme-primary"
						value={topic}
						onChange={handleChangeTextArea}
						rows={1}
						refTextArea={textAreaRef}
						maxLength={1024}
					></TextArea>
					<p className="absolute bottom-2 right-2 ">{countCharacterTopic}</p>
				</div>
				<BottomBlock
					slowModeDropdown={slowModeDropdown}
					setSlowDropdown={setSlowDropdown}
					slowModeValues={slowModeValues}
					appearanceTheme={appearanceTheme}
					hideInactivityTimes={hideInactivityTimes}
					hideTimeDropdown={hideTimeDropdown}
					setHideTimeDropdown={setHideTimeDropdown}
					isCheckForSystemMsg={isCheckForSystemMsg}
					setIsCheckForSystemMsg={setIsCheckForSystemMsg}
					thisIsSystemMessageChannel={thisIsSystemMessageChannel}
					handleCheckboxAgeRestricted={handleCheckboxAgeRestricted}
					handleCheckboxE2ee={handleCheckboxE2ee}
					isAgeRestricted={isAgeRestricted || 0}
					isE2ee={isE2ee || 0}
				/>
			</div>
			{hasChange && <ModalSaveChanges onReset={handleReset} onSave={handleSave} />}
		</div>
	);
};

interface IBottomBlockProps {
	slowModeValues: string[];
	appearanceTheme?: string;
	slowModeDropdown: string;
	setSlowDropdown: (value: string) => void;
	hideInactivityTimes: string[];
	hideTimeDropdown: string;
	setHideTimeDropdown: (value: string) => void;
	handleCheckboxAgeRestricted: (event: React.ChangeEvent<HTMLInputElement>) => void;
	handleCheckboxE2ee: (event: React.ChangeEvent<HTMLInputElement>) => void;
	isAgeRestricted: number;
	isE2ee: number;
	isCheckForSystemMsg: boolean;
	setIsCheckForSystemMsg: (value: boolean) => void;
	thisIsSystemMessageChannel: boolean;
}

const BottomBlock = ({
	slowModeValues,
	appearanceTheme,
	slowModeDropdown,
	setSlowDropdown,
	hideInactivityTimes,
	hideTimeDropdown,
	setHideTimeDropdown,
	handleCheckboxAgeRestricted,
	handleCheckboxE2ee,
	isAgeRestricted,
	isE2ee,
	isCheckForSystemMsg,
	setIsCheckForSystemMsg,
	thisIsSystemMessageChannel
}: IBottomBlockProps) => {
	const logoImgSrc = useMemo(() => {
		if (appearanceTheme === 'light') {
			return 'assets/images/channel_setting_logo_light.svg';
		}
		return 'assets/images/channel_setting_logo_dark.svg';
	}, [appearanceTheme]);

	const menu = useMemo(() => {
		const menuItems: ReactElement[] = [];

		hideInactivityTimes.map((item, index) => {
			menuItems.push(
				<Dropdown.Item
					key={index}
					onClick={() => {
						setHideTimeDropdown(item);
					}}
					className="truncate !bg-var(--theme-setting-nav) bg-item-hover"
				>
					{item}
				</Dropdown.Item>
			);
		});
		return <>{menuItems}</>;
	}, []);
	return (
		<div className="flex flex-col gap-10 mt-10 text-sm text-colorTextLightMode dark:text-textPrimary">
			<hr className="border-t border-solid dark:border-borderDivider" />
			<div className="flex flex-col gap-3">
				<div className="flex justify-between">
					<div className="font-semibold text-base text-theme-primary">Age-Restricted Channel</div>
					<input
						className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
						bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
						after:bg-slate-500 after:transition-all
						checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
						hover:bg-slate-400 after:hover:bg-slate-600
						checked:hover:bg-[#4654C0] checked:after:hover:bg-white
						focus:outline-none checked:focus:bg-[#4654C0] checked:after:focus:bg-white
						focus-visible:outline-none disabled:cursor-not-allowed
						disabled:bg-slate-200 disabled:after:bg-slate-300"
						type="checkbox"
						checked={isAgeRestricted === 1}
						onChange={handleCheckboxAgeRestricted}
					/>
				</div>
				<div className="text-theme-primary">
					Users will need to confirm they are of legal age to view the content in this channel. Age-restricted channels are exempt from the
					explicit content filter.
				</div>
			</div>

			<hr className="border-t border-solid dark:border-borderDivider" />
			<div className="flex flex-col gap-2">
				<div className="text-xs font-bold text-theme-primary">Hide After Inactivity</div>
				<div className="w-full relative">
					<Dropdown menu={menu} className="text-theme-message bg-input-secondary rounded-md">
						<div className="w-full h-[50px] rounded-md border-theme-primary text-theme-message bg-input-secondary flex flex-row px-3 justify-between items-center">
							<p className="truncate max-w-[90%]">{hideTimeDropdown}</p>
							<div>
								<Icons.ArrowDownFill />
							</div>
						</div>
					</Dropdown>
				</div>
				<div className="text-theme-primary">
					New threads will not show in the channel list after being inactive for the specified duration.
				</div>
			</div>
			<div className="flex justify-center pb-10">
				<Image src={logoImgSrc} width={48} height={48} className="object-cover w-[280px]" />
			</div>
		</div>
	);
};

export default OverviewChannel;
