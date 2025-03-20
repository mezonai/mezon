import { useAppNavigation, useEscapeKeyClose } from '@mezon/core';
import {
	channelsActions,
	createNewChannel,
	selectChannelById,
	selectCurrentCategory,
	selectCurrentClan,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { AlertTitleTextWarning, Icons } from '@mezon/ui';
import { ValidateURL } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { ApiCreateChannelDescRequest } from 'mezon-js/api.gen';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChannelLableModal } from './ChannelLabel';
import { ChannelNameModalRef, ChannelNameTextField } from './ChannelNameTextField';
import { ChannelStatusModal } from './ChannelStatus';
import { ChannelTypeComponent } from './ChannelType';
import { CreateChannelButton } from './CreateChannelButton';

import { Dropdown } from 'flowbite-react';
import React from 'react';

export const CreateNewChannelModal = () => {
	const dispatch = useAppDispatch();
	const InputRef = useRef<ChannelNameModalRef>(null);
	const appUrlInputRef = useRef<ChannelAppUrlModalRef>(null);
	const [isInputError, setIsInputError] = useState<boolean>(true);
	const currentClan = useSelector(selectCurrentClan);
	const currentCategory = useAppSelector((state) => selectCurrentCategory(state));
	const [validate, setValidate] = useState(true);
	const [validateUrl, setValidateUrl] = useState(true);
	const [channelName, setChannelName] = useState<string>('');
	const [appUrl, setAppUrl] = useState<string>('');
	const [isErrorType, setIsErrorType] = useState<string>('');
	const [isErrorName, setIsErrorName] = useState<string>('');
	const [isErrorAppUrl, setIsErrorAppUrl] = useState<string>('');
	const [isPrivate, setIsPrivate] = useState<number>(0);
	const [channelType, setChannelType] = useState<number>(-1);
	const [channelTypeVoice, setChannelTypeVoice] = useState<number>(ChannelType.CHANNEL_TYPE_MEZON_VOICE);
	const navigate = useNavigate();
	const { toChannelPage } = useAppNavigation();
	const isAppChannel = channelType === ChannelType.CHANNEL_TYPE_APP;
	const channelWelcome = useAppSelector((state) => selectChannelById(state, currentClan?.welcome_channel_id as string)) || {};

	const handleSubmit = async () => {
		if (channelType === -1) {
			setIsErrorType("Channel's type is required");
			return;
		}
		if (channelName === '') {
			setIsErrorName("Channel's name is required");
			return;
		}

		if (isAppChannel && appUrl === '') {
			setIsErrorAppUrl("Channel's app url is required");
			return;
		}

		if (isAppChannel && !validateUrl) {
			setIsErrorAppUrl('Please enter a valid channel app url');
			return;
		}

		if (!validate) {
			setIsErrorName('Please enter a valid channel name');
			return;
		}

		const body: ApiCreateChannelDescRequest = {
			clan_id: currentClan?.clan_id,
			type: channelType,
			channel_label: channelName,
			channel_private: isPrivate,
			category_id: currentCategory?.category_id || channelWelcome?.category_id,
			...(isAppChannel && { app_url: appUrl }),
			parent_id: '0'
		};

		const newChannelCreatedId = await dispatch(createNewChannel(body));
		const payload = newChannelCreatedId.payload as ApiCreateChannelDescRequest;
		const channelID = payload.channel_id;
		const typeChannel = payload.type;

		if (
			newChannelCreatedId &&
			typeChannel !== ChannelType.CHANNEL_TYPE_MEZON_VOICE &&
			typeChannel !== ChannelType.CHANNEL_TYPE_GMEET_VOICE &&
			typeChannel !== ChannelType.CHANNEL_TYPE_STREAMING
		) {
			const channelPath = toChannelPage(channelID ?? '', currentClan?.clan_id ?? '');
			navigate(channelPath);
		}
		clearDataAfterCreateNew();
	};

	const handleCloseModal = () => {
		setIsErrorType('');
		setIsErrorName('');
		setIsErrorAppUrl('');
		clearDataAfterCreateNew();
		dispatch(channelsActions.openCreateNewModalChannel({ clanId: currentClan?.clan_id as string, isOpen: false }));
	};

	const handleChannelNameChange = (value: string) => {
		setIsErrorName('');
		setChannelName(value);
	};

	const handleAppUrlChannge = (value: string) => {
		setIsErrorAppUrl('');
		setAppUrl(value);
	};

	const checkValidate = (check: boolean) => {
		setValidate(check);
	};

	const checkValidateUrl = (check: boolean) => {
		setValidateUrl(check);
	};

	const onChangeChannelType = (value: number) => {
		setIsErrorType('');
		setChannelType(value);
	};

	const onChangeChannelTypeVoice = (value: number) => {
		setChannelTypeVoice(value);
		setChannelType(value);
	};

	const onChangeToggle = (value: number) => {
		setIsPrivate(value);
	};

	const clearDataAfterCreateNew = () => {
		setChannelName('');
		setAppUrl('');
		setChannelType(-1);
		setChannelTypeVoice(ChannelType.CHANNEL_TYPE_MEZON_VOICE);
		setIsPrivate(0);
	};

	const handleChangeValue = useCallback(() => {
		const isValid = InputRef.current?.checkInput() ?? false;
		const isAppUrlValid = appUrlInputRef.current?.checkInput() ?? false;

		if (channelType === ChannelType.CHANNEL_TYPE_APP) {
			const isInputError = isValid || isAppUrlValid;
			setIsInputError(isInputError);
		} else {
			setIsInputError(isValid);
		}
	}, [channelType]);

	const modalRef = useRef<HTMLDivElement>(null);
	const handleClose = useCallback(() => {
		dispatch(channelsActions.openCreateNewModalChannel({ clanId: currentClan?.clan_id as string, isOpen: false }));
	}, []);
	useEscapeKeyClose(modalRef, handleClose);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div
				className={`z-60 w-full h-full sm:w-4/5 sm:max-h-[630px] md:w-[684px] dark:bg-bgPrimary bg-bgLightModeSecond rounded-2xl flex-col justify-start  items-start gap-3 inline-flex relative shadow-lg`}
			>
				<div className="self-stretch flex-col justify-start items-start flex">
					<div className="self-stretch px-5 pt-8 flex-col justify-start items-start gap-3 flex">
						<div className="self-stretch h-14 flex-col justify-center items-start gap-1 flex">
							<div className="flex flex-col items-start gap-x-2 sm:flex-row sm:items-center w-full relative">
								<ChannelLableModal labelProp="CREATE A NEW CHANNEL IN" />
								<span>
									<p className="self-stretch  text-sm font-bold leading-normal uppercase text-cyan-500">
										{currentCategory?.category_name || channelWelcome?.category_name}
									</p>
								</span>
								<div className="absolute right-1 top-[-10px]">
									<button onClick={handleCloseModal} className="hover:text-[#ffffff]">
										<Icons.Close />
									</button>
								</div>
							</div>

							<div className=" dark:text-zinc-400 text-colorTextLightMode text-sm">Kindly set up a channel of your choice.</div>
						</div>
						<div className={`flex flex-col gap-3 w-full max-h-[430px] pr-2 overflow-y-scroll`}>
							<div className="Frame407 self-stretch flex-col items-center gap-2 flex">
								<ChannelLableModal labelProp="Choose channel's type:" />
								<div className="Frame405 self-stretch  flex-col justify-start items-start gap-2 flex sm:max-h-[200px] lg:h-fit lg:max-h-fit overflow-y-scroll max-xl:h-auto">
									<ChannelTypeComponent
										type={ChannelType.CHANNEL_TYPE_CHANNEL}
										onChange={onChangeChannelType}
										error={isErrorType}
									/>
									<ChannelTypeComponent
										disable={false}
										type={channelTypeVoice}
										onChange={onChangeChannelType}
										error={isErrorType}
									/>
									{/* <ChannelTypeComponent
										disable={true}
										type={ChannelType.CHANNEL_TYPE_FORUM}
										onChange={onChangeChannelType}
										error={isErrorType}
									/> */}
									<ChannelTypeComponent
										disable={false}
										type={ChannelType.CHANNEL_TYPE_STREAMING}
										onChange={onChangeChannelType}
										error={isErrorType}
									/>
									<ChannelTypeComponent
										disable={false}
										type={ChannelType.CHANNEL_TYPE_APP}
										onChange={onChangeChannelType}
										error={isErrorType}
									/>
								</div>
							</div>
							<ChannelNameTextField
								ref={InputRef}
								onChange={handleChannelNameChange}
								onCheckValidate={checkValidate}
								type={channelType}
								channelNameProps="What is channel's name?"
								error={isErrorName}
								onHandleChangeValue={handleChangeValue}
								placeholder={"Enter the channel's name"}
								shouldValidate={true}
								categoryId={currentCategory?.category_id || channelWelcome?.category_id}
							/>
							{channelType === ChannelType.CHANNEL_TYPE_APP && (
								<div className={'mt-2 w-full'}>
									<ChannelAppUrlTextField
										ref={appUrlInputRef}
										onChange={handleAppUrlChannge}
										onCheckValidate={checkValidateUrl}
										onHandleChangeValue={handleChangeValue}
										channelAppUrlProps="What is app's URL?"
										error={isErrorAppUrl}
										placeholder={"Enter the app's URL"}
										shouldValidate={true}
									/>
								</div>
							)}
							{channelType === channelTypeVoice && (
								<div className={'mt-2 w-full'}>
									<ChannelVoicePlatformField
										onChange={onChangeChannelTypeVoice}
										channelVoicePlatformProp="Choose meeting platform:"
										channelTypeVoiceProp={channelTypeVoice}
									/>
								</div>
							)}
							{channelType !== ChannelType.CHANNEL_TYPE_GMEET_VOICE &&
								channelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE &&
								channelType !== ChannelType.CHANNEL_TYPE_STREAMING && (
									<ChannelStatusModal onChangeValue={onChangeToggle} channelNameProps="Is private channel?" />
								)}
						</div>
					</div>
				</div>
				<CreateChannelButton onClickCancel={handleCloseModal} onClickCreate={handleSubmit} checkInputError={isInputError} />
			</div>
			{isErrorType !== '' && <AlertTitleTextWarning description={isErrorType} />}
			{isErrorName !== '' && <AlertTitleTextWarning description={isErrorName} />}
			{isAppChannel && isErrorAppUrl !== '' && <AlertTitleTextWarning description={isErrorAppUrl} />}
		</div>
	);
};

interface ChannelAppUrlModalProps {
	channelAppUrlProps: string;
	onChange: (value: string) => void;
	onCheckValidate?: (check: boolean) => void;
	onHandleChangeValue?: () => void;
	error?: string;
	placeholder: string;
	shouldValidate: boolean;
}

type ChannelAppUrlModalRef = {
	checkInput: () => boolean;
};

const ChannelAppUrlTextField = forwardRef<ChannelAppUrlModalRef, ChannelAppUrlModalProps>((props, ref) => {
	const { channelAppUrlProps, onChange, onCheckValidate, onHandleChangeValue, error, placeholder, shouldValidate } = props;
	const [checkValidate, setCheckValidate] = useState(true);
	const [checkAppUrlChannel, setCheckAppUrlChannel] = useState(true);
	const theme = useAppSelector(selectTheme);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			onChange(value);
			if (value === '') {
				setCheckAppUrlChannel(true);
			} else {
				setCheckAppUrlChannel(false);
			}

			const regex = ValidateURL();
			if (regex.test(value)) {
				setCheckValidate(false);
				if (onCheckValidate) {
					onCheckValidate(true);
				}
			} else {
				setCheckValidate(true);
				if (onCheckValidate) {
					onCheckValidate(false);
				}
			}
		},
		[onChange, setCheckValidate, onCheckValidate]
	);
	useImperativeHandle(ref, () => ({
		checkInput: () => checkValidate || checkAppUrlChannel
	}));

	useEffect(() => {
		if (onHandleChangeValue) {
			onHandleChangeValue();
		}
	}, [checkValidate, checkAppUrlChannel, onHandleChangeValue]);

	return (
		<div className="Frame408 self-stretch flex-col justify-start items-start gap-2 flex mt-1">
			<ChannelLableModal labelProp={channelAppUrlProps} />
			<div className="ContentContainer self-stretch h-11 flex-col items-start flex">
				<div
					className={`InputContainer self-stretch h-11 px-4 py-3 dark:bg-neutral-950 bg-white rounded shadow border w-full ${error ? 'border border-red-500' : 'border-blue-600'}  justify-start items-center gap-2 inline-flex`}
				>
					<Icons.AppChannelIcon className="w-6 h-6" fill={theme} />
					<div className="InputValue grow shrink basis-0 self-stretch justify-start items-center flex">
						<input
							className="Input grow shrink basis-0 h-10 outline-none dark:bg-neutral-950 bg-white dark:text-white text-black text-sm font-normal placeholder-[#AEAEAE]"
							onChange={handleInputChange}
							placeholder={placeholder}
						/>
					</div>
				</div>
			</div>
			{shouldValidate && (checkValidate || checkAppUrlChannel) ? (
				<p className="text-[#e44141] text-xs italic font-thin">Please enter a valid URL (e.g., https://example.com).</p>
			) : null}
		</div>
	);
});

interface ChannelVoicePlatformModalProps {
	channelVoicePlatformProp: string;
	onChange: (value: number) => void;
	channelTypeVoiceProp: number;
}

const ChannelVoicePlatformField: React.FC<ChannelVoicePlatformModalProps> = ({ channelVoicePlatformProp, onChange, channelTypeVoiceProp }) => {
	const options = [
		{ label: 'Mezon Meet', value: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
		{ label: 'Google Meet', value: ChannelType.CHANNEL_TYPE_GMEET_VOICE }
	];

	const handleSelectPlatform = (value: number) => {
		onChange(value);
	};

	const getSelectedLabel = () => {
		const selectedOption = options.find((option) => option.value === channelTypeVoiceProp);
		return selectedOption?.label;
	};

	return (
		<div className="Frame408 self-stretch flex-col justify-start items-start gap-2 flex mt-1">
			<ChannelLableModal labelProp={channelVoicePlatformProp} />
			<Dropdown
				placement={'bottom-start'}
				label={''}
				renderTrigger={() => (
					<div className="w-full h-10 rounded-md flex flex-row p-3 justify-between items-center uppercase text-sm dark:bg-bgInputDark bg-bgLightModeThird border dark:text-textPrimary text-textPrimaryLight">
						<div className={'dark:text-textPrimary text-textPrimary400 flex flex-row items-center'}>
							<p>{getSelectedLabel()}</p>
						</div>
						<div>
							<Icons.ArrowDownFill />
						</div>
					</div>
				)}
				className={'h-fit max-h-[200px] text-xs overflow-y-scroll customSmallScrollLightMode dark:bg-bgTertiary px-2 z-20'}
			>
				{options.map(({ label, value }) => (
					<Dropdown.Item
						key={value}
						className="flex flex-row items-center dark:text-textPrimary text-textPrimaryLight rounded-sm dark:hover:bg-bgModifierHover hover:bg-bgIconDark text-sm w-full py-2 px-4 text-left cursor-pointer"
						onClick={() => handleSelectPlatform(value)}
					>
						<p className="uppercase dark:text-textSecondary text-textSecondary800 font-semibold">{label}</p>
					</Dropdown.Item>
				))}
			</Dropdown>
		</div>
	);
};
