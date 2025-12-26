import { toChannelPage, useAppNavigation, useClans } from '@mezon/core';
import {
	categoriesActions,
	channelsActions,
	checkDuplicateNameClan,
	createNewChannel,
	selectAllClans,
	triggerClanLimitModal,
	useAppDispatch
} from '@mezon/store';
import { handleUploadFile, useMezon } from '@mezon/transport';
import { Button, ButtonLoading, Icons, InputField } from '@mezon/ui';
import { DEBOUNCE_TYPING_TIME, LIMIT_SIZE_UPLOAD_IMG, ValidateSpecialCharacters, checkClanLimit, fileTypeImage, generateE2eId } from '@mezon/utils';
import { unwrapResult } from '@reduxjs/toolkit';
import { ChannelType } from 'mezon-js';
import type { ApiCategoryDesc } from 'mezon-js/api.gen';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDebouncedCallback } from 'use-debounce';
import { ModalErrorTypeUpload, ModalLayout, ModalOverData } from '../../components';

export type ModalCreateClansProps = {
	open: boolean;
	onClose: () => void;
};

type openModalErrorProps = {
	errorType: boolean;
	errorSize: boolean;
};

enum EValidateListMessage {
	INVALID_NAME = 'INVALID_NAME',
	DUPLICATE_NAME = 'DUPLICATE_NAME',
	VALIDATED = 'VALIDATED'
}

enum EModalStep {
	TEMPLATE_SELECTION = 'TEMPLATE_SELECTION',
	CLAN_DETAILS = 'CLAN_DETAILS'
}

type ChannelTemplate = {
	name: string;
	type: ChannelType.CHANNEL_TYPE_CHANNEL | ChannelType.CHANNEL_TYPE_MEZON_VOICE;
	isPrivate?: boolean;
};

type CategoryTemplate = {
	name: string;
	channels: ChannelTemplate[];
};

type ClanTemplate = {
	id: string;
	name: string;
	icon: React.JSX.Element;
	categories: CategoryTemplate[];
};

const CLAN_TEMPLATES: ClanTemplate[] = [
	{
		id: 'gaming',
		name: 'clanTemplateModal.gamingTemplate',
		icon: <Icons.GamingConsoleIcon />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'clips-highlights', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'looking-for-group', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'admin-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lobby', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Gaming', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'friends',
		name: 'clanTemplateModal.friendsTemplate',
		icon: <Icons.IconFriends />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'memes', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'photos', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Stream Room', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'study-group',
		name: 'clanTemplateModal.studyGroupTemplate',
		icon: <Icons.MemberList />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'homework-help', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'session-planning', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'off-topic', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Study Room 1', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Study Room 2', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'school-club',
		name: 'clanTemplateModal.schoolClubTemplate',
		icon: <Icons.School />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'meeting-plans', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'off-topic', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Meeting Room 1', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Meeting Room 2', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'local-community',
		name: 'clanTemplateModal.localCommunityTemplate',
		icon: <Icons.Community />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'events', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'introductions', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'resources', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Meeting Room', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	},
	{
		id: 'artists-creators',
		name: 'clanTemplateModal.artistsCreatorsTemplate',
		icon: <Icons.PaintTray />,
		categories: [
			{
				name: '',
				channels: [
					{ name: 'showcase', type: ChannelType.CHANNEL_TYPE_CHANNEL },
					{ name: 'ideas-and-feedback', type: ChannelType.CHANNEL_TYPE_CHANNEL }
				]
			},
			{
				name: 'Private Channels',
				channels: [{ name: 'private-chat', type: ChannelType.CHANNEL_TYPE_CHANNEL, isPrivate: true }]
			},
			{
				name: 'Voice Channels',
				channels: [
					{ name: 'Lounge', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Community Hangout', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE },
					{ name: 'Stream Room', type: ChannelType.CHANNEL_TYPE_MEZON_VOICE }
				]
			}
		]
	}
];

const ModalCreateClans = (props: ModalCreateClansProps) => {
	const { t } = useTranslation('clan');
	const { onClose } = props;
	const [currentStep, setCurrentStep] = useState<EModalStep>(EModalStep.TEMPLATE_SELECTION);
	const [selectedTemplate, setSelectedTemplate] = useState<ClanTemplate | null>(null);
	const [urlImage, setUrlImage] = useState('');
	const [nameClan, setNameClan] = useState('');
	const [validationState, setValidationState] = useState<EValidateListMessage | null>(EValidateListMessage.INVALID_NAME);
	const { sessionRef, clientRef } = useMezon();
	const { navigate, toClanPage } = useAppNavigation();
	const { createClans } = useClans();
	const dispatch = useAppDispatch();
	const allClans = useSelector(selectAllClans);
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setNameClan(value);
		setValidationState(null);
		if (value) {
			debouncedSetClanName(value);
		} else {
			debouncedSetClanName.cancel();
			setValidationState(EValidateListMessage.INVALID_NAME);
		}
	};
	const debouncedSetClanName = useDebouncedCallback(async (value: string) => {
		const regex = ValidateSpecialCharacters();
		if (regex.test(value)) {
			await dispatch(checkDuplicateNameClan(value.trim()))
				.then(unwrapResult)
				.then((result) => {
					if (result) {
						setValidationState(EValidateListMessage.DUPLICATE_NAME);
						return;
					}
					setValidationState(EValidateListMessage.VALIDATED);
				});
			return;
		}
		setValidationState(EValidateListMessage.INVALID_NAME);
	}, DEBOUNCE_TYPING_TIME);

	const [openModalError, seOpenModalError] = useState<openModalErrorProps>({
		errorType: false,
		errorSize: false
	});
	const handleFile = (e: any) => {
		const file = e?.target?.files[0];
		const session = sessionRef.current;
		const client = clientRef.current;
		const sizeImage = file?.size;
		if (!file) return;
		if (!client || !session) {
			throw new Error('Client or file is not initialized');
		}
		const allowedTypes = fileTypeImage;
		if (!allowedTypes.includes(file.type)) {
			seOpenModalError((prev) => ({ ...prev, errorType: true }));
			e.target.value = null;
			return;
		}
		if (sizeImage > LIMIT_SIZE_UPLOAD_IMG) {
			seOpenModalError((prev) => ({ ...prev, errorSize: true }));
			e.target.value = null;
			return;
		}
		handleUploadFile(client, session, file?.name, file).then((attachment: any) => {
			setUrlImage(attachment.url ?? '');
		});
	};

	const createTemplateChannels = async (clanId: string, template: ClanTemplate, defaultCategoryId: string) => {
		for (const category of template.categories) {
			let newCategory: ApiCategoryDesc = { category_id: defaultCategoryId };
			if (category.name) {
				const res = await dispatch(
					categoriesActions.createNewCategory({
						clan_id: clanId,
						category_name: category.name
					})
				);
				newCategory = unwrapResult(res);
			}
			if (!newCategory.category_id) continue;
			for (const channel of category.channels) {
				const isPrivate = channel.isPrivate ? 1 : 0;

				await dispatch(
					createNewChannel({
						clan_id: clanId,
						type: channel.type,
						channel_label: channel.name,
						channel_private: isPrivate,
						category_id: newCategory.category_id,
						parent_id: '0'
					})
				);
				await new Promise((resolve) => setTimeout(resolve, 400));
			}
		}
	};

	const navigateToNewClan = async (clanId: string, channelId?: string) => {
		if (channelId) {
			dispatch(
				channelsActions.setCurrentChannelId({
					clanId,
					channelId
				})
			);
			navigate(toChannelPage(channelId, clanId));
		} else {
			navigate(toClanPage(clanId));
		}
	};

	const handleCreateClan = async () => {
		const clanLimitCheck = checkClanLimit(allClans.length, 'create');

		if (!clanLimitCheck.canProceed) {
			handleClose();
			dispatch(triggerClanLimitModal({ type: 'create', clanCount: allClans.length }));
			return;
		}

		const clan = await createClans(nameClan.trim(), urlImage);
		if (clan?.clan_id) {
			const result = await dispatch(channelsActions.fetchChannels({ clanId: clan.clan_id, noCache: true }));
			const channels = (result?.payload as any)?.channels || [];
			await navigateToNewClan(clan.clan_id, channels[0]?.channel_id);
			if (selectedTemplate) {
				try {
					await createTemplateChannels(clan.clan_id, selectedTemplate, channels[0]?.category_id);
				} catch (error) {
					console.error('Error creating template channels:', error);
				}
			}
		}

		handleClose();
	};

	const handleClose = useCallback(() => {
		onClose();
		setUrlImage('');
		setNameClan('');
		setCurrentStep(EModalStep.TEMPLATE_SELECTION);
		setSelectedTemplate(null);
		setValidationState(EValidateListMessage.INVALID_NAME);
	}, [onClose]);

	const handleTemplateSelect = (template: ClanTemplate | null) => {
		setSelectedTemplate(template);
		setCurrentStep(EModalStep.CLAN_DETAILS);
	};

	const handleBackToTemplates = () => {
		setCurrentStep(EModalStep.TEMPLATE_SELECTION);
		setSelectedTemplate(null);
		setNameClan('');
		setUrlImage('');
		setValidationState(EValidateListMessage.INVALID_NAME);
	};

	const templateSelection = () => (
		<div className="flex flex-col px-5 py-4 min-w-80 max-w-[480px]">
			<div className="flex items-center flex-col justify-center">
				<div className="w-full relative flex items-center flex-col justify-center">
					<span className="text-[24px] pb-2 font-[700] leading-8">{t('clanTemplateModal.title')}</span>
					<p className="text-center text-[16px] leading-6 font-[400] mb-6">{t('clanTemplateModal.description')}</p>
				</div>

				<div className="w-full px-3 py-2 flex flex-col overflow-y-auto thread-scroll max-h-[30vh]">
					<button
						onClick={() => handleTemplateSelect(null)}
						className="w-full p-3 mb-4 rounded-lg relative border border-theme-primary cursor-pointer transform hover:scale-105 transition duration-300 ease-in-out flex flex-row items-center gap-2 group h-fit"
						data-e2e={generateE2eId('clan_page.modal.create_clan.template.item.create_my_own')}
					>
						<Icons.Sparkles />
						<span className="font-semibold text-sm text-center pl-2">{t('clanTemplateModal.createMyOwn')}</span>
					</button>

					<div className="w-full">
						<p className="text-sm font-bold mb-3 text-gray-500 dark:text-gray-400 uppercase">
							{t('clanTemplateModal.startFromTemplate')}
						</p>
						<div className="grid grid-cols-1 gap-2">
							{CLAN_TEMPLATES.map((template) => (
								<button
									key={template.id}
									onClick={() => handleTemplateSelect(template)}
									className="p-3 rounded-lg relative border border-theme-primary cursor-pointer transform hover:scale-105 transition duration-300 ease-in-out flex flex-row items-center gap-2 group h-fit"
									data-e2e={generateE2eId('clan_page.modal.create_clan.template.item.name')}
								>
									{template.icon}
									<span className="font-semibold text-sm text-center pl-2">{t(`${template.name}`)}</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const clanCustomization = () => (
		<div className="flex flex-col px-5 py-4 min-w-80 max-w-[480px]">
			<div className="flex items-center flex-col justify-center">
				<span className="text-[24px] pb-4 font-[700] leading-8">{t('createClanModal.title')}</span>
				<p className="text-center text-[16px] leading-6 font-[400]">{t('createClanModal.description')}</p>
				<label className="block mt-8 mb-4">
					{urlImage ? (
						<img id="preview_img" className="h-[81px] w-[81px] object-cover rounded-full" src={urlImage} alt="Current profile" />
					) : (
						<div
							id="preview_img"
							className="h-[81px] w-[81px] flex justify-center bg-item-theme items-center flex-col border-white relative border-[1px] border-dashed rounded-full cursor-pointer transform hover:scale-105 transition duration-300 ease-in-out"
						>
							<div className="absolute right-0 top-[-3px] left-[54px]">
								<Icons.AddIcon />
							</div>
							<Icons.UploadImage className="" />
							<span className="text-[14px]">{t('createClanModal.upload')}</span>
						</div>
					)}
					<input
						id="preview_img"
						type="file"
						onChange={(e) => handleFile(e)}
						className="w-full text-sm hidden"
						data-e2e={generateE2eId('clan_page.modal.create_clan.input.upload_avatar_clan')}
					/>
				</label>
				<div className="w-full">
					<span className="font-[700] text-[16px] leading-6">
						{t('createClanModal.clanName')}
						<span className="text-[#e44141]"> *</span>
					</span>
					<InputField
						onChange={handleInputChange}
						type="text"
						className="mb-2 mt-4 py-2"
						placeholder={t('createClanModal.placeholder')}
						maxLength={Number(process.env.NX_MAX_LENGTH_NAME_ALLOWED)}
						data-e2e={generateE2eId('clan_page.modal.create_clan.input.clan_name')}
					/>
					{validationState !== EValidateListMessage.VALIDATED && (
						<p className="text-[#e44141] text-xs italic font-thin">
							{validationState === EValidateListMessage.INVALID_NAME && t('createClanModal.invalidName')}
							{validationState === EValidateListMessage.DUPLICATE_NAME && t('createClanModal.duplicateName')}
						</p>
					)}
					<span className="text-[14px]">
						{t('createClanModal.agreement')} <span className="text-contentBrandLight">{t('createClanModal.communityGuidelines')}</span>
						{'.'}
					</span>
				</div>
			</div>
			<ModalErrorTypeUpload open={openModalError.errorType} onClose={() => seOpenModalError((prev) => ({ ...prev, errorType: false }))} />
			<ModalOverData open={openModalError.errorSize} onClose={() => seOpenModalError((prev) => ({ ...prev, errorSize: false }))} />
		</div>
	);

	return (
		<ModalLayout onClose={handleClose}>
			<div
				className="bg-theme-setting-primary rounded-xl flex flex-col w-[90%] mx-auto sm:w-full"
				data-e2e={generateE2eId('clan_page.modal.create_clan')}
			>
				<div className="flex-1 flex items-center justify-end border-b-theme-primary rounded-t p-4">
					<Button
						className="rounded-full aspect-square w-6 h-6 text-5xl leading-3 !p-0 opacity-50 text-theme-primary-hover"
						onClick={handleClose}
					>
						×
					</Button>
				</div>

				{currentStep === EModalStep.TEMPLATE_SELECTION ? templateSelection() : clanCustomization()}

				<div className="flex items-center border-t-theme-primary rounded-b justify-between px-5 py-4">
					{currentStep === EModalStep.TEMPLATE_SELECTION ? (
						<Button
							className="text-contentBrandLight px-4 py-2 background-transparent font-semibold text-sm outline-none focus:outline-none rounded-lg"
							onClick={onClose}
						>
							{t('createClanModal.back')}
						</Button>
					) : (
						<>
							<Button
								className="text-contentBrandLight px-4 py-2 background-transparent font-semibold text-sm outline-none focus:outline-none rounded-lg"
								onClick={handleBackToTemplates}
							>
								{t('createClanModal.back')}
							</Button>
							<ButtonLoading
								className={`font-semibold btn-primary btn-primary-hover text-sm px-4 py-2 shadow hover:shadow-lg rounded-lg ${validationState !== EValidateListMessage.VALIDATED ? 'opacity-50 cursor-not-allowed' : ''}`}
								onClick={handleCreateClan}
								label={t('createClanModal.create')}
								disabled={validationState !== EValidateListMessage.VALIDATED}
							/>
						</>
					)}
				</div>
			</div>
		</ModalLayout>
	);
};

export default ModalCreateClans;
