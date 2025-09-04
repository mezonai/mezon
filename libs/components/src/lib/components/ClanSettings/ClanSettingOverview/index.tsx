import { useClans } from '@mezon/core';
import { createSystemMessage, fetchSystemMessageByClanId, selectCurrentClan, updateSystemMessage, useAppDispatch } from '@mezon/store';
import { unwrapResult } from '@reduxjs/toolkit';
import { ApiSystemMessage, ApiSystemMessageRequest, MezonUpdateClanDescBody } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import ClanBannerBackground from './ClanBannerBackground';
import ClanLogoName from './ClanLogoName';
import ModalSaveChanges from './ModalSaveChanges';
import SystemMessagesManagement from './SystemMessagesManagement';

const ClanSettingOverview = () => {
	const { updateClan } = useClans();
	const currentClan = useSelector(selectCurrentClan);

	const [clanRequest, setClanRequest] = useState<MezonUpdateClanDescBody>({
		banner: currentClan?.banner ?? '',
		clan_name: currentClan?.clan_name ?? '',
		creator_id: currentClan?.creator_id ?? '',
		logo: currentClan?.logo ?? '',
		welcome_channel_id: currentClan?.welcome_channel_id ?? ''
	});

	const [systemMessage, setSystemMessage] = useState<ApiSystemMessage | null>(null);
	const [updateSystemMessageRequest, setUpdateSystemMessageRequest] = useState<ApiSystemMessageRequest | null>(null);

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
			const cachedMessageUpdate: ApiSystemMessage = {
				boost_message:
					updateSystemMessageRequest?.boost_message === systemMessage?.boost_message ? '' : updateSystemMessageRequest?.boost_message,
				channel_id: updateSystemMessageRequest?.channel_id === systemMessage?.channel_id ? '' : updateSystemMessageRequest?.channel_id,
				clan_id: systemMessage?.clan_id,
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
				clanId: currentClan.clan_id,
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

	const handleReset = () => {
		setClanRequest({
			banner: currentClan?.banner ?? '',
			clan_name: currentClan?.clan_name ?? '',
			creator_id: currentClan?.creator_id ?? '',
			logo: currentClan?.logo ?? '',
			is_onboarding: currentClan?.is_onboarding,
			welcome_channel_id: currentClan?.welcome_channel_id ?? ''
		});
		setUpdateSystemMessageRequest(systemMessage);
	};
	return (
		<div className="h-full pb-10">
			<ClanLogoName onUpload={handleUploadLogo} onGetClanName={handleChangeName} />
			<ClanBannerBackground onUpload={handleUploadBackground} urlImage={clanRequest?.banner} />
			{systemMessage && (
				<SystemMessagesManagement
					updateSystem={updateSystemMessageRequest}
					setUpdateSystemMessageRequest={setUpdateSystemMessageRequest}
					channelSelectedId={updateSystemMessageRequest?.channel_id as string}
				/>
			)}

			{(hasClanChanges || hasSystemMessageChanges) && <ModalSaveChanges onSave={handleSave} onReset={handleReset} />}
		</div>
	);
};

export default ClanSettingOverview;
