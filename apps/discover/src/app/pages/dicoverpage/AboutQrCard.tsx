import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';

const MEZON_QR_LOGO = 'https://cdn.komu.vn/images/mezon_logo.png';

export default function AboutQrCard({ value }: { value: string }) {
	const { t } = useTranslation('discover');

	return (
		<span className="my-6 block w-[280px] max-w-full rounded-[24px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 text-left font-medium leading-normal tracking-normal whitespace-normal shadow-[0_12px_32px_-16px_rgba(79,70,229,0.35)]">
			<a
				href={value}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={t('joinModal.openLink')}
				onClick={(event) => event.stopPropagation()}
				className="group flex w-full flex-col items-center rounded-2xl border border-slate-100 bg-white px-4 pb-3 pt-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.2)] transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
			>
				<span className="flex w-full items-center justify-between gap-2 border-b border-slate-100 pb-3">
					<span className="inline-flex items-center gap-1.5">
						<img src={MEZON_QR_LOGO} alt="" className="h-5 w-5 rounded-md object-contain" />
						<span className="text-xs font-extrabold tracking-wider text-slate-800">MEZON</span>
					</span>
					<span className="rounded-full bg-indigo-50 px-2 py-1 text-[9px] font-bold leading-none tracking-wider text-indigo-600">
						QR CODE
					</span>
				</span>

				<span className="relative my-4 block w-[192px] max-w-full bg-white">
					<QRCode
						value={value}
						title={value}
						size={192}
						level="M"
						bgColor="#ffffff"
						fgColor="#0f172a"
						style={{ display: 'block', width: '100%', height: 'auto' }}
					/>
					<span
						aria-hidden="true"
						className="pointer-events-none absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-lg border-[3px] border-white bg-white p-0.5 shadow-md"
					>
						<img src={MEZON_QR_LOGO} alt="" className="h-full w-full rounded-lg object-contain" />
					</span>
				</span>

				<span className="flex w-full justify-center border-t border-slate-100 pt-3">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1">
						<svg
							className="h-3 w-3 text-indigo-500"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							aria-hidden="true"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M7 3H4a1 1 0 0 0-1 1v3m14-4h3a1 1 0 0 1 1 1v3M3 17v3a1 1 0 0 0 1 1h3m10 0h3a1 1 0 0 0 1-1v-3M7 12h10"
							/>
						</svg>
						<span className="text-[9px] font-bold tracking-wider text-indigo-600">POWERED BY MEZON</span>
					</span>
				</span>
			</a>
			<span className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600">
				{t('joinModal.scanQr')}
				<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M7 7h10v10" />
				</svg>
			</span>
		</span>
	);
}
