import { useClans } from '@mezon/core';
import type { ClanUpdateDescRequest } from '@mezon/store';
import {
	CLAN_JOIN_MODE_INSTANT,
	CLAN_JOIN_MODE_REQUEST_APPROVAL,
	checkDuplicateNameApi,
	fetchSystemMessageByClanId,
	selectCurrentClan,
	toastActions,
	updateSystemMessage,
	useAppDispatch
} from '@mezon/store';
import { TypeCheck, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import type { ApiSystemMessage, ApiSystemMessageRequest, MezonUpdateSystemMessageBody } from 'mezon-js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ClanBannerBackground from './ClanBannerBackground';
import ClanLogoName from './ClanLogoName';
import ModalSaveChanges from './ModalSaveChanges';
import SystemMessagesManagement, { ToggleItem } from './SystemMessagesManagement';

const ClanSettingOverview = () => {
	const { updateClan } = useClans();
	const currentClan = useSelector(selectCurrentClan);

	const [clanRequest, setClanRequest] = useState<ClanUpdateDescRequest>({
		banner: currentClan?.banner ?? '',
		clan_name: currentClan?.clan_name ?? '',
		creator_id: currentClan?.creator_id ?? '',
		logo: currentClan?.logo ?? '',
		welcome_channel_id: currentClan?.welcome_channel_id ?? '',
		prevent_anonymous: !!currentClan?.prevent_anonymous,
		join_mode: currentClan?.join_mode ?? CLAN_JOIN_MODE_INSTANT
	});
	const { t } = useTranslation('clanSettings');
	const [systemMessage, setSystemMessage] = useState<ApiSystemMessage | null>(null);
	const [updateSystemMessageRequest, setUpdateSystemMessageRequest] = useState<ApiSystemMessageRequest | null>(null);
	const [resetTrigger, setResetTrigger] = useState<boolean>(false);
	const [isClanNameValid, setIsClanNameValid] = useState<boolean>(true);

	const dispatch = useAppDispatch();

	const fetchSystemMessage = async () => {
		if (!currentClan?.clan_id) return;
		const resultAction = await dispatch(fetchSystemMessageByClanId({ clanId: currentClan?.clan_id }));
		const message = unwrapResult(resultAction);
		setSystemMessage(message);
		setUpdateSystemMessageRequest(message);
	};

	useEffect(() => {
		fetchSystemMessage();
	}, []);

	const handleUploadBackground = (urlImage: string) => {
		setClanRequest({ ...clanRequest, banner: urlImage });
	};

	const handleUploadLogo = (urlLogo: string) => {
		setClanRequest({ ...clanRequest, logo: urlLogo ?? '' });
	};

	const handleChangeName = (clanName: string) => {
		setClanRequest({ ...clanRequest, clan_name: clanName ?? '' });
	};
	const hasSystemMessageChanges = useMemo(() => {
		if (!systemMessage && updateSystemMessageRequest) {
			return true;
		}
		if (systemMessage && updateSystemMessageRequest) {
			const hasSystemMessageChanges = Object.keys(systemMessage).some((key) => {
				const typedKey = key as keyof ApiSystemMessageRequest;
				return updateSystemMessageRequest[typedKey] !== systemMessage[typedKey];
			});
			if (hasSystemMessageChanges) {
				return true;
			}
		}
		return false;
	}, [systemMessage, updateSystemMessageRequest]);

	const hasClanChanges = useMemo(() => {
		if (currentClan && clanRequest) {
			const hasChanges = Object.keys(clanRequest).some((key) => {
				const typedKey = key as keyof typeof clanRequest;
				if (typedKey === 'join_mode') {
					return (clanRequest.join_mode ?? CLAN_JOIN_MODE_INSTANT) !== (currentClan.join_mode ?? CLAN_JOIN_MODE_INSTANT);
				}
				if (
					typedKey !== 'description' &&
					typedKey !== 'about' &&
					typedKey !== 'short_url' &&
					(clanRequest[typedKey] || currentClan[typedKey])
				) {
					return clanRequest[typedKey] !== currentClan[typedKey];
				}
				return false;
			});
			if (hasChanges) {
				return true;
			}
		}

		return false;
	}, [currentClan, clanRequest]);

	const handleSave = useCallback(async () => {
		if (currentClan?.clan_id) {
			if (hasClanChanges) {
				if (currentClan.clan_name !== clanRequest.clan_name) {
					try {
						const duplicateRes = await dispatch(
							checkDuplicateNameApi({
								name: clanRequest.clan_name?.trim() ?? '',
								type: TypeCheck.TYPECLAN,
								condition_id: currentClan.clan_id
							})
						).then(unwrapResult);

						if (duplicateRes?.is_duplicate) {
							dispatch(toastActions.addToast({ message: 'The clan name already exists. Please enter another name.', type: 'error' }));
							return;
						}
					} catch (error) {
						console.error('Check duplicate name Failed', error);
					}
				}
				await updateClan({
					clan_id: currentClan?.clan_id as string,
					request: clanRequest
				});
			}
			if (hasSystemMessageChanges) {
				await updateSystemMessages();
			}
		}
	}, [currentClan, hasSystemMessageChanges, hasClanChanges, clanRequest, updateSystemMessageRequest, systemMessage, dispatch, updateClan]);

	const updateSystemMessages = async () => {
		if (systemMessage && Object.keys(systemMessage).length > 0 && currentClan?.clan_id && updateSystemMessageRequest) {
			const cachedMessageUpdate: MezonUpdateSystemMessageBody = {
				boost_message: updateSystemMessageRequest?.boost_message ?? systemMessage?.boost_message,
				channel_id: updateSystemMessageRequest?.channel_id ?? systemMessage?.channel_id,
				hide_audit_log: updateSystemMessageRequest?.hide_audit_log ?? systemMessage?.hide_audit_log,
				setup_tips: updateSystemMessageRequest?.setup_tips ?? systemMessage?.setup_tips,
				welcome_random: updateSystemMessageRequest?.welcome_random ?? systemMessage?.welcome_random,
				welcome_sticker: updateSystemMessageRequest?.welcome_sticker ?? systemMessage?.welcome_sticker
			};

			const request = {
				clanId: currentClan.clan_id,
				newMessage: cachedMessageUpdate,
				cachedMessage: updateSystemMessageRequest
			};
			await dispatch(updateSystemMessage(request));
			setSystemMessage(updateSystemMessageRequest);
			setUpdateSystemMessageRequest(updateSystemMessageRequest);
		} else if (updateSystemMessageRequest) {
			setSystemMessage(updateSystemMessageRequest);
			setUpdateSystemMessageRequest(updateSystemMessageRequest);
		}
	};

	const handleRemovelogo = () => {
		setClanRequest({ ...clanRequest, logo: '' });
	};

	const handleReset = () => {
		setResetTrigger(true);
		setClanRequest({
			banner: currentClan?.banner ?? '',
			clan_name: currentClan?.clan_name ?? '',
			creator_id: currentClan?.creator_id ?? '',
			logo: currentClan?.logo ?? '',
			is_onboarding: currentClan?.is_onboarding,
			welcome_channel_id: currentClan?.welcome_channel_id ?? '',
			prevent_anonymous: !!currentClan?.prevent_anonymous,
			join_mode: currentClan?.join_mode ?? CLAN_JOIN_MODE_INSTANT
		});
		setUpdateSystemMessageRequest(systemMessage);
	};

	const handleResetComplete = () => {
		setResetTrigger(false);
	};

	const handleToggleAno = (prevent: boolean) => {
		setClanRequest({
			...clanRequest,
			prevent_anonymous: prevent
		});
	};

	const handleChangeJoinMode = (joinMode: number) => {
		setClanRequest((prev) => ({
			...prev,
			join_mode: joinMode
		}));
	};

	return (
		<div className="h-full pb-10">
			<ClanLogoName
				onUpload={handleUploadLogo}
				onGetClanName={handleChangeName}
				resetTrigger={resetTrigger}
				onResetComplete={handleResetComplete}
				handleRemovelogo={handleRemovelogo}
				onValidationChange={setIsClanNameValid}
			/>
			<ClanBannerBackground onUpload={handleUploadBackground} urlImage={clanRequest?.banner} />
			{systemMessage && (
				<SystemMessagesManagement
					updateSystem={updateSystemMessageRequest}
					setUpdateSystemMessageRequest={setUpdateSystemMessageRequest}
					channelSelectedId={
						updateSystemMessageRequest?.channel_id && updateSystemMessageRequest?.channel_id !== '0'
							? updateSystemMessageRequest?.channel_id
							: currentClan?.welcome_channel_id || ''
					}
					setClanRequest={setClanRequest}
				/>
			)}

			<div
				className={'border-t-theme-primary mt-10 pt-10 flex flex-col '}
				data-e2e={generateE2eId('clan_page.settings.overview.prevent_anonymous')}
			>
				<h3 className="text-sm font-bold uppercase mb-2">{t('systemMessages.anoTitle')}</h3>
				<ToggleItem label={t('systemMessages.anoDesc')} value={!!clanRequest.prevent_anonymous} handleToggle={handleToggleAno} />
			</div>

			<div
				className={'border-t-theme-primary mt-10 pt-10 flex flex-col gap-3'}
				data-e2e={generateE2eId('clan_page.settings.overview.join_mode')}
			>
				<h3 className="text-sm font-bold uppercase">{t('joinMode.title')}</h3>
				<div className="flex flex-col gap-2">
					<label
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
							(clanRequest.join_mode ?? CLAN_JOIN_MODE_INSTANT) === CLAN_JOIN_MODE_INSTANT
								? 'border-indigo-500 bg-item-theme'
								: 'border-theme-primary bg-theme-setting-nav hover:bg-item-theme'
						}`}
					>
						<input
							type="radio"
							name="clan-join-mode"
							checked={(clanRequest.join_mode ?? CLAN_JOIN_MODE_INSTANT) === CLAN_JOIN_MODE_INSTANT}
							onChange={() => handleChangeJoinMode(CLAN_JOIN_MODE_INSTANT)}
							className="mt-1 accent-indigo-500 cursor-pointer"
						/>
						<div className="flex flex-col">
							<span className="text-sm font-medium text-theme-primary-active">{t('joinMode.instantTitle')}</span>
							<span className="text-xs text-theme-primary">{t('joinMode.instantDesc')}</span>
						</div>
					</label>
					<label
						className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
							(clanRequest.join_mode ?? CLAN_JOIN_MODE_INSTANT) === CLAN_JOIN_MODE_REQUEST_APPROVAL
								? 'border-indigo-500 bg-item-theme'
								: 'border-theme-primary bg-theme-setting-nav hover:bg-item-theme'
						}`}
					>
						<input
							type="radio"
							name="clan-join-mode"
							checked={(clanRequest.join_mode ?? CLAN_JOIN_MODE_INSTANT) === CLAN_JOIN_MODE_REQUEST_APPROVAL}
							onChange={() => handleChangeJoinMode(CLAN_JOIN_MODE_REQUEST_APPROVAL)}
							className="mt-1 accent-indigo-500 cursor-pointer"
						/>
						<div className="flex flex-col">
							<span className="text-sm font-medium text-theme-primary-active">{t('joinMode.requestTitle')}</span>
							<span className="text-xs text-theme-primary">{t('joinMode.requestDesc')}</span>
						</div>
					</label>
				</div>
			</div>

			{(hasClanChanges || hasSystemMessageChanges) && isClanNameValid && <ModalSaveChanges onSave={handleSave} onReset={handleReset} />}
		</div>
	);
};

export default ClanSettingOverview;
