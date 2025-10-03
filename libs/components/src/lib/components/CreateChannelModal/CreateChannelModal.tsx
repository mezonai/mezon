import { useAppNavigation, useEscapeKeyClose } from '@mezon/core';
import {
	channelsActions,
	createNewChannel,
	fetchApplications,
	listChannelRenderAction,
	selectAllApps,
	selectChannelById,
	selectCurrentCategory,
	selectCurrentClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { AlertTitleTextWarning, Icons } from '@mezon/ui';
import { ChannelType } from 'mezon-js';
import type { ApiApp, ApiCreateChannelDescRequest } from 'mezon-js/api.gen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ChannelLableModal } from './ChannelLabel';
import type { ChannelNameModalRef } from './ChannelNameTextField';
import { ChannelNameTextField } from './ChannelNameTextField';
import { ChannelTypeComponent } from './ChannelType';
import { CreateChannelButton } from './CreateChannelButton';

import { ChannelStatusModal } from './ChannelStatus';

export const CreateNewChannelModal = () => {
	const { t } = useTranslation('createChannel');
	const dispatch = useAppDispatch();
	const InputRef = useRef<ChannelNameModalRef>(null);
	const [isInputError, setIsInputError] = useState<boolean>(true);
	const currentClan = useSelector(selectCurrentClan);
	const currentCategory = useAppSelector((state) => selectCurrentCategory(state));
	const [validate, setValidate] = useState(true);
	const [channelName, setChannelName] = useState<string>('');
	const [selectedApp, setSelectedApp] = useState<ApiApp | null>(null);
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
	const allApps = useAppSelector(selectAllApps);

	useEffect(() => {
		if (isAppChannel) {
			dispatch(fetchApplications({}));
		}
	}, [isAppChannel, dispatch]);

	const handleAppSelect = (app: ApiApp) => {
		setSelectedApp(app);
		setIsErrorAppUrl('');
	};
	const handleSubmit = async () => {
		if (channelType === -1) {
			setIsErrorType(t('errors.typeRequired'));
			return;
		}
		if (channelType !== ChannelType.CHANNEL_TYPE_APP && channelName === '') {
			setIsErrorName(t('errors.nameRequired'));
			return;
		}

		if (isAppChannel && !selectedApp) {
			setIsErrorAppUrl(t('errors.selectApp'));
			return;
		}

		if (!validate) {
			setIsErrorName(t('errors.validName'));
			return;
		}

		const body: ApiCreateChannelDescRequest = {
			clan_id: currentClan?.clan_id,
			type: channelType,
			channel_label: channelName,
			channel_private: isPrivate,
			category_id: currentCategory?.category_id || channelWelcome?.category_id,
			...(isAppChannel && selectedApp && { app_id: selectedApp.id }),
			parent_id: '0'
		};

		const newChannelCreatedId = await dispatch(createNewChannel(body));
		dispatch(channelsActions.invalidateCache({ clanId: currentClan?.clan_id as string }));
		const payload = newChannelCreatedId.payload as ApiCreateChannelDescRequest;
		const channelID = payload.channel_id;
		const typeChannel = payload.type;
		if (currentCategory?.category_id) {
			dispatch(
				listChannelRenderAction.updateCategoryChannels({
					clanId: currentClan?.clan_id as string,
					categoryId: currentCategory?.category_id,
					channelId: channelID ?? ''
				})
			);
		}

		if (newChannelCreatedId && typeChannel !== ChannelType.CHANNEL_TYPE_MEZON_VOICE && typeChannel !== ChannelType.CHANNEL_TYPE_STREAMING) {
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

	const checkValidate = (check: boolean) => {
		setValidate(check);
	};

	const onChangeChannelType = (value: number) => {
		setIsErrorType('');
		setChannelType(value);
	};

	const onChangeToggle = (value: number) => {
		setIsPrivate(value);
	};

	const clearDataAfterCreateNew = () => {
		setChannelName('');
		setChannelType(-1);
		setChannelTypeVoice(ChannelType.CHANNEL_TYPE_MEZON_VOICE);
		setIsPrivate(0);
		setSelectedApp(null);
	};

	const handleChangeValue = useCallback(() => {
		const isValid = InputRef.current?.checkInput() ?? false;

		if (channelType === ChannelType.CHANNEL_TYPE_APP) {
			const isInputError = isValid;
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
			className="w-[100vw] h-[100vh] text-theme-primary overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div
				className={`z-60 w-full h-full sm:w-4/5 sm:max-h-[630px] md:w-[684px] bg-theme-setting-primary  rounded-2xl flex-col justify-start  items-start gap-3 inline-flex relative shadow-lg`}
			>
				<div className="self-stretch flex-col justify-start items-start flex">
					<div className="self-stretch px-5 pt-8 flex-col justify-start items-start gap-3 flex">
						<div className="self-stretch h-14 flex-col justify-center items-start gap-1 flex">
							<div className="flex flex-col items-start gap-x-2 sm:flex-row sm:items-center w-full relative">
								<ChannelLableModal labelProp={t('header.title')} />
								<span>
									<p className="self-stretch  text-sm font-bold leading-normal uppercase text-cyan-500">
										{currentCategory?.category_name || channelWelcome?.category_name}
									</p>
								</span>
								<div className="absolute right-1 top-[-10px]">
									<button onClick={handleCloseModal} className="">
										<Icons.Close />
									</button>
								</div>
							</div>

							<div className=" text-sm">{t('labels.description')}</div>
						</div>
						<div className={`flex flex-col gap-3 w-full`}>
							<div className="Frame407 self-stretch flex-col items-center gap-2 flex">
								<ChannelLableModal labelProp={t('labels.chooseType')} />
								<div
									className={`Frame405 self-stretch  flex-col justify-start items-start gap-2 flex sm:max-h-[200px] lg:h-fit lg:max-h-fit overflow-y-scroll max-xl:h-auto app-scroll`}
								>
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
									<ChannelTypeComponent
										disable={false}
										type={ChannelType.CHANNEL_TYPE_STREAMING}
										onChange={onChangeChannelType}
										error={isErrorType}
									/>
								</div>
							</div>
							{channelType !== ChannelType.CHANNEL_TYPE_APP && (
								<ChannelNameTextField
									ref={InputRef}
									onChange={handleChannelNameChange}
									onCheckValidate={checkValidate}
									type={channelType}
									channelNameProps={t('labels.channelName')}
									error={isErrorName}
									onHandleChangeValue={handleChangeValue}
									placeholder={t('labels.placeholder')}
									shouldValidate={true}
									categoryId={currentCategory?.category_id || channelWelcome?.category_id}
								/>
							)}
							{channelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE && channelType !== ChannelType.CHANNEL_TYPE_STREAMING && (
								<ChannelStatusModal onChangeValue={onChangeToggle} channelNameProps={t('labels.isPrivate')} />
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
