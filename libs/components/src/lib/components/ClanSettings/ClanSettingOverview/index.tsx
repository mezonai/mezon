import { useClans } from '@mezon/core';
import { createSystemMessage, fetchSystemMessageByClanId, selectCurrentClan, updateSystemMessage, useAppDispatch } from '@mezon/store';
import { unwrapResult } from '@reduxjs/toolkit';
import { ApiSystemMessage, ApiSystemMessageRequest, MezonUpdateClanDescBody, MezonUpdateSystemMessageBody } from 'mezon-js/api.gen';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ClanBannerBackground from './ClanBannerBackground';
import ClanLogoName from './ClanLogoName';
import ModalSaveChanges from './ModalSaveChanges';
import SystemMessagesManagement from './SystemMessagesManagement';

const ClanSettingOverview = () => {
	const { updateClan } = useClans();
	const currentClan = useSelector(selectCurrentClan);
	const [hasChanges, setHasChanges] = useState<boolean>(false);
	const [clanRequest, setClanRequest] = useState<MezonUpdateClanDescBody>({
		banner: currentClan?.banner ?? '',
		clan_name: currentClan?.clan_name ?? '',
		creator_id: currentClan?.creator_id ?? '',
		logo: currentClan?.logo ?? '',
		is_onboarding: currentClan?.is_onboarding,
		welcome_channel_id: currentClan?.welcome_channel_id ?? ''
	});

	const [systemMessage, setSystemMessage] = useState<ApiSystemMessage | null>(null);
	const [createSystemMessageRequest, setCreateSystemMessageRequest] = useState<ApiSystemMessageRequest | null>(null);
	const [updateSystemMessageRequest, setUpdateSystemMessageRequest] = useState<MezonUpdateSystemMessageBody>({
		channel_id: systemMessage?.channel_id ?? '',
		welcome_random: systemMessage?.welcome_random ?? '',
		welcome_sticker: systemMessage?.welcome_sticker ?? '',
		boost_message: systemMessage?.boost_message ?? '',
		setup_tips: systemMessage?.setup_tips ?? '',
		hide_audit_log: systemMessage?.hide_audit_log ?? ''
	});

	const dispatch = useAppDispatch();

	const fetchSystemMessage = async () => {
		if (!currentClan?.clan_id) return;
		const resultAction = await dispatch(fetchSystemMessageByClanId(currentClan?.clan_id));
		const message = unwrapResult(resultAction);
		setSystemMessage(message);
	};

	useEffect(() => {
		fetchSystemMessage();
	}, [currentClan]);

	const handleUploadBackground = (urlImage: string) => {
		setClanRequest({ ...clanRequest, banner: urlImage });
	};

	const handleUploadLogo = (urlLogo: string) => {
		setClanRequest({ ...clanRequest, logo: urlLogo ?? '' });
	};

	const handleChangeName = (clanName: string) => {
		setClanRequest({ ...clanRequest, clan_name: clanName ?? '' });
	};

	const handleCreateSystemMessageRequest = (createSystemMessageRequest: ApiSystemMessageRequest) => {
		setCreateSystemMessageRequest(createSystemMessageRequest);
	};

	const handleChangeChannelId = (channelId: string) => {
		setUpdateSystemMessageRequest({ ...updateSystemMessageRequest, channel_id: channelId ?? '' });
	};

	const handleChangeWelcomeRandom = (welcomeRandom: string) => {
		setUpdateSystemMessageRequest({ ...updateSystemMessageRequest, welcome_random: welcomeRandom ?? '' });
	};

	const handleChangeWelcomeSticker = (welcomeSticker: string) => {
		setUpdateSystemMessageRequest({ ...updateSystemMessageRequest, welcome_sticker: welcomeSticker ?? '' });
	};

	const handleChangeBoostMessage = (boostMessage: string) => {
		setUpdateSystemMessageRequest({ ...updateSystemMessageRequest, boost_message: boostMessage ?? '' });
	};

	const handleChangeSetupTips = (setupTips: string) => {
		setUpdateSystemMessageRequest({ ...updateSystemMessageRequest, setup_tips: setupTips ?? '' });
	};

	const handleChangeHideAuditLog = (hideAuditLog: string) => {
		setUpdateSystemMessageRequest({ ...updateSystemMessageRequest, hide_audit_log: hideAuditLog ?? '' });
	};

	const handleSave = async () => {
		if (currentClan?.clan_id) {
			await updateClan({
				clan_id: currentClan?.clan_id as string,
				request: clanRequest
			});
			await updateSystemMessages();
		}
	};

	const updateSystemMessages = async () => {
		if (systemMessage && Object.keys(systemMessage).length > 0 && currentClan?.clan_id && updateSystemMessageRequest) {
			const request = {
				clanId: currentClan.clan_id,
				newMessage: updateSystemMessageRequest
			};
			await dispatch(updateSystemMessage(request));
		} else if (createSystemMessageRequest) {
			await dispatch(createSystemMessage(createSystemMessageRequest));
		}
	};

	const handleReset = () => {
		setHasChanges(false);
	};

	return (
		<div className="h-full pb-10">
			<ClanLogoName
				hasChanges={hasChanges}
				onUpload={handleUploadLogo}
				onGetClanName={handleChangeName}
				onHasChanges={(hasChanges) => setHasChanges(hasChanges)}
			/>
			<ClanBannerBackground
				hasChanges={hasChanges}
				onUpload={handleUploadBackground}
				onHasChanges={(hasChanges) => setHasChanges(hasChanges)}
			/>
			{systemMessage && (
				<SystemMessagesManagement
					hasChanges={hasChanges}
					systemMessage={systemMessage}
					onGetCreateSystemMessageRequest={handleCreateSystemMessageRequest}
					onGetChannelId={handleChangeChannelId}
					onGetWelcomeRandom={handleChangeWelcomeRandom}
					onGetWelcomeSticker={handleChangeWelcomeSticker}
					onGetBoostMessage={handleChangeBoostMessage}
					onGetSetupTips={handleChangeSetupTips}
					onHasChanges={(hasChanges) => setHasChanges(hasChanges)}
					onHideAuditLog={handleChangeHideAuditLog}
				/>
			)}

			{hasChanges && <ModalSaveChanges onSave={handleSave} onReset={handleReset} />}
		</div>
	);
};

export default ClanSettingOverview;
