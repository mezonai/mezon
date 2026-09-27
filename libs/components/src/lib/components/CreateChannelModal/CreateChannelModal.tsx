import { useAppNavigation, useEscapeKeyClose } from '@mezon/core';
import {
	channelsActions,
	checkDuplicateChannelInCategoryApi,
	createNewChannel,
	fetchApplications,
	selectChannelById,
	selectCurrentCategory,
	selectCurrentClanId,
	selectCurrentClanWelcomeChannelId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { AlertTitleTextWarning, Icons } from '@mezon/ui';
import { unwrapResult } from '@reduxjs/toolkit';
import type { ApiApp, ApiCreateChannelDescRequest } from 'mezon-js';
import { ChannelType } from 'mezon-js';
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
	const currentClanId = useSelector(selectCurrentClanId);
	const welcomeChannelId = useAppSelector(selectCurrentClanWelcomeChannelId);
	const currentCategory = useAppSelector((state) => selectCurrentCategory(state));
	const [validate, setValidate] = useState(false);
	const [channelName, setChannelName] = useState<string>('');
	const [selectedApp, setSelectedApp] = useState<ApiApp | null>(null);
	const [isErrorType, setIsErrorType] = useState<string>('');
	const [isErrorName, setIsErrorName] = useState<string>('');
	const [isErrorAppUrl, setIsErrorAppUrl] = useState<string>('');
	const [isPrivate, setIsPrivate] = useState<number>(0);
	const [channelType, setChannelType] = useState<number>(ChannelType.CHANNEL_TYPE_CHANNEL);
	const [channelTypeVoice, setChannelTypeVoice] = useState<number>(ChannelType.CHANNEL_TYPE_MEZON_VOICE);
	const navigate = useNavigate();
	const { toChannelPage } = useAppNavigation();
	const isAppChannel = channelType === ChannelType.CHANNEL_TYPE_APP;
	const channelWelcome = useAppSelector((state) => selectChannelById(state, welcomeChannelId as string));

	useEffect(() => {
		if (isAppChannel) {
			dispatch(fetchApplications({}));
		}
	}, [isAppChannel, dispatch]);

	const clearDataAfterCreateNew = useCallback(() => {
		setChannelName('');
		setChannelType(ChannelType.CHANNEL_TYPE_CHANNEL);
		setChannelTypeVoice(ChannelType.CHANNEL_TYPE_MEZON_VOICE);
		setIsPrivate(0);
		setSelectedApp(null);
	}, []);

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

		try {
			const categoryIdParams = currentCategory?.category_id || channelWelcome?.category_id;
			if (channelType !== ChannelType.CHANNEL_TYPE_APP && categoryIdParams) {
				const isDuplicateRes = await dispatch(
					checkDuplicateChannelInCategoryApi({
						channelName: channelName.trim(),
						categoryId: categoryIdParams
					})
				).then(unwrapResult);

				if (isDuplicateRes) {
					setIsErrorName(t('validation.duplicateName'));
					return;
				}
			}
		} catch (error) {
			console.error('Check duplicate channel name Failed', error);
			return;
		}

		const body: ApiCreateChannelDescRequest = {
			clan_id: currentClanId as string,
			type: channelType,
			channel_label: channelName,
			channel_private: channelType !== ChannelType.CHANNEL_TYPE_CHANNEL ? 0 : isPrivate,
			category_id: currentCategory?.category_id || channelWelcome?.category_id,
			...(isAppChannel && selectedApp && { app_id: selectedApp.id }),
			parent_id: '0'
		};

		const newChannelCreatedId = await dispatch(createNewChannel(body));
		dispatch(channelsActions.invalidateCache({ clanId: currentClanId as string }));
		const payload = newChannelCreatedId.payload as ApiCreateChannelDescRequest;
		const channelID = payload.channel_id;
		const typeChannel = payload.type;

		if (newChannelCreatedId && typeChannel !== ChannelType.CHANNEL_TYPE_MEZON_VOICE && typeChannel !== ChannelType.CHANNEL_TYPE_STREAMING) {
			const channelPath = toChannelPage(channelID ?? '', currentClanId ?? '');
			navigate(channelPath);
		}
		clearDataAfterCreateNew();
	};

	const handleCloseModal = () => {
		setIsErrorType('');
		setIsErrorName('');
		setIsErrorAppUrl('');
		clearDataAfterCreateNew();
		dispatch(channelsActions.openCreateNewModalChannel({ clanId: currentClanId as string, isOpen: false }));
	};

	const handleChannelNameChange = (value: string) => {
		setIsErrorName('');
		setChannelName(value);
	};

	const checkValidate = (check: boolean) => {
		setValidate(check);
		setIsInputError(!check);
	};

	const onChangeChannelType = (value: number) => {
		setIsErrorType('');
		setChannelType(value);
	};

	const onChangeToggle = (value: number) => {
		setIsPrivate(value);
	};

	const modalRef = useRef<HTMLDivElement>(null);
	const handleClose = useCallback(() => {
		dispatch(channelsActions.openCreateNewModalChannel({ clanId: currentClanId as string, isOpen: false }));
	}, [currentClanId, dispatch]);
	useEscapeKeyClose(modalRef, handleClose);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			className="fixed inset-0 h-dvh w-screen text-theme-primary overflow-hidden z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center sm:p-4"
		>
			<div className="z-60 w-full h-full sm:h-auto sm:max-h-[630px] sm:w-4/5 md:w-[684px] bg-theme-setting-primary rounded-2xl flex flex-col justify-between relative shadow-lg overflow-hidden">
				<div className="flex-shrink-0 self-stretch px-5 pt-6 sm:pt-8 pb-1 flex flex-col justify-start items-start gap-3">
					<div className="self-stretch h-14 flex-col justify-center items-start gap-1 flex">
						<div className="flex flex-col items-start gap-x-2 sm:flex-row sm:items-center w-full relative pr-8">
							<ChannelLableModal labelProp={t('header.title')} />
							<span>
								<p className="self-stretch text-sm font-bold leading-normal uppercase text-cyan-500">
									{currentCategory?.category_name || channelWelcome?.category_name}
								</p>
							</span>
							<div className="absolute right-0 top-[-6px] sm:top-[-10px]">
								<button onClick={handleCloseModal} className="p-1 hover:opacity-80 transition-opacity">
									<Icons.Close />
								</button>
							</div>
						</div>

						<div className="text-sm">{t('labels.description')}</div>
					</div>
				</div>

				<div className="flex-1 min-h-0 overflow-y-auto px-5 py-1 flex flex-col gap-3 w-full app-scroll">
					<div className="Frame407 self-stretch flex-col items-center gap-2 flex">
						<ChannelLableModal labelProp={t('labels.chooseType')} />
						<div className="Frame405 self-stretch flex-col justify-start items-start gap-2 flex sm:max-h-[200px] lg:h-fit lg:max-h-fit overflow-y-auto max-xl:h-auto app-scroll">
							<ChannelTypeComponent
								type={ChannelType.CHANNEL_TYPE_CHANNEL}
								selectedType={channelType}
								onChange={onChangeChannelType}
								error={isErrorType}
							/>
							<ChannelTypeComponent
								disable={false}
								type={channelTypeVoice}
								selectedType={channelType}
								onChange={onChangeChannelType}
								error={isErrorType}
							/>
							<ChannelTypeComponent
								disable={false}
								type={ChannelType.CHANNEL_TYPE_STREAMING}
								selectedType={channelType}
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
							placeholder={t('labels.placeholder')}
							shouldValidate={true}
							categoryId={currentCategory?.category_id || channelWelcome?.category_id}
							clanId={currentCategory?.clan_id as string}
							onKeyDown={handleKeyDown}
						/>
					)}
					{channelType !== ChannelType.CHANNEL_TYPE_MEZON_VOICE && channelType !== ChannelType.CHANNEL_TYPE_STREAMING && (
						<ChannelStatusModal onChangeValue={onChangeToggle} channelNameProps={t('labels.isPrivate')} />
					)}
				</div>

				<CreateChannelButton onClickCancel={handleCloseModal} onClickCreate={handleSubmit} checkInputError={isInputError} />
			</div>
			{isErrorType !== '' && <AlertTitleTextWarning description={isErrorType} />}
			{isErrorName !== '' && <AlertTitleTextWarning description={isErrorName} />}
			{isAppChannel && isErrorAppUrl !== '' && <AlertTitleTextWarning description={isErrorAppUrl} />}
		</div>
	);
};
