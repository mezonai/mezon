import { clansActions, selectCurrentClan, selectCurrentClanDirectVoiceAccess, toastActions, useAppDispatch } from '@mezon/store';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type VoiceAccessProps = {
	currentClanId: string;
};

const VoiceAccess = ({ currentClanId }: VoiceAccessProps) => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('clanSettings');
	const currentClan = useSelector(selectCurrentClan);
	const currentDirectVoiceAccess = useSelector(selectCurrentClanDirectVoiceAccess);

	const [directVoiceAccess, setDirectVoiceAccess] = useState<boolean>(currentDirectVoiceAccess);
	const [saving, setSaving] = useState<boolean>(false);

	useEffect(() => {
		setDirectVoiceAccess(currentDirectVoiceAccess);
	}, [currentClan?.clan_id, currentDirectVoiceAccess]);

	const handleToggle = async () => {
		if (!currentClanId || !currentClan || saving) return;
		const prevValue = directVoiceAccess;
		const nextValue = !prevValue;
		setDirectVoiceAccess(nextValue);
		setSaving(true);
		try {
			await dispatch(
				clansActions.updateClan({
					clan_id: currentClanId,
					request: {
						banner: currentClan.banner ?? '',
						clan_name: currentClan.clan_name ?? '',
						creator_id: currentClan.creator_id ?? '',
						logo: currentClan.logo ?? '',
						welcome_channel_id: currentClan.welcome_channel_id ?? '',
						prevent_anonymous: !!currentClan.prevent_anonymous,
						direct_voice_access: nextValue
					}
				})
			).unwrap();
		} catch (error) {
			console.error('Failed to update direct voice access:', error);
			setDirectVoiceAccess(prevValue);
			dispatch(
				toastActions.addToast({
					message: t('voiceAccess.updateError'),
					type: 'error',
					autoClose: 3000
				})
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="pt-2 pb-10">
			<div className="flex items-start justify-between gap-6 rounded-lg border border-theme-primary bg-theme-setting-nav p-4">
				<div className="flex flex-col gap-1.5 min-w-0">
					<span className="text-base font-semibold text-theme-primary-active">{t('voiceAccess.directVoiceAccessTitle')}</span>
					<span className="text-sm text-theme-primary">{t('voiceAccess.directVoiceAccessDesc')}</span>
				</div>
				<button
					type="button"
					role="switch"
					aria-checked={directVoiceAccess}
					aria-label={t('voiceAccess.directVoiceAccessTitle')}
					disabled={saving}
					onClick={() => void handleToggle()}
					className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-60 ${
						directVoiceAccess ? 'bg-indigo-500' : 'bg-gray-500/60'
					}`}
				>
					<span
						className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
							directVoiceAccess ? 'translate-x-5' : 'translate-x-0'
						}`}
					/>
				</button>
			</div>
		</div>
	);
};

export default VoiceAccess;
