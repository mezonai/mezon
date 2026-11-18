import { usePermissionChecker } from '@mezon/core';
import { handleAddAgentToVoice, handleKickAgentFromVoice, selectVoiceInfo, useAppDispatch } from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons20, MzIcons24, SpinningIcon } from '@mezon/ui';
import { EPermission } from '@mezon/utils';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

const AGENT_PENDING_TIMEOUT_MS = 30000;

interface SfuAgentControlProps {
	isExternalCalling?: boolean;
	roomId?: string;
	active?: boolean;
	showHint?: boolean;
	onDismissHint?: () => void;
}

export const SfuAgentControl = memo(({ isExternalCalling, roomId, active = false, showHint = false, onDismissHint }: SfuAgentControlProps) => {
	const { t } = useTranslation('channelVoice');
	const [hasChannelPermission] = usePermissionChecker([EPermission.manageChannel]);
	const voiceInfo = useSelector(selectVoiceInfo);
	const dispatch = useAppDispatch();
	const [target, setTarget] = useState<boolean>();
	const loading = target !== undefined && target !== active;

	useEffect(() => {
		if (target === undefined) return;
		if (target === active) {
			setTarget(undefined);
			return;
		}
		const timer = window.setTimeout(() => setTarget(undefined), AGENT_PENDING_TIMEOUT_MS);
		return () => window.clearTimeout(timer);
	}, [active, target]);

	const handleToggle = useCallback(async () => {
		const channelId = isExternalCalling ? roomId : voiceInfo?.channelId;

		if (!channelId || loading) return;
		const payload = {
			channel_id: isExternalCalling ? '0' : channelId,
			room_name: isExternalCalling ? channelId : '0'
		};

		setTarget(!active);

		try {
			await dispatch(active ? handleKickAgentFromVoice(payload) : handleAddAgentToVoice(payload)).unwrap();
			if (!active) onDismissHint?.();
		} catch {
			setTarget(undefined);
		}
	}, [active, dispatch, isExternalCalling, loading, onDismissHint, roomId, voiceInfo?.channelId]);

	if (!hasChannelPermission && !isExternalCalling) return null;

	return (
		<div className="relative">
			<button
				type="button"
				disabled={loading}
				onClick={() => void handleToggle()}
				aria-label={t(active ? 'removeAgent' : 'addAgent')}
				title={t(active ? 'removeAgent' : 'addAgent')}
				className={`${SFU_CONTROL_BUTTON_CLASS} ${active ? '!bg-blue-500 hover:!bg-blue-600' : ''} ${loading ? 'cursor-default' : ''}`}
			>
				{loading ? <SpinningIcon icon={MzIcons20.mzSpinner} /> : <AgentIcon />}
			</button>
			{showHint && !active && !loading && <AgentHint onDismiss={onDismissHint} />}
		</div>
	);
});

const AgentHint = ({ onDismiss }: { onDismiss?: () => void }) => {
	const { t } = useTranslation('channelVoice');

	return (
		<div className="pointer-events-none absolute bottom-full left-[-16px] z-30 mb-[7px] w-80 max-md:hidden">
			<div className="pointer-events-auto relative rounded-lg border border-white/10 bg-zinc-800 p-4 text-left shadow-xl">
				<div className="flex items-center gap-2">
					<span className="flex h-5 w-5 shrink-0 items-center justify-center">
						<MezonIcon icon={MzIcons20.mzBot} className="text-white" />
					</span>
					<span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{t('agentHint.title')}</span>
					<button
						type="button"
						aria-label={t('mediaPermission.close')}
						className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white"
						onClick={onDismiss}
					>
						<MezonIcon icon={MzIcons16.mzClose} />
					</button>
				</div>
				<p className="mt-2 text-xs text-white/70">{t('agentHint.body')}</p>
				<span
					aria-hidden="true"
					className="absolute -bottom-[5px] left-[40px] h-2 w-2 rotate-45 border-b border-r border-white/10 bg-zinc-800"
				/>
			</div>
		</div>
	);
};

const AgentIcon = () => (
	<>
		<MezonIcon icon={MzIcons24.mzBot} className="text-white max-md:hidden" />
		<MezonIcon icon={MzIcons20.mzBot} className="hidden text-white max-md:block" />
	</>
);
