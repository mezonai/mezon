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
const QR_SIZE = 175;
const LOGO_SIZE = 36;

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

	const [customCenterLogo, setCustomCenterLogo] = useState<string | null>(null);
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
					setCustomCenterLogo(result);
					toast.success(t('qrProfile.logoUpdatedSuccess'));
				}
			};
			reader.readAsDataURL(file);
			e.target.value = '';
		},
		[t]
	);

	const handleUseDefaultMezonLogo = useCallback(() => {
		setIsMenuOpen(false);
		setCustomCenterLogo(DEFAULT_LOGO);
		toast.success(t('qrProfile.logoResetDefault'));
	}, [t]);

	const handleResetToUserAvatar = useCallback(() => {
		setIsMenuOpen(false);
		setCustomCenterLogo(null);
		toast.info(t('qrProfile.avatarAppliedSuccess'));
	}, [t]);

	const buildCanvas = useCallback(async (): Promise<HTMLCanvasElement | null> => {
		if (!containerRef.current) return null;
		const svg = containerRef.current.querySelector('svg');
		if (!svg) return null;

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svg);
		const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

		const [qrImg, customLogoImg, mezonLogoImg, userAvatarImg] = await Promise.all([
			loadImage(svgBase64),
			customCenterLogo ? loadImage(customCenterLogo) : Promise.resolve(null),
			loadImage(DEFAULT_LOGO),
			loadAvatarImage(avatarUrl)
		]);

		if (!qrImg) return null;

		const cardWidth = 340;
		const qrRenderSize = 175;
		const qrPaddingX = 35;
		const qrCardW = qrRenderSize + qrPaddingX * 2;
		const qrCardX = (cardWidth - qrCardW) / 2;
		const qrCardH = 263;

		const topPad = 24;
		const avatarDrawSize = 32;
		const rowCenterY = topPad + avatarDrawSize / 2;
		const usernameH = username ? 18 : 0;
		const usernameGap = username ? 6 : 0;
		const gapToCard = 16;
		const qrCardY = topPad + avatarDrawSize + (username ? usernameGap + usernameH : 0) + gapToCard;
		const bottomPad = 24;
		const cardHeight = qrCardY + qrCardH + bottomPad;

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

		const gap = 8;
		ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
		const nameMetrics = ctx.measureText(displayName);
		const nameWidth = nameMetrics.width;
		const totalRowWidth = avatarDrawSize + gap + nameWidth;
		const rowStartX = (cardWidth - totalRowWidth) / 2;

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
			const userInitial = (username || displayName || 'U').charAt(0).toUpperCase();
			ctx.fillStyle = '#6366f1';
			ctx.beginPath();
			ctx.arc(avX + avatarDrawSize / 2, rowCenterY, avatarDrawSize / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(userInitial, avX + avatarDrawSize / 2, rowCenterY + 5);
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
			const userTag = `@${username}`;
			ctx.font = '600 11.5px system-ui, -apple-system, sans-serif';
			const tagTextW = ctx.measureText(userTag).width;
			const tagPadX = 10;
			const tagW = tagTextW + tagPadX * 2;
			const tagX = (cardWidth - tagW) / 2;
			const tagY = topPad + avatarDrawSize + usernameGap;

			drawRoundedRect(ctx, tagX, tagY, tagW, usernameH, 9);
			ctx.fillStyle = themeStyle.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
			ctx.fill();

			ctx.fillStyle = '#818cf8';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(userTag, cardWidth / 2, tagY + usernameH / 2);
			ctx.textBaseline = 'alphabetic';
		}

		ctx.save();
		ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
		ctx.shadowBlur = 24;
		ctx.shadowOffsetY = 8;
		drawRoundedRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 16);
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.restore();

		const brandHeaderY = qrCardY + 10;
		if (mezonLogoImg) {
			ctx.save();
			drawRoundedRect(ctx, qrCardX + 12, brandHeaderY + 1, 16, 16, 4);
			ctx.clip();
			ctx.drawImage(mezonLogoImg, qrCardX + 12, brandHeaderY + 1, 16, 16);
			ctx.restore();
		}
		ctx.fillStyle = '#0f172a';
		ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText('MEZON', qrCardX + 34, brandHeaderY + 9);
		ctx.textBaseline = 'alphabetic';

		const badgeW = 62;
		const badgeH = 16;
		drawRoundedRect(ctx, qrCardX + qrCardW - badgeW - 12, brandHeaderY + 1, badgeW, badgeH, 8);
		ctx.fillStyle = '#eef2ff';
		ctx.fill();
		ctx.fillStyle = '#4f46e5';
		ctx.font = 'bold 8px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('PROFILE QR', qrCardX + qrCardW - 12 - badgeW / 2, brandHeaderY + 1 + badgeH / 2);
		ctx.textBaseline = 'alphabetic';

		const divider1Y = brandHeaderY + 18 + 8;
		ctx.strokeStyle = '#f1f5f9';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(qrCardX + 12, divider1Y);
		ctx.lineTo(qrCardX + qrCardW - 12, divider1Y);
		ctx.stroke();

		const qrX = (cardWidth - qrRenderSize) / 2;
		const qrY = divider1Y + 8;
		ctx.drawImage(qrImg, qrX, qrY, qrRenderSize, qrRenderSize);

		const lSize = 36;
		const lx = (cardWidth - lSize) / 2;
		const ly = qrY + (qrRenderSize - lSize) / 2;

		drawRoundedRect(ctx, lx - 2, ly - 2, lSize + 4, lSize + 4, 9);
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.stroke();

		if (customCenterLogo && customLogoImg) {
			ctx.save();
			drawRoundedRect(ctx, lx, ly, lSize, lSize, 8);
			ctx.clip();
			ctx.drawImage(customLogoImg, lx, ly, lSize, lSize);
			ctx.restore();
		} else if (userAvatarImg) {
			ctx.save();
			drawRoundedRect(ctx, lx, ly, lSize, lSize, 8);
			ctx.clip();
			ctx.drawImage(userAvatarImg, lx, ly, lSize, lSize);
			ctx.restore();
		} else {
			const userInitial = (username || displayName || 'U').charAt(0).toUpperCase();
			drawRoundedRect(ctx, lx, ly, lSize, lSize, 8);
			ctx.fillStyle = '#6366f1';
			ctx.fill();
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(userInitial, lx + lSize / 2, ly + lSize / 2);
			ctx.textBaseline = 'alphabetic';
		}

		const divider2Y = qrY + qrRenderSize + 8;
		ctx.strokeStyle = '#f1f5f9';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(qrCardX + 12, divider2Y);
		ctx.lineTo(qrCardX + qrCardW - 12, divider2Y);
		ctx.stroke();

		const verText = 'VERIFIED BY MEZON';
		ctx.font = 'bold 8px system-ui, -apple-system, sans-serif';
		const textW = ctx.measureText(verText).width;
		const pillH = 18;
		const iconSize = 10;
		const iconGap = 5;
		const padX = 9;
		const pillW = padX * 2 + iconSize + iconGap + textW;
		const pillX = (cardWidth - pillW) / 2;
		const pillY = divider2Y + 8;

		drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 9);
		ctx.fillStyle = '#f1f5f9';
		ctx.fill();

		const icX = pillX + padX;
		const icY = pillY + (pillH - iconSize) / 2;
		const rosettePath = new Path2D(
			'M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027ZM16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z'
		);
		ctx.save();
		ctx.translate(icX, icY);
		const iconScale = iconSize / 24;
		ctx.scale(iconScale, iconScale);
		ctx.fillStyle = '#2563eb';
		ctx.fill(rosettePath, 'evenodd');
		ctx.restore();

		ctx.fillStyle = '#4f46e5';
		ctx.font = 'bold 8px system-ui, -apple-system, sans-serif';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText(verText, icX + iconSize + iconGap, pillY + pillH / 2);
		ctx.textBaseline = 'alphabetic';

		return canvas;
	}, [avatarUrl, customCenterLogo, currentTheme, displayName, username]);

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
				className="relative flex flex-col items-center rounded-2xl overflow-hidden shadow-2xl select-none bg-theme-primary text-theme-primary border-theme-primary"
				style={{
					width: 380
				}}
			>
				<div className="w-full flex items-center justify-between px-5 pt-5 pb-1 z-20">
					<button
						type="button"
						onClick={onClose}
						className="w-9 h-9 flex items-center justify-center rounded-full bg-theme-setting-nav bg-item-theme-hover text-theme-primary transition-colors cursor-pointer border-theme-primary"
						aria-label={t('qrProfile.close')}
					>
						<Icons.Close className="w-4 h-4 text-theme-primary" />
					</button>

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
									<div className="w-5 h-5 flex items-center justify-center shrink-0">
										<Icons.UploadImage className="w-4 h-4 text-indigo-400" />
									</div>
									<span className="truncate">{t('qrProfile.chooseFromDevice')}</span>
								</button>

								{customCenterLogo !== DEFAULT_LOGO && (
									<button
										type="button"
										onClick={handleUseDefaultMezonLogo}
										className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-primary bg-item-theme-hover transition-colors text-left w-full cursor-pointer"
									>
										<div className="w-5 h-5 flex items-center justify-center shrink-0">
											<img src={DEFAULT_LOGO} className="w-4 h-4 object-contain rounded" alt="Mezon Logo" />
										</div>
										<span className="truncate">{t('qrProfile.resetDefaultLogo')}</span>
									</button>
								)}

								{customCenterLogo !== null && (
									<button
										type="button"
										onClick={handleResetToUserAvatar}
										className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-theme-primary bg-item-theme-hover transition-colors text-left w-full cursor-pointer"
									>
										<div className="w-5 h-5 flex items-center justify-center shrink-0">
											<Icons.AvatarUser className="w-4 h-4 text-emerald-400" />
										</div>
										<span className="truncate">{t('qrProfile.useMyAvatar')}</span>
									</button>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="w-full flex flex-col items-center px-6 pt-1 pb-5 text-center">
					<div className="flex items-center gap-2.5">
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
						<div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-theme-setting-nav border-theme-primary">
							<span className="text-indigo-400 text-xs font-semibold">@{username}</span>
						</div>
					)}
				</div>

				<div className="px-6 w-full flex flex-col items-center">
					<div
						className="relative rounded-2xl bg-white px-[35px] py-[10px] flex flex-col items-center shadow-2xl"
						style={{
							boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5), 0 0 25px rgba(99,102,241,0.2)'
						}}
					>
						<div className="flex items-center justify-between w-full pb-2 border-b border-slate-100 mb-2 px-0.5">
							<div className="flex items-center gap-1.5">
								<img src={DEFAULT_LOGO} className="w-4 h-4 object-contain rounded-md" alt="Mezon Logo" />
								<span className="font-extrabold text-xs tracking-wider text-slate-800">MEZON</span>
							</div>
							<span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
								Profile QR
							</span>
						</div>

						<div
							ref={containerRef}
							className="relative flex items-center justify-center bg-white"
							style={{ width: QR_SIZE, height: QR_SIZE }}
						>
							<QRCode
								level="L"
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
									padding: 2,
									border: '2px solid #ffffff',
									boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
								}}
							>
								{customCenterLogo ? (
									<img
										src={customCenterLogo}
										className={`w-full h-full rounded-lg pointer-events-none ${
											customCenterLogo === DEFAULT_LOGO ? 'object-contain' : 'object-cover'
										}`}
										alt="Center Logo"
									/>
								) : (
									<AvatarImage
										alt={username}
										username={username}
										className="w-full h-full rounded-lg object-cover pointer-events-none"
										srcImgProxy={createImgproxyUrl(avatarUrl ?? '', { width: 80, height: 80, resizeType: 'fit' })}
										src={avatarUrl}
									/>
								)}
							</div>
						</div>

						<div className="flex items-center justify-center w-full pt-1.5 mt-2 border-t border-slate-100 px-0.5">
							<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-item-theme">
								<svg className="w-3.5 h-3.5 text-[#2563eb] shrink-0" viewBox="0 0 24 24" fill="currentColor">
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M9.5924 3.20027C9.34888 3.4078 9.22711 3.51158 9.09706 3.59874C8.79896 3.79854 8.46417 3.93721 8.1121 4.00672C7.95851 4.03705 7.79903 4.04977 7.48008 4.07522C6.6787 4.13918 6.278 4.17115 5.94371 4.28923C5.17051 4.56233 4.56233 5.17051 4.28923 5.94371C4.17115 6.278 4.13918 6.6787 4.07522 7.48008C4.04977 7.79903 4.03705 7.95851 4.00672 8.1121C3.93721 8.46417 3.79854 8.79896 3.59874 9.09706C3.51158 9.22711 3.40781 9.34887 3.20027 9.5924C2.67883 10.2043 2.4181 10.5102 2.26522 10.8301C1.91159 11.57 1.91159 12.43 2.26522 13.1699C2.41811 13.4898 2.67883 13.7957 3.20027 14.4076C3.40778 14.6511 3.51158 14.7729 3.59874 14.9029C3.79854 15.201 3.93721 15.5358 4.00672 15.8879C4.03705 16.0415 4.04977 16.201 4.07522 16.5199C4.13918 17.3213 4.17115 17.722 4.28923 18.0563C4.56233 18.8295 5.17051 19.4377 5.94371 19.7108C6.278 19.8288 6.6787 19.8608 7.48008 19.9248C7.79903 19.9502 7.95851 19.963 8.1121 19.9933C8.46417 20.0628 8.79896 20.2015 9.09706 20.4013C9.22711 20.4884 9.34887 20.5922 9.5924 20.7997C10.2043 21.3212 10.5102 21.5819 10.8301 21.7348C11.57 22.0884 12.43 22.0884 13.1699 21.7348C13.4898 21.5819 13.7957 21.3212 14.4076 20.7997C14.6511 20.5922 14.7729 20.4884 14.9029 20.4013C15.201 20.2015 15.5358 20.0628 15.8879 19.9933C16.0415 19.963 16.201 19.9502 16.5199 19.9248C17.3213 19.8608 17.722 19.8288 18.0563 19.7108C18.8295 19.4377 19.4377 18.8295 19.7108 18.0563C19.8288 17.722 19.8608 17.3213 19.9248 16.5199C19.9502 16.201 19.963 16.0415 19.9933 15.8879C20.0628 15.5358 20.2015 15.201 20.4013 14.9029C20.4884 14.7729 20.5922 14.6511 20.7997 14.4076C21.3212 13.7957 21.5819 13.4898 21.7348 13.1699C22.0884 12.43 22.0884 11.57 21.7348 10.8301C21.5819 10.5102 21.3212 10.2043 20.7997 9.5924C20.5922 9.34887 20.4884 9.22711 20.4013 9.09706C20.2015 8.79896 20.0628 8.46417 19.9933 8.1121C19.963 7.95851 19.9502 7.79903 19.9248 7.48008C19.8608 6.6787 19.8288 6.278 19.7108 5.94371C19.4377 5.17051 18.8295 4.56233 18.0563 4.28923C17.722 4.17115 17.3213 4.13918 16.5199 4.07522C16.201 4.04977 16.0415 4.03705 15.8879 4.00672C15.5358 3.93721 15.201 3.79854 14.9029 3.59874C14.7729 3.51158 14.6511 3.40781 14.4076 3.20027C13.7957 2.67883 13.4898 2.41811 13.1699 2.26522C12.43 1.91159 11.57 1.91159 10.8301 2.26522C10.5102 2.4181 10.2043 2.67883 9.5924 3.20027ZM16.3735 9.86314C16.6913 9.5453 16.6913 9.03 16.3735 8.71216C16.0557 8.39433 15.5403 8.39433 15.2225 8.71216L10.3723 13.5624L8.77746 11.9676C8.45963 11.6498 7.94432 11.6498 7.62649 11.9676C7.30866 12.2854 7.30866 12.8007 7.62649 13.1186L9.79678 15.2889C10.1146 15.6067 10.6299 15.6067 10.9478 15.2889L16.3735 9.86314Z"
									/>
								</svg>
								<span className="text-[9px] font-bold tracking-wider text-indigo-600 uppercase">VERIFIED BY MEZON</span>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-3 gap-3 w-full px-6 pb-5 pt-3.5">
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
