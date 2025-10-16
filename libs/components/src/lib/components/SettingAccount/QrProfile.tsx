import { Icons } from '@mezon/ui';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { toast } from 'react-toastify';
import { ButtonSwitch, ModalLayout } from '../../components';

const QrProfile = ({ onClose, qrData }: { onClose: () => void; qrData: string }) => {
	const { t: tInvitation } = useTranslation('invitation');

	const containerRef = useRef<HTMLDivElement | null>(null);

	const handleCopyQR = async () => {
		if (!containerRef.current) return;
		const svg = containerRef.current.querySelector('svg');
		if (!svg) return;

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svg);

		const img = new Image();
		const svgBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
		img.src = svgBase64;

		img.onload = async () => {
			const border = 40;
			const canvas = document.createElement('canvas');
			canvas.width = img.width + border * 2;
			canvas.height = img.height + border * 2;

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			ctx.drawImage(img, border, border);

			canvas.toBlob(async (blob) => {
				if (!blob) return;
				try {
					await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
					const successMessage = tInvitation('messages.qrCopiedSuccess');
					toast.success(successMessage);
				} catch (err) {
					console.error(tInvitation('errors.copyFailed'), err);
				}
			});
		};
	};
	return (
		<ModalLayout onClose={onClose}>
			<div className="p-4 rounded-lg bg-white flex items-center justify-center relative w-[360px] h-[360px]" ref={containerRef}>
				<QRCode level="L" value={qrData} className="w-full h-full" />
				<div className="absolute p-2 rounded-md">
					<img src="./assets/images/icon-logo-mezon.svg" className="cursor-default pointer-events-none" />
				</div>

				<ButtonSwitch
					iconDefault={<Icons.CopyIcon />}
					iconSwitch={<Icons.Tick defaultSize="w-4 h-4" fill="currentColor" />}
					onClick={handleCopyQR}
					className="absolute p-4 !rounded-full text-white bg-transparent"
				/>
			</div>
		</ModalLayout>
	);
};

export default QrProfile;
