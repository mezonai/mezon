import { useAuth } from '@mezon/core';
import { createApplication, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ApiAddAppRequest } from 'mezon-js/api.gen';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import type { AppType } from '../../../constants/constants';
import { APP_TYPES } from '../../../constants/constants';

interface ICreateAppPopup {
	togglePopup: () => void;
}

type CreationType = AppType;
const CreateAppPopup = ({ togglePopup }: ICreateAppPopup) => {
	const { t } = useTranslation('adminApplication');
	const [formValues, setFormValues] = useState({
		name: '',
		url: ''
	});
	const [isUrlValid, setIsUrlValid] = useState(true);
	const [isCheckedForPolicy, setIsChecked] = useState(false);
	const [isShadowBot, setIsShadowBot] = useState(false);
	const [notification, setNotification] = useState<React.JSX.Element | null>(null);
	const [creationType, setCreationType] = useState<CreationType>(APP_TYPES.APPLICATION);
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const typeApplication = creationType === APP_TYPES.APPLICATION;
	const typeBot = creationType === APP_TYPES.BOT;

	const isFormValid = !!formValues.name && (creationType === 'bot' || (formValues.url !== '' && isUrlValid)) && isCheckedForPolicy;
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (isLoading) return;

		if (!formValues.name) {
			setNotification(
				<div className="p-3 dark:bg-[#6b373b] bg-[#fbc5c6] border border-red-500 rounded-md">
					{t('createPopup.errors.nameRequired', { type: creationType })}
				</div>
			);
			return;
		}
		if (typeApplication) {
			if (!formValues.url) {
				setNotification(
					<div className="p-3 dark:bg-[#6b373b] bg-[#fbc5c6] border border-red-500 rounded-md">{t('createPopup.errors.urlRequired')}</div>
				);
				return;
			}
			if (!isUrlValid) {
				setNotification(
					<div className="p-3 dark:bg-[#6b373b] bg-[#fbc5c6] border border-red-500 rounded-md">{t('createPopup.errors.invalidUrl')}</div>
				);
				return;
			}
		}

		setNotification(null);
		const cleanedName = formValues.name.trim().replace(/\s+/g, ' ');
		const cleanedUrl = formValues.url.trim();

		const createRequest: ApiAddAppRequest = {
			appname: cleanedName,
			creator_id: userProfile?.user?.id ?? '',
			role: 0,
			is_shadow: isShadowBot,
			app_url: typeApplication ? cleanedUrl : ''
		};

		try {
			setIsLoading(true);
			const response = (await dispatch(createApplication({ request: createRequest }))) as { payload?: { id?: string; token?: string } };

			if (response?.payload?.id) {
				if (response?.payload?.token) {
					localStorage.setItem(`app_token_${response.payload.id}`, response.payload.token);
				}
				navigate(`/developers/applications/${response?.payload?.id}/information`);
				togglePopup();
			} else {
				toast.error(t('createPopup.errors.createFailed'));
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : '';
			toast.error(t('createPopup.errors.unexpectedError', { message: errorMessage }));
		} finally {
			setIsLoading(false);
		}
	};

	const handleTogglePolicyCheckBox = () => {
		setIsChecked(!isCheckedForPolicy);
	};

	const handleCheckForShadow = () => {
		const newShadowBotState = !isShadowBot;
		setIsShadowBot(newShadowBotState);

		if (newShadowBotState) {
			setNotification(
				<div className="p-3 dark:bg-[#3a4a5c] bg-[#e3f2fd] border dark:border-blue-400 border-blue-500 rounded-md">
					{t('createPopup.notifications.shadowModeInfo')}
				</div>
			);
		} else {
			setNotification(null);
		}
	};

	const handleInputOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormValues((prev) => ({
			...prev,
			[name]: value
		}));

		if (name === 'url') {
			try {
				new URL(value);
				setIsUrlValid(true);
			} catch {
				setIsUrlValid(false);
			}
		}
	};

	const handleCreationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedType = e.target.value as CreationType;
		setCreationType(selectedType);
		setNotification(null);
		if (selectedType === APP_TYPES.BOT) {
			setFormValues((prev) => ({ ...prev, url: '' }));
			setIsUrlValid(true);
			return;
		}
		setIsShadowBot(false);
	};
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				togglePopup();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [togglePopup]);

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50 bg-[#000000c9]">
			<form className="relative z-10 w-[450px]" onSubmit={handleSubmit}>
				<div className="dark:bg-[#313338] bg-white pt-[16px] px-[16px] flex flex-col gap-5 pb-5 rounded-t-md">
					<div className=" text-[20px] font-semibold">{t(typeApplication ? 'createPopup.title.application' : 'createPopup.title.bot')}</div>
					{notification}
					<div className="flex flex-col gap-2">
						<div className="text-[12px] font-semibold">
							{t('createPopup.form.type.label')} <span className="text-red-600">*</span>
						</div>
						<select
							value={creationType}
							onChange={handleCreationTypeChange}
							className="bg-bgLightModeThird dark:bg-[#1e1f22] outline-primary p-[10px] rounded-sm"
						>
							<option value={APP_TYPES.APPLICATION}>{t('createPopup.form.type.options.createApplication')}</option>
							<option value={APP_TYPES.BOT}>{t('createPopup.form.type.options.createBot')}</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<div className="text-[12px] font-semibold">
							{t('createPopup.form.name.label')} <span className="text-red-600">*</span>
						</div>
						<input
							name="name"
							value={formValues.name}
							onChange={handleInputOnchange}
							type="text"
							className="bg-bgLightModeThird dark:bg-[#1e1f22] outline-primary p-[10px] rounded-sm"
						/>
					</div>
					{typeApplication && (
						<div className="flex flex-col gap-2">
							<div className="text-[12px] font-semibold">
								{t('createPopup.form.url.label')} <span className="text-red-600">*</span>
							</div>
							<input
								name="url"
								value={formValues.url}
								onChange={handleInputOnchange}
								type="text"
								className="bg-bgLightModeThird dark:bg-[#1e1f22] outline-primary p-[10px] rounded-sm"
							/>
							{!isUrlValid && <div className="text-red-500 text-sm">{t('createPopup.errors.invalidUrl')}</div>}
						</div>
					)}
					{typeBot && (
						<div className="flex gap-2">
							<input checked={isShadowBot} onChange={handleCheckForShadow} type="checkbox" className="w-6" />
							<div className="flex-1 flex gap-1">
								<span>{t('createPopup.form.shadowBot')} </span>
								<Icons.ShadowBotIcon className="w-6" />
							</div>
						</div>
					)}
					<div className="flex gap-2">
						<input checked={isCheckedForPolicy} onChange={handleTogglePolicyCheckBox} type="checkbox" className="w-6" />
						<div className="flex-1">
							{t('createPopup.form.agreement.text')}{' '}
							<span className="text-blue-500 hover:underline">{t('createPopup.form.agreement.termsOfService')}</span>{' '}
							{t('createPopup.form.agreement.and')}{' '}
							<span className="text-blue-500 hover:underline">{t('createPopup.form.agreement.policy')}</span>
						</div>
					</div>
				</div>
				<div className="bg-white dark:bg-[#313338]   flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium border-t dark:border-[#1e1f22]  rounded-b-md">
					<div className="hover:underline cursor-pointer text-zinc-800 dark:text-zinc-200" onClick={togglePopup}>
						{t('createPopup.buttons.cancel')}
					</div>
					<button
						type="submit"
						disabled={!isFormValid || isLoading}
						className={`rounded px-[20px] py-[9px] cursor-pointer text-white ${isFormValid && !isLoading ? 'bg-blue-600 hover:bg-blue-800' : 'bg-gray-400 cursor-not-allowed'}`}
					>
						{isLoading ? t('createPopup.buttons.creating') : t('createPopup.buttons.create')}
					</button>
				</div>
			</form>
		</div>
	);
};

export default CreateAppPopup;
