import type { StreamQuality } from '@mezon/store';
import {
	STREAM_QUALITIES,
	fetchStreamPlayback,
	saveDefaultStreamQuality,
	selectAllChannelsByUser,
	selectCurrentClanId,
	selectStreamDefaultQuality,
	useAppDispatch,
	videoStreamActions
} from '@mezon/store';
import { Icons, Menu } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import type { ApiGetStreamPlaybackResponse } from 'mezon-js';
import { ChannelType } from 'mezon-js';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import CopyButtonComponent from '../ButtonSwitchCustom/CopyButtonComponent';
import { STREAM_QUALITY_LABEL_KEYS } from '../StreamPlayer/StreamStage';

const OBS_STEP_KEYS = ['obsStepService', 'obsStepPaste', 'obsStepEncoder', 'obsStepSimulcast', 'obsStepStart'];

const SECONDARY_BUTTON_CLASS =
	'h-fit rounded-lg px-4 py-1 cursor-pointer border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover';

const formatRemaining = (ms: number) => {
	const seconds = Math.max(0, Math.ceil(ms / 1000));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

type KeyResult = { channelId: string; playback: ApiGetStreamPlaybackResponse | null };

interface ISettingStreamingProps {
	menuIsOpen: boolean;
}

export const SettingStreaming = ({ menuIsOpen }: ISettingStreamingProps) => {
	const { t } = useTranslation(['setting', 'channelStream']);
	const dispatch = useAppDispatch();
	const channelsByUser = useSelector(selectAllChannelsByUser);
	const currentClanId = useSelector(selectCurrentClanId);
	const defaultQuality = useSelector(selectStreamDefaultQuality);
	const streamChannels = useMemo(() => channelsByUser.filter((channel) => channel.type === ChannelType.CHANNEL_TYPE_STREAMING), [channelsByUser]);
	const [pickedChannelId, setPickedChannelId] = useState('');
	const selectedChannel =
		streamChannels.find((channel) => channel.channel_id === pickedChannelId) ??
		streamChannels.find((channel) => channel.clan_id === currentClanId) ??
		streamChannels[0];
	const selectedChannelId = selectedChannel?.channel_id ?? '';
	const [result, setResult] = useState<KeyResult | null>(null);
	const [loadingChannelId, setLoadingChannelId] = useState('');
	const [revealed, setRevealed] = useState(false);
	const requestRef = useRef(0);
	const shownResult = result?.channelId === selectedChannelId ? result : null;
	const streamKey = shownResult?.playback ?? null;
	const loading = selectedChannelId !== '' && loadingChannelId === selectedChannelId;

	const channelMenu = useMemo(
		() => (
			<>
				{streamChannels.map((channel) => (
					<Menu.Item
						key={channel.id}
						className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-left text-sm bg-item-hover transition-colors"
						onClick={() => {
							setPickedChannelId(channel.id);
							setRevealed(false);
						}}
					>
						<Icons.Stream defaultSize="h-4 w-4" className="shrink-0" />
						<span className="truncate">{channel.channel_label}</span>
						<span className="ml-auto shrink-0 pl-4 text-xs text-theme-primary-hover">{channel.clan_name}</span>
					</Menu.Item>
				))}
			</>
		),
		[streamChannels]
	);

	const handleGetKey = async () => {
		const channelId = selectedChannelId;
		if (!channelId || loading) return;
		const request = ++requestRef.current;
		setPickedChannelId(channelId);
		setLoadingChannelId(channelId);
		setRevealed(false);
		const playback = await dispatch(fetchStreamPlayback({ channelId, publish: true })).unwrap();
		if (request !== requestRef.current) return;
		setLoadingChannelId('');
		setResult({ channelId, playback });
	};

	const handleDefaultQuality = (quality: StreamQuality) => {
		saveDefaultStreamQuality(quality);
		dispatch(videoStreamActions.setDefaultQuality(quality));
	};

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('setting:appSettings.streaming')}</h1>

			<section className="rounded-lg bg-theme-setting-nav p-6 flex flex-col gap-4">
				<div>
					<h2 className="text-lg font-bold text-theme-primary-active tracking-wide">{t('setting:streaming.keyTitle')}</h2>
					<p className="mt-1 text-xs text-theme-primary-hover">{t('setting:streaming.keyDescription')}</p>
				</div>
				<div className="flex flex-col gap-2">
					<h4 className="uppercase font-bold text-xs">{t('setting:streaming.channel')}</h4>
					{selectedChannel ? (
						<Menu menu={channelMenu} className="max-h-60 overflow-y-auto">
							<div
								className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-theme-primary bg-theme-setting-primary px-3"
								data-e2e={generateE2eId('user_setting.streaming.channel')}
							>
								<span className="flex min-w-0 items-center gap-2">
									<Icons.Stream defaultSize="h-4 w-4" className="shrink-0" />
									<span className="truncate">{selectedChannel.channel_label}</span>
									<span className="shrink-0 text-xs text-theme-primary-hover">{selectedChannel.clan_name}</span>
								</span>
								<Icons.ArrowDownFill />
							</div>
						</Menu>
					) : (
						<div className="flex h-10 w-full items-center rounded-md border border-theme-primary bg-theme-setting-primary px-3 text-theme-primary-hover">
							{t('setting:streaming.noChannels')}
						</div>
					)}
				</div>

				{streamKey && (
					<div className="rounded-md bg-theme-setting-primary shadow p-4 flex flex-col gap-4">
						<KeyRow label={t('setting:streaming.server')} value={streamKey.whip_url}>
							<CopyButtonComponent title={t('setting:streaming.copy')} copyText={streamKey.whip_url} />
						</KeyRow>
						<KeyRow label={t('setting:streaming.token')} value={revealed ? streamKey.token : '•'.repeat(32)}>
							<button
								className={SECONDARY_BUTTON_CLASS}
								onClick={() => setRevealed((prev) => !prev)}
								data-e2e={generateE2eId('user_setting.streaming.reveal')}
							>
								{revealed ? t('setting:streaming.hide') : t('setting:streaming.show')}
							</button>
							<CopyButtonComponent title={t('setting:streaming.copy')} copyText={streamKey.token} />
						</KeyRow>
						<KeyExpiry key={streamKey.expires_at} expiresAt={Number(streamKey.expires_at) * 1000} />
					</div>
				)}
				{shownResult && !streamKey && <p className="text-xs text-red-500">{t('setting:streaming.error')}</p>}

				<button
					onClick={handleGetKey}
					disabled={!selectedChannelId || loading}
					className="btn-primary btn-primary-hover flex w-fit items-center gap-2 rounded-lg px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
					data-e2e={generateE2eId('user_setting.streaming.get_key')}
				>
					{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
					{streamKey ? t('setting:streaming.regenerate') : t('setting:streaming.getKey')}
				</button>
			</section>

			<section className="mt-6 rounded-lg bg-theme-setting-nav p-6">
				<h2 className="text-lg font-bold text-theme-primary-active tracking-wide">{t('setting:streaming.obsTitle')}</h2>
				<ol className="mt-3 list-decimal pl-5 flex flex-col gap-2">
					{OBS_STEP_KEYS.map((key) => (
						<li key={key}>{t(`setting:streaming.${key}`)}</li>
					))}
				</ol>
			</section>

			<section className="mt-6 rounded-lg bg-theme-setting-nav p-6">
				<h2 className="text-lg font-bold text-theme-primary-active tracking-wide">{t('setting:streaming.qualityTitle')}</h2>
				<p className="mt-1 text-xs text-theme-primary-hover">{t('setting:streaming.qualityDescription')}</p>
				<div className="mt-4 flex flex-col gap-3" role="radiogroup" aria-label={t('setting:streaming.qualityTitle')}>
					{STREAM_QUALITIES.map((quality) => (
						<button
							key={quality}
							type="button"
							role="radio"
							aria-checked={defaultQuality === quality}
							onClick={() => handleDefaultQuality(quality)}
							className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors ${
								defaultQuality === quality
									? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
									: 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
							}`}
							data-e2e={generateE2eId('user_setting.streaming.quality_item')}
						>
							<span className="text-theme-primary font-medium">{t(STREAM_QUALITY_LABEL_KEYS[quality])}</span>
							<span
								className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center ${
									defaultQuality === quality ? 'border-blue-500' : 'border-gray-400'
								}`}
							>
								{defaultQuality === quality && <span className="w-2 h-2 rounded-full bg-blue-500" />}
							</span>
						</button>
					))}
				</div>
			</section>
		</div>
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
