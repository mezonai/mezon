import { fetchStreamPlayback, useAppDispatch } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import type { ApiGetStreamPlaybackResponse } from 'mezon-js';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import CopyButtonComponent from '../../../ButtonSwitchCustom/CopyButtonComponent';

const OBS_STEP_KEYS = ['obsStepService', 'obsStepPaste', 'obsStepEncoder', 'obsStepSimulcast', 'obsStepStart'];

const SECONDARY_BUTTON_CLASS =
	'h-fit rounded-lg px-4 py-1 cursor-pointer border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover';

const formatRemaining = (ms: number) => {
	const seconds = Math.max(0, Math.ceil(ms / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

export const StreamKey = ({ channelId }: { channelId: string }) => {
	const { t } = useTranslation('setting');
	const dispatch = useAppDispatch();
	const [streamKey, setStreamKey] = useState<ApiGetStreamPlaybackResponse | null>();
	const [loading, setLoading] = useState(false);
	const [revealed, setRevealed] = useState(false);

	const handleGetKey = async () => {
		if (!channelId || loading) return;
		setLoading(true);
		setRevealed(false);
		setStreamKey(await dispatch(fetchStreamPlayback({ channelId, publish: true })).unwrap());
		setLoading(false);
	};

	return (
		<>
			<section className="rounded-lg bg-theme-setting-nav p-6 flex flex-col gap-4">
				<div>
					<h2 className="text-lg font-bold text-theme-primary-active tracking-wide">{t('streaming.keyTitle')}</h2>
					<p className="mt-1 text-xs text-theme-primary-hover">{t('streaming.keyDescription')}</p>
				</div>

				{streamKey && (
					<div className="rounded-md bg-theme-setting-primary shadow p-4 flex flex-col gap-4">
						<KeyRow label={t('streaming.server')} value={streamKey.whip_url}>
							<CopyButtonComponent title={t('streaming.copy')} copyText={streamKey.whip_url} />
						</KeyRow>
						<KeyRow label={t('streaming.token')} value={revealed ? streamKey.token : '•'.repeat(32)}>
							<button
								className={SECONDARY_BUTTON_CLASS}
								onClick={() => setRevealed((prev) => !prev)}
								data-e2e={generateE2eId('channel_setting_page.streaming.reveal')}
							>
								{revealed ? t('streaming.hide') : t('streaming.show')}
							</button>
							<CopyButtonComponent title={t('streaming.copy')} copyText={streamKey.token} />
						</KeyRow>
						<KeyExpiry key={streamKey.expires_at} expiresAt={Number(streamKey.expires_at) * 1000} />
					</div>
				)}
				{streamKey === null && <p className="text-xs text-red-500">{t('streaming.error')}</p>}

				<button
					onClick={handleGetKey}
					disabled={!channelId || loading}
					className="btn-primary btn-primary-hover flex w-fit items-center gap-2 rounded-lg px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
					data-e2e={generateE2eId('channel_setting_page.streaming.get_key')}
				>
					{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
					{streamKey ? t('streaming.regenerate') : t('streaming.getKey')}
				</button>
			</section>
			<section className="mt-6 rounded-lg bg-theme-setting-nav p-6 text-sm text-theme-primary">
				<h2 className="text-lg font-bold text-theme-primary-active tracking-wide">{t('streaming.obsTitle')}</h2>
				<ol className="mt-3 list-decimal pl-5 flex flex-col gap-2">
					{OBS_STEP_KEYS.map((key) => (
						<li key={key}>{t(`streaming.${key}`)}</li>
					))}
				</ol>
			</section>
		</>
	);
};

function KeyRow({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-4">
			<div className="min-w-0">
				<h4 className="uppercase font-bold text-xs mb-1">{label}</h4>
				<p className="font-mono text-xs break-all">{value}</p>
			</div>
			<div className="flex shrink-0 items-center gap-2">{children}</div>
		</div>
	);
}

function KeyExpiry({ expiresAt }: { expiresAt: number }) {
	const { t } = useTranslation('setting');
	const [now, setNow] = useState(() => Date.now());
	const remainingMs = expiresAt - now;

	useEffect(() => {
		const timer = setInterval(() => {
			const current = Date.now();
			setNow(current);
			if (current >= expiresAt) clearInterval(timer);
		}, 1000);
		return () => clearInterval(timer);
	}, [expiresAt]);

	return (
		<p className={`text-xs ${remainingMs > 0 ? 'text-theme-primary-hover' : 'text-red-500'}`}>
			{remainingMs > 0 ? t('streaming.expiresIn', { time: formatRemaining(remainingMs) }) : t('streaming.expired')}
		</p>
	);
}
