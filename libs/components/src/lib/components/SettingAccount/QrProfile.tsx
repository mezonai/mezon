import { useAuth } from '@mezon/core';
import { useTheme } from '@mezon/themes';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { ModalLayout } from '../../components';
import { AvatarImage } from '../AvatarImage/AvatarImage';

const DEFAULT_LOGO = 'https://cdn.komu.vn/images/mezon_logo.png';
const QR_SIZE = 260;
const LOGO_SIZE = 50;

interface QrProfileProps {
	onClose: () => void;
	qrData: string;
}

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
};

const drawThemeBackground = (
	ctx: CanvasRenderingContext2D,
	cardWidth: number,
	cardHeight: number,
	themeName: string,
	computedBg?: string
): { isDark: boolean; textColor: string; secondaryColor: string } => {
	const isLight = themeName === 'light' || themeName === 'sunrise' || themeName === 'cisher';

	ctx.save();
	drawRoundedRect(ctx, 0, 0, cardWidth, cardHeight, 28);
	ctx.clip();

	switch (themeName) {
		case 'light': {
			ctx.fillStyle = '#f8fafc';
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'sunrise': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#e0c3fc');
			grad.addColorStop(0.35, '#fbc2eb');
			grad.addColorStop(0.7, '#fcd5ce');
			grad.addColorStop(1, '#fff1eb');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'cisher': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#fef08a');
			grad.addColorStop(0.5, '#fed7aa');
			grad.addColorStop(1, '#ffedd5');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'redDark': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#2a0505');
			grad.addColorStop(0.5, '#450a0a');
			grad.addColorStop(1, '#5c0d11');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'purple_haze': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#190a28');
			grad.addColorStop(0.5, '#2e1065');
			grad.addColorStop(1, '#3b0764');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'abyss_dark': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#0a0e1a');
			grad.addColorStop(0.5, '#172554');
			grad.addColorStop(1, '#311042');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'berrynade': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#2e081f');
			grad.addColorStop(0.5, '#3b1808');
			grad.addColorStop(1, '#4a2b08');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'sunset': {
			const grad = ctx.createLinearGradient(0, 0, cardWidth, cardHeight);
			grad.addColorStop(0, '#1c0f33');
			grad.addColorStop(0.5, '#2e1438');
			grad.addColorStop(1, '#451f28');
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
		case 'dark':
		default: {
			if (computedBg && (computedBg.startsWith('#') || computedBg.startsWith('rgb'))) {
				ctx.fillStyle = computedBg;
			} else {
				ctx.fillStyle = '#26272b';
			}
			ctx.fillRect(0, 0, cardWidth, cardHeight);
			break;
		}
	}

	ctx.restore();

	return {
		isDark: !isLight,
		textColor: isLight ? '#0f172a' : '#ffffff',
		secondaryColor: isLight ? '#475569' : '#94a3b8'
	};
};

const loadImage = (src: string): Promise<HTMLImageElement | null> => {
	if (!src) return Promise.resolve(null);
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => resolve(img);
		img.onerror = () => {
			if (src.startsWith('data:')) {
				const img2 = new Image();
				img2.onload = () => resolve(img2);
				img2.onerror = () => resolve(null);
				img2.src = src;
			} else {
				resolve(null);
			}
		};
		img.src = src;
	});
};

const loadAvatarImage = async (url: string): Promise<HTMLImageElement | null> => {
	if (!url) return null;
	const proxyUrl = createImgproxyUrl(url, { width: 120, height: 120, resizeType: 'fit' });
	let img = await loadImage(proxyUrl);
	if (!img) {
		img = await loadImage(url);
	}
	return img;
};

const QrProfile = ({ onClose, qrData }: QrProfileProps) => {
	const { userProfile } = useAuth();
	const { currentTheme } = useTheme();
	const { t } = useTranslation('accountSetting');

	const containerRef = useRef<HTMLDivElement | null>(null);
	const modalCardRef = useRef<HTMLDivElement | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const menuRef = useRef<HTMLDivElement | null>(null);

	const [centerLogo, setCenterLogo] = useState<string>(DEFAULT_LOGO);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isCopiedImg, setIsCopiedImg] = useState(false);
	const [isCopiedLink, setIsCopiedLink] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const displayName = userProfile?.user?.display_name || userProfile?.user?.username || 'Mezon User';
	const username = userProfile?.user?.username || '';
	const avatarUrl = userProfile?.user?.avatar_url || '';

	useEffect(() => {
		if (!isMenuOpen) return;
		const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener('mousedown', handleOutsideClick, true);
		document.addEventListener('touchstart', handleOutsideClick, true);

		return () => {
			document.removeEventListener('mousedown', handleOutsideClick, true);
			document.removeEventListener('touchstart', handleOutsideClick, true);
		};
	}, [isMenuOpen]);

	const handleSelectLogo = useCallback(() => {
		setIsMenuOpen(false);
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (ev) => {
				const result = ev.target?.result;
				if (typeof result === 'string') {
					setCenterLogo(result);
					toast.success(t('qrProfile.logoUpdatedSuccess'));
				}
			};
			reader.readAsDataURL(file);
			e.target.value = '';
		},
		[t]
	);

	const handleUseAvatar = useCallback(() => {
		setIsMenuOpen(false);
		if (avatarUrl) {
			setCenterLogo(avatarUrl);
			toast.success(t('qrProfile.avatarAppliedSuccess'));
		} else {
			toast.info(t('qrProfile.noAvatar'));
		}
	}, [avatarUrl, t]);

	const handleResetLogo = useCallback(() => {
		setIsMenuOpen(false);
		setCenterLogo(DEFAULT_LOGO);
		toast.info(t('qrProfile.logoResetDefault'));
	}, [t]);

	const buildCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
		if (!containerRef.current) return null;
		const svg = containerRef.current.querySelector('svg');
		if (!svg) return null;

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svg);
		const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

		const [qrImg, logoImg, mezonLogoImg, userAvatarImg] = await Promise.all([
			loadImage(svgBase64),
			loadImage(centerLogo),
			loadImage(DEFAULT_LOGO),
			loadAvatarImage(avatarUrl)
		]);

		if (!qrImg) return null;

		const cardWidth = 380;
		const cardHeight = 550;
		const scale = 3;
		const canvas = document.createElement('canvas');
		canvas.width = cardWidth * scale;
		canvas.height = cardHeight * scale;

		const ctx = canvas.getContext('2d');
		if (!ctx) return null;
		ctx.scale(scale, scale);

		let domBgColor = '';
		if (modalCardRef.current) {
			const comp = window.getComputedStyle(modalCardRef.current);
			if (comp.backgroundColor && comp.backgroundColor !== 'transparent' && comp.backgroundColor !== 'rgba(0, 0, 0, 0)') {
				domBgColor = comp.backgroundColor;
			}
		}

		const themeStyle = drawThemeBackground(ctx, cardWidth, cardHeight, currentTheme || 'dark', domBgColor);

		ctx.lineWidth = 1.5;
		ctx.strokeStyle = themeStyle.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
		ctx.stroke();

		const badgeW = 96;
		const badgeH = 26;
		const badgeX = (cardWidth - badgeW) / 2;
		const badgeY = 20;
		drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 13);
		ctx.fillStyle = themeStyle.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
		ctx.fill();

		ctx.beginPath();
		ctx.arc(badgeX + 15, badgeY + badgeH / 2, 3.5, 0, Math.PI * 2);
		ctx.fillStyle = '#10b981';
		ctx.fill();

		ctx.fillStyle = themeStyle.textColor;
		ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('MEZON QR', badgeX + 54, badgeY + 17);

		const infoY = 60;
		ctx.fillStyle = themeStyle.secondaryColor;
		ctx.font = '500 12px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText(t('qrProfile.scanToConnect'), cardWidth / 2, infoY);

		const avatarDrawSize = 32;
		const gap = 8;
		ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
		const nameMetrics = ctx.measureText(displayName);
		const nameWidth = nameMetrics.width;
		const totalRowWidth = avatarDrawSize + gap + nameWidth;
		const rowStartX = (cardWidth - totalRowWidth) / 2;
		const rowCenterY = infoY + 24;

		const avX = rowStartX;
		const avY = rowCenterY - avatarDrawSize / 2;

		if (userAvatarImg) {
			ctx.save();
			ctx.beginPath();
			ctx.arc(avX + avatarDrawSize / 2, rowCenterY, avatarDrawSize / 2, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			ctx.drawImage(userAvatarImg, avX, avY, avatarDrawSize, avatarDrawSize);
			ctx.restore();
		} else {
			ctx.fillStyle = '#6366f1';
			ctx.beginPath();
			ctx.arc(avX + avatarDrawSize / 2, rowCenterY, avatarDrawSize / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText((displayName || 'U')[0].toUpperCase(), avX + avatarDrawSize / 2, rowCenterY + 5);
		}

		ctx.strokeStyle = themeStyle.isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.4)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(avX + avatarDrawSize / 2, rowCenterY, avatarDrawSize / 2, 0, Math.PI * 2);
		ctx.stroke();

		ctx.fillStyle = themeStyle.textColor;
		ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText(displayName, avX + avatarDrawSize + gap, rowCenterY + 6);

		if (username) {
			const userTagY = rowCenterY + 22;
			ctx.fillStyle = '#818cf8';
			ctx.font = '600 12px system-ui, -apple-system, sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(`@${username}`, cardWidth / 2, userTagY);
		}

		const qrCardX = 24;
		const qrCardY = 124;
		const qrCardW = cardWidth - 48;
		const qrRenderSize = 260;
		const qrCardH = 370;

		ctx.save();
		ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
		ctx.shadowBlur = 24;
		ctx.shadowOffsetY = 8;
		drawRoundedRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 22);
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.restore();

		if (mezonLogoImg) {
			ctx.save();
			drawRoundedRect(ctx, qrCardX + 16, qrCardY + 14, 20, 20, 5);
			ctx.clip();
			ctx.drawImage(mezonLogoImg, qrCardX + 16, qrCardY + 14, 20, 20);
			ctx.restore();
		}
		ctx.fillStyle = '#0f172a';
		ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'left';
		ctx.fillText('MEZON', qrCardX + 42, qrCardY + 29);

		drawRoundedRect(ctx, qrCardX + qrCardW - 88, qrCardY + 13, 72, 22, 11);
		ctx.fillStyle = '#eef2ff';
		ctx.fill();
		ctx.fillStyle = '#4f46e5';
		ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('PROFILE QR', qrCardX + qrCardW - 52, qrCardY + 27);

		ctx.strokeStyle = '#f1f5f9';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(qrCardX + 14, qrCardY + 44);
		ctx.lineTo(qrCardX + qrCardW - 14, qrCardY + 44);
		ctx.stroke();

		const qrX = (cardWidth - qrRenderSize) / 2;
		const qrY = qrCardY + 52;
		ctx.drawImage(qrImg, qrX, qrY, qrRenderSize, qrRenderSize);

		if (logoImg) {
			const lSize = 52;
			const lx = (cardWidth - lSize) / 2;
			const ly = qrY + (qrRenderSize - lSize) / 2;

			drawRoundedRect(ctx, lx - 3, ly - 3, lSize + 6, lSize + 6, 13);
			ctx.fillStyle = '#ffffff';
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 2;
			ctx.stroke();

			ctx.save();
			drawRoundedRect(ctx, lx, ly, lSize, lSize, 11);
			ctx.clip();
			ctx.drawImage(logoImg, lx, ly, lSize, lSize);
			ctx.restore();
		}

		ctx.strokeStyle = '#f1f5f9';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(qrCardX + 14, qrCardY + qrCardH - 38);
		ctx.lineTo(qrCardX + qrCardW - 14, qrCardY + qrCardH - 38);
		ctx.stroke();

		ctx.fillStyle = '#6366f1';
		ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('SCAN • CONNECT', cardWidth / 2, qrCardY + qrCardH - 18);

		ctx.fillStyle = themeStyle.isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)';
		ctx.font = '500 11px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.fillText('mezon.ai', cardWidth / 2, cardHeight - 16);

		return canvas;
	}, [avatarUrl, centerLogo, currentTheme, displayName, t, username]);

	const handleCopyQR = useCallback(async () => {
		if (isCopiedImg) return;
		const canvas = await buildCanvas();
		if (!canvas) return;
		canvas.toBlob(async (blob) => {
			if (!blob) return;
			try {
				await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
				toast.success(t('qrProfile.qrCopiedSuccess'));
				setIsCopiedImg(true);
				setTimeout(() => setIsCopiedImg(false), 2000);
			} catch (err) {
				console.error(err);
			}
		});
	}, [buildCanvas, isCopiedImg, t]);

	const handleCopyLink = useCallback(async () => {
		if (isCopiedLink) return;
		try {
			await navigator.clipboard.writeText(qrData);
			toast.success(t('qrProfile.profileLinkCopied'));
			setIsCopiedLink(true);
			setTimeout(() => setIsCopiedLink(false), 2000);
		} catch (err) {
			console.error(err);
		}
	}, [isCopiedLink, qrData, t]);

	const handleDownloadQR = useCallback(async () => {
		if (isDownloading) return;
		setIsDownloading(true);
		const canvas = await buildCanvas();
		if (!canvas) {
			setIsDownloading(false);
			return;
		}
		canvas.toBlob((blob) => {
			if (!blob) {
				setIsDownloading(false);
				return;
			}
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `mezon-qr-${username || 'profile'}.png`;
			a.click();
			URL.revokeObjectURL(url);
			setIsDownloading(false);
			toast.success(t('qrProfile.qrDownloaded'));
		});
	}, [buildCanvas, isDownloading, t, username]);

	return (
		<ModalLayout onClose={onClose}>
			<div
				ref={modalCardRef}
				className="relative flex flex-col items-center rounded-[32px] overflow-hidden shadow-2xl select-none bg-theme-primary text-theme-primary border-theme-primary"
				style={{
					width: 380
				}}
			>
				<div className="w-full flex items-center justify-between px-5 pt-5 pb-2 z-20">
					<button
						type="button"
						onClick={onClose}
						className="w-9 h-9 flex items-center justify-center rounded-full bg-theme-setting-nav bg-item-theme-hover text-theme-primary transition-colors cursor-pointer border-theme-primary"
						aria-label={t('qrProfile.close')}
					>
						<Icons.Close className="w-4 h-4 text-theme-primary" />
					</button>

					<div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-theme-setting-nav border-theme-primary">
						<div className="w-2 h-2 rounded-full bg-emerald-400" />
						<span className="text-[11px] font-semibold tracking-wider text-theme-primary uppercase">Mezon QR</span>
					</div>
					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={() => setIsMenuOpen((prev) => !prev)}
							className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer border-theme-primary ${
								isMenuOpen ? 'bg-indigo-600 text-white shadow-md' : 'bg-theme-setting-nav bg-item-theme-hover text-theme-primary'
							}`}
							title={t('qrProfile.customizeLogo')}
							aria-label={t('qrProfile.customizeLogo')}
						>
							<Icons.PenEdit className="w-4 h-4" />
						</button>
						{isMenuOpen && (
							<div
								className="absolute right-0 mt-2 w-56 rounded-xl bg-theme-setting-nav border-theme-primary shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-theme-primary"
								style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
							>
								<div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-theme-secondary">
									{t('qrProfile.centerLogo')}
								</div>

								<button
									type="button"
									onClick={handleSelectLogo}
									className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-primary bg-item-theme-hover transition-colors text-left w-full cursor-pointer"
								>
									<Icons.UploadImageIcon className="w-6 h-6 text-indigo-400 shrink-0" />
									<span>{t('qrProfile.chooseFromDevice')}</span>
								</button>

								{avatarUrl && (
									<button
										type="button"
										onClick={handleUseAvatar}
										className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-primary bg-item-theme-hover transition-colors text-left w-full cursor-pointer"
									>
										<Icons.AvatarUser className="w-4 h-4 text-emerald-400 shrink-0" />
										<span>{t('qrProfile.useMyAvatar')}</span>
									</button>
								)}

								{centerLogo !== DEFAULT_LOGO && (
									<button
										type="button"
										onClick={handleResetLogo}
										className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-primary bg-item-theme-hover transition-colors text-left w-full cursor-pointer"
									>
										<Icons.ReloadIcon className="w-4 h-4 text-theme-primary shrink-0" />
										<span>{t('qrProfile.resetDefaultLogo')}</span>
									</button>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="w-full flex flex-col items-center px-6 pt-2 pb-3 text-center">
					<p className="text-theme-secondary text-xs font-normal tracking-wide">{t('qrProfile.scanToConnect')}</p>

					<div className="flex items-center gap-2.5 mt-1.5">
						<AvatarImage
							alt={username}
							username={username}
							className="w-8 h-8 rounded-full border-2 border-indigo-500/40 object-cover"
							srcImgProxy={createImgproxyUrl(avatarUrl ?? '', { width: 64, height: 64, resizeType: 'fit' })}
							src={avatarUrl}
						/>
						<h2 className="text-lg font-bold text-theme-primary tracking-tight uppercase line-clamp-1">{displayName}</h2>
					</div>

					{username && (
						<div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-theme-setting-nav border-theme-primary">
							<span className="text-indigo-400 text-xs font-semibold">@{username}</span>
						</div>
					)}
				</div>

				<div className="px-6 w-full flex flex-col items-center">
					<div
						className="relative w-full rounded-[24px] bg-white p-3.5 flex flex-col items-center shadow-2xl"
						style={{
							boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), 0 0 25px rgba(99,102,241,0.2)'
						}}
					>
						<div className="flex items-center justify-between w-full pb-3 border-b border-slate-100 mb-3 px-1">
							<div className="flex items-center gap-1.5">
								<img src={DEFAULT_LOGO} className="w-5 h-5 object-contain rounded-md" alt="Mezon Logo" />
								<span className="font-extrabold text-sm tracking-wider text-slate-800">MEZON</span>
							</div>
							<span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
								Profile QR
							</span>
						</div>

						<div
							ref={containerRef}
							className="relative flex items-center justify-center bg-white"
							style={{ width: QR_SIZE, height: QR_SIZE }}
						>
							<QRCode
								level="H"
								value={qrData}
								size={QR_SIZE}
								style={{ width: '100%', height: '100%' }}
								bgColor="#ffffff"
								fgColor="#0f172a"
							/>

							<div
								className="absolute rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-md"
								style={{
									width: LOGO_SIZE,
									height: LOGO_SIZE,
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									padding: 3,
									border: '2px solid #ffffff',
									boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
								}}
							>
								<img src={centerLogo} className="w-full h-full object-contain rounded-lg pointer-events-none" alt="Center Logo" />
							</div>
						</div>

						<div className="flex items-center justify-center w-full pt-3 mt-3 border-t border-slate-100 px-1 text-slate-400">
							<span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">SCAN • CONNECT</span>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-3 w-full px-6 pb-6 pt-4">
					<button
						type="button"
						onClick={handleCopyQR}
						className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl transition-colors cursor-pointer border-theme-primary ${
							isCopiedImg
								? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
								: 'bg-theme-setting-nav bg-item-theme-hover text-theme-primary'
						}`}
						title={t('qrProfile.copyImage')}
					>
						{isCopiedImg ? <Icons.Tick className="w-5 h-5" fill="currentColor" /> : <Icons.CopyIcon className="w-5 h-5" />}
						<span className="text-[11px] font-medium tracking-wide">
							{isCopiedImg ? t('qrProfile.copied') : t('qrProfile.copyImage')}
						</span>
					</button>

					<button
						type="button"
						onClick={handleDownloadQR}
						className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-theme-setting-nav bg-item-theme-hover text-theme-primary border-theme-primary transition-colors cursor-pointer"
						title={t('qrProfile.download')}
					>
						{isDownloading ? (
							<Icons.LoadingSpinner className="w-5 h-5 animate-spin text-cyan-400" />
						) : (
							<Icons.Download className="w-5 h-5 text-cyan-400" />
						)}
						<span className="text-[11px] font-medium tracking-wide">{t('qrProfile.download')}</span>
					</button>

					<button
						type="button"
						onClick={handleCopyLink}
						className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl transition-colors cursor-pointer border-theme-primary ${
							isCopiedLink
								? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
								: 'bg-theme-setting-nav bg-item-theme-hover text-theme-primary'
						}`}
						title={t('qrProfile.copyLink')}
					>
						{isCopiedLink ? (
							<Icons.Tick className="w-5 h-5" fill="currentColor" />
						) : (
							<Icons.CopyMessageLinkRightClick defaultSize="w-5 h-5 text-indigo-400" />
						)}
						<span className="text-[11px] font-medium tracking-wide">
							{isCopiedLink ? t('qrProfile.copiedLink') : t('qrProfile.copyLink')}
						</span>
					</button>
				</div>

				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileChange}
					aria-label={t('qrProfile.chooseFromDevice')}
				/>
			</div>
		</ModalLayout>
	);
};

export default QrProfile;
