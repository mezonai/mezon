import { useClans } from '@mezon/core';
import { createSystemMessage, fetchSystemMessageByClanId, selectCurrentClan, updateSystemMessage, useAppDispatch } from '@mezon/store';
import { unwrapResult } from '@reduxjs/toolkit';
import type { ApiSystemMessage, ApiSystemMessageRequest, MezonUpdateClanDescBody } from 'mezon-js/types';
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
		creatorId: currentClan?.creatorId ?? '',
		logo: currentClan?.logo ?? '',
		welcomeChannelId: currentClan?.welcomeChannelId ?? '',
		preventAnonymous: !!currentClan?.preventAnonymous
	});
	const { t } = useTranslation('clanSettings');
	const [systemMessage, setSystemMessage] = useState<ApiSystemMessage | null>(null);
	const [updateSystemMessageRequest, setUpdateSystemMessageRequest] = useState<ApiSystemMessageRequest | null>(null);
	const [resetTrigger, setResetTrigger] = useState<boolean>(false);

	const dispatch = useAppDispatch();

	const fetchSystemMessage = async () => {
		if (!currentClan?.clanId) return;
		const resultAction = await dispatch(fetchSystemMessageByClanId({ clanId: currentClan?.clanId }));
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
					typedKey !== 'shortUrl' &&
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
		if (currentClan?.clanId) {
			if (hasClanChanges) {
				await updateClan({
					clanId: currentClan?.clanId as string,
					request: clanRequest
				});
			}
			if (hasSystemMessageChanges) {
				await updateSystemMessages();
			}
		}
	}, [currentClan, hasSystemMessageChanges, hasClanChanges, clanRequest, updateSystemMessageRequest, systemMessage]);

	const updateSystemMessages = async () => {
		if (systemMessage && Object.keys(systemMessage).length > 0 && currentClan?.clanId && updateSystemMessageRequest) {
			const cachedMessageUpdate: ApiSystemMessage = {
				boost_message:
					updateSystemMessageRequest?.boost_message === systemMessage?.boost_message ? '' : updateSystemMessageRequest?.boost_message,
				channelId: updateSystemMessageRequest?.channelId === systemMessage?.channelId ? '' : updateSystemMessageRequest?.channelId,
				clanId: systemMessage?.clanId,
				id: systemMessage?.id,
				hide_audit_log:
					updateSystemMessageRequest?.hide_audit_log === systemMessage?.hide_audit_log ? '' : updateSystemMessageRequest?.hide_audit_log,
				setup_tips: updateSystemMessageRequest?.setup_tips === systemMessage?.setup_tips ? '' : updateSystemMessageRequest?.setup_tips,
				welcome_random:
					updateSystemMessageRequest?.welcome_random === systemMessage?.welcome_random ? '' : updateSystemMessageRequest?.welcome_random,
				welcome_sticker:
					updateSystemMessageRequest?.welcome_sticker === systemMessage?.welcome_sticker ? '' : updateSystemMessageRequest?.welcome_sticker
			};
			const request = {
				clanId: currentClan.clanId,
				newMessage: cachedMessageUpdate,
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
			creatorId: currentClan?.creatorId ?? '',
			logo: currentClan?.logo ?? '',
			isOnboarding: currentClan?.isOnboarding,
			welcomeChannelId: currentClan?.welcomeChannelId ?? '',
			preventAnonymous: !!currentClan?.preventAnonymous
		});
		setUpdateSystemMessageRequest(systemMessage);
	};

	const handleResetComplete = () => {
		setResetTrigger(false);
	};

	const handleToggleAno = (prevent: boolean) => {
		setClanRequest({
			...clanRequest,
			preventAnonymous: prevent
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
					channelSelectedId={updateSystemMessageRequest?.channelId as string}
					setClanRequest={setClanRequest}
				/>
			)}

			<div className={'border-t-theme-primary mt-10 pt-10 flex flex-col '}>
				<h3 className="text-sm font-bold uppercase mb-2">{t('systemMessages.anoTitle')}</h3>
				<ToggleItem label={t('systemMessages.anoDesc')} value={!!clanRequest.preventAnonymous} handleToggle={handleToggleAno} />
			</div>

			{(hasClanChanges || hasSystemMessageChanges) && <ModalSaveChanges onSave={handleSave} onReset={handleReset} />}
		</div>
	);
};

export default ClanSettingOverview;
