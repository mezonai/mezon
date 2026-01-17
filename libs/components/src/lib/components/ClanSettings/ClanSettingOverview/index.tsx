import { useClans } from '@mezon/core';
import type { SystemMessageEntity } from '@mezon/store';
import { createSystemMessage, fetchSystemMessageByClanId, selectCurrentClan, updateSystemMessage, useAppDispatch } from '@mezon/store';
import type { ISystemMessageRequest } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import type { ApiSystemMessageRequest, MezonUpdateClanDescBody, MezonUpdateSystemMessageBody } from 'mezon-js/api.gen';
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

	const [clanRequest, setClanRequest] = useState<MezonUpdateClanDescBody>({
		banner: currentClan?.banner ?? '',
		clan_name: currentClan?.clan_name ?? '',
		creator_id: BigInt(currentClan?.creator_id ?? ''),
		logo: currentClan?.logo ?? '',
		welcome_channel_id: BigInt(currentClan?.welcome_channel_id ?? ''),
		prevent_anonymous: !!currentClan?.prevent_anonymous
	});
	const { t } = useTranslation('clanSettings');
	const [systemMessage, setSystemMessage] = useState<SystemMessageEntity | null>(null);
	const [updateSystemMessageRequest, setUpdateSystemMessageRequest] = useState<ISystemMessageRequest | null>(null);
	const [resetTrigger, setResetTrigger] = useState<boolean>(false);

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
				if (
					typedKey !== 'description' &&
					typedKey !== 'about' &&
					typedKey !== 'short_url' &&
					(clanRequest[typedKey] || currentClan[typedKey])
				) {
					return clanRequest[typedKey] !== currentClan[typedKey];
				}
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
				await updateClan({
					clan_id: currentClan?.clan_id as string,
					request: clanRequest
				});
			}
			if (hasSystemMessageChanges) {
				await updateSystemMessages();
			}
		}
	}, [currentClan, hasSystemMessageChanges, hasClanChanges, clanRequest, updateSystemMessageRequest, systemMessage]);

	const updateSystemMessages = async () => {
		if (systemMessage && Object.keys(systemMessage).length > 0 && currentClan?.clan_id && updateSystemMessageRequest) {
			const cachedMessageUpdate: ISystemMessageRequest = {
				boost_message:
					updateSystemMessageRequest?.boost_message === systemMessage?.boost_message ? '' : updateSystemMessageRequest?.boost_message,
				channel_id: updateSystemMessageRequest?.channel_id === systemMessage?.channel_id ? '' : updateSystemMessageRequest?.channel_id,
				clan_id: systemMessage?.clan_id,
				id: systemMessage?.id ? systemMessage?.id : undefined,
				hide_audit_log:
					updateSystemMessageRequest?.hide_audit_log === systemMessage?.hide_audit_log ? '' : updateSystemMessageRequest?.hide_audit_log,
				setup_tips: updateSystemMessageRequest?.setup_tips === systemMessage?.setup_tips ? '' : updateSystemMessageRequest?.setup_tips,
				welcome_random:
					updateSystemMessageRequest?.welcome_random === systemMessage?.welcome_random ? '' : updateSystemMessageRequest?.welcome_random,
				welcome_sticker:
					updateSystemMessageRequest?.welcome_sticker === systemMessage?.welcome_sticker ? '' : updateSystemMessageRequest?.welcome_sticker
			};
			const request = {
				clanId: currentClan.clan_id,
				newMessage: {
					...cachedMessageUpdate,
					id: systemMessage?.id ? BigInt(systemMessage?.id) : undefined,
					channel_id: cachedMessageUpdate.channel_id ? BigInt(cachedMessageUpdate.channel_id) : undefined,
					clan_id: cachedMessageUpdate.clan_id ? BigInt(cachedMessageUpdate.clan_id) : undefined
				} as MezonUpdateSystemMessageBody,
				cachedMessage: updateSystemMessageRequest
			};
			await dispatch(updateSystemMessage(request));
			setSystemMessage(updateSystemMessageRequest);
			setUpdateSystemMessageRequest(updateSystemMessageRequest);
		} else if (updateSystemMessageRequest) {
			await dispatch(createSystemMessage(updateSystemMessageRequest));
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
			creator_id: BigInt(currentClan?.creator_id ?? 0),
			logo: currentClan?.logo ?? '',
			is_onboarding: currentClan?.is_onboarding,
			welcome_channel_id: BigInt(currentClan?.welcome_channel_id ?? 0),
			prevent_anonymous: !!currentClan?.prevent_anonymous
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
	return (
		<div className="h-full pb-10">
			<ClanLogoName
				onUpload={handleUploadLogo}
				onGetClanName={handleChangeName}
				resetTrigger={resetTrigger}
				onResetComplete={handleResetComplete}
				handleRemovelogo={handleRemovelogo}
			/>
			<ClanBannerBackground onUpload={handleUploadBackground} urlImage={clanRequest?.banner} />
			{systemMessage && (
				<SystemMessagesManagement
					updateSystem={updateSystemMessageRequest}
					setUpdateSystemMessageRequest={setUpdateSystemMessageRequest}
					channelSelectedId={updateSystemMessageRequest?.channel_id as string}
					setClanRequest={setClanRequest}
				/>
			)}

			<div className={'border-t-theme-primary mt-10 pt-10 flex flex-col '}>
				<h3 className="text-sm font-bold uppercase mb-2">{t('systemMessages.anoTitle')}</h3>
				<ToggleItem label={t('systemMessages.anoDesc')} value={!!clanRequest.prevent_anonymous} handleToggle={handleToggleAno} />
			</div>

			{(hasClanChanges || hasSystemMessageChanges) && <ModalSaveChanges onSave={handleSave} onReset={handleReset} />}
		</div>
	);
};

export default ClanSettingOverview;
