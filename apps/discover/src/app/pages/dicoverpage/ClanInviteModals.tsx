import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { copyText, trackDiscoverEvent } from './communityUtils';

interface DiscoverDialogProps {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
}

const DiscoverDialog = ({ open, title, onClose, children }: DiscoverDialogProps) => {
	const { t } = useTranslation('discover');
	const titleId = useId();
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
			<button type="button" className="absolute inset-0 bg-black/50" aria-label={t('detail.back')} onClick={onClose} />
			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				className="relative w-full max-w-md bg-white text-[#111827] rounded-lg p-6 shadow-lg max-h-[min(92svh,640px)] overflow-y-auto"
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center text-gray-500 hover:text-gray-700"
					aria-label={t('detail.back')}
				>
					<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
				<h2 id={titleId} className="text-xl font-bold leading-7 pr-8 mb-2 text-left">
					{title}
				</h2>
				{children}
			</div>
		</div>
	);
};

interface JoinClanModalProps {
	open: boolean;
	inviteUrl: string | null;
	clanId?: string;
	onClose: () => void;
}

export const JoinClanModal = ({ open, inviteUrl, clanId, onClose }: JoinClanModalProps) => {
	const { t } = useTranslation('discover');

	const handleJoinNow = () => {
		if (!inviteUrl) {
			toast.error(t('detail.noInvite'));
			trackDiscoverEvent('clan_join_failure', { clan_id: clanId, reason: 'no_invite' });
			return;
		}
		trackDiscoverEvent('clan_join_success', { clan_id: clanId, method: 'direct' });
		window.open(inviteUrl, '_blank', 'noopener,noreferrer');
	};

	return (
		<DiscoverDialog open={open} title={t('joinClan')} onClose={onClose}>
			<p className="text-gray-600 text-sm leading-5 mb-6 text-left">{t('joinModal.subtitle')}</p>
			<div className="space-y-4">
				<div className="text-center p-4 border-2 border-gray-200 rounded-lg">
					<p className="text-gray-700 mb-3 font-medium leading-5">{t('joinModal.scanQr')}</p>
					<div className="flex justify-center mb-3">
						<div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
							{inviteUrl ? (
								<QRCode
									value={inviteUrl}
									size={120}
									fgColor="#000000"
									bgColor="#FFFFFF"
									style={{ height: 'auto', maxWidth: '100%', width: '120px' }}
								/>
							) : (
								<div className="w-[120px] h-[120px] bg-gray-100 rounded" />
							)}
						</div>
					</div>
					<p className="text-xs text-gray-500 leading-4">{t('joinModal.scanHint')}</p>
				</div>

				<div className="text-center p-4 border-2 border-gray-200 rounded-lg">
					<p className="text-gray-700 mb-3 font-medium leading-5">{t('joinModal.openLink')}</p>
					<button
						type="button"
						onClick={handleJoinNow}
						disabled={!inviteUrl}
						className="bg-[#5865f2] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#4752c4] transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{t('joinNow')}
					</button>
					<p className="text-xs text-gray-500 mt-2 leading-4">{t('joinModal.openHint')}</p>
				</div>
			</div>
		</DiscoverDialog>
	);
};

interface ShareClanModalProps {
	open: boolean;
	inviteUrl: string;
	clanName: string;
	clanId?: string;
	onClose: () => void;
}

const FacebookIcon = () => (
	<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.54V9.84c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.75 8.43-4.91 8.43-9.93z" />
	</svg>
);

const RedditIcon = () => (
	<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.25 10.52c.01.24.02.48.02.73 0 2.68-3.13 4.86-7 4.86s-7-2.18-7-4.86c0-.25.01-.49.03-.73A1.57 1.57 0 014.7 10.1c0-.87.7-1.57 1.57-1.57.43 0 .82.17 1.1.45 1.09-.72 2.57-1.18 4.2-1.24L12.5 3.9a.4.4 0 01.47-.31l2.82.67a1.18 1.18 0 11-.23.84l-2.38-.56-.82 3.85c1.58.07 3.01.53 4.08 1.24.28-.27.66-.44 1.09-.44.87 0 1.57.7 1.57 1.57 0 .66-.41 1.22-.85 1.46zM8.7 12.2a.79.79 0 100 1.58.79.79 0 000-1.58zm6.6 2.92c-.86.79-2.24.83-2.24.83s-1.38-.04-2.24-.83a.43.43 0 00-.6.61s1.09 1.05 2.84 1.05 2.84-1.05 2.84-1.05a.43.43 0 00-.6-.61zm-.36-2.13a.79.79 0 100 1.58.79.79 0 000-1.58z" />
	</svg>
);

const TwitterIcon = () => (
	<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 001.88-2.36 8.54 8.54 0 01-2.7 1.03 4.26 4.26 0 00-7.26 3.88A12.1 12.1 0 013 4.9a4.26 4.26 0 001.32 5.68 4.22 4.22 0 01-1.93-.53v.05a4.26 4.26 0 003.42 4.18 4.27 4.27 0 01-1.92.07 4.27 4.27 0 003.98 2.96A8.55 8.55 0 012 19.54a12.06 12.06 0 006.54 1.92c7.85 0 12.14-6.5 12.14-12.14 0-.18 0-.37-.01-.55A8.67 8.67 0 0022.46 6z" />
	</svg>
);

export const ShareClanModal = ({ open, inviteUrl, clanName, clanId, onClose }: ShareClanModalProps) => {
	const { t } = useTranslation('discover');
	const [copied, setCopied] = useState(false);
	const encoded = encodeURIComponent(inviteUrl);
	const encodedName = encodeURIComponent(clanName);

	useEffect(() => {
		if (!open) setCopied(false);
	}, [open]);

	const handleCopy = async () => {
		const ok = await copyText(inviteUrl);
		if (!ok) {
			toast.error(t('copyFailed'));
			return;
		}
		setCopied(true);
		trackDiscoverEvent('clan_share_click', { clan_id: clanId, method: 'copy' });
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<DiscoverDialog open={open} title={t('shareClan')} onClose={onClose}>
			<p className="text-gray-600 text-sm leading-5 mb-4 text-left">{t('shareModal.subtitle')}</p>
			<div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
				<input
					type="text"
					value={inviteUrl}
					readOnly
					className="flex-1 min-w-0 bg-transparent outline-none text-sm text-gray-700"
					onFocus={(event) => event.currentTarget.select()}
				/>
				<button
					type="button"
					onClick={handleCopy}
					className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-md w-[88px] shrink-0 text-sm transition-colors ${
						copied ? 'bg-gray-200 text-gray-600' : 'bg-[#5865f2] text-white hover:bg-[#4752c4]'
					}`}
				>
					<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
						<path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
					</svg>
					{copied ? t('copied') : t('copy')}
				</button>
			</div>
			<div className="mt-6 flex justify-center gap-4 text-gray-400">
				<a
					href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-[#5865f2] transition-colors"
					aria-label="Facebook"
					onClick={() => trackDiscoverEvent('clan_share_click', { clan_id: clanId, method: 'facebook' })}
				>
					<FacebookIcon />
				</a>
				<a
					href={`https://www.reddit.com/submit?url=${encoded}&title=${encodedName}`}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-[#5865f2] transition-colors"
					aria-label="Reddit"
					onClick={() => trackDiscoverEvent('clan_share_click', { clan_id: clanId, method: 'reddit' })}
				>
					<RedditIcon />
				</a>
				<a
					href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedName}`}
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-[#5865f2] transition-colors"
					aria-label="Twitter"
					onClick={() => trackDiscoverEvent('clan_share_click', { clan_id: clanId, method: 'twitter' })}
				>
					<TwitterIcon />
				</a>
			</div>
		</DiscoverDialog>
	);
};
