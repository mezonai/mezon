import type { MediaDevice } from '@mezon/utils';

export type AddressBarGlyph = 'tune' | 'blockedDevice' | 'settings';

const DEVICE_ROWS: { device: MediaDevice; y: number }[] = [
	{ device: 'camera', y: 132 },
	{ device: 'microphone', y: 178 }
];

export const TuneGlyph = ({ className }: { className?: string }) => (
	<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
		<circle cx="7" cy="7" r="3" />
		<path d="M12 7h9" />
		<circle cx="17" cy="17" r="3" />
		<path d="M3 17h9" />
	</svg>
);

const CameraShape = ({ x, y, color }: { x: number; y: number; color: string }) => (
	<g transform={`translate(${x} ${y})`} fill={color}>
		<rect x="0" y="-13" width="30" height="26" rx="5" />
		<path d="M32 -5 44 -12 V12 L32 5 Z" />
	</g>
);

const MicrophoneShape = ({ x, y, color }: { x: number; y: number; color: string }) => (
	<g transform={`translate(${x} ${y})`}>
		<rect x="12" y="-20" width="16" height="28" rx="8" fill={color} />
		<path d="M6 0a14 14 0 0 0 28 0M20 14v8M12 22h16" fill="none" stroke="#5f6368" strokeWidth={2.5} strokeLinecap="round" />
	</g>
);

const MagnifiedGlyph = ({ glyph, device }: { glyph: AddressBarGlyph; device: MediaDevice }) => {
	if (glyph === 'tune') {
		return (
			<g stroke="#1f1f1f" strokeWidth={3.5} strokeLinecap="round" fill="none">
				<circle cx="178" cy="46" r="5.5" />
				<path d="M188 46h16" />
				<circle cx="196" cy="66" r="5.5" />
				<path d="M170 66h16" />
			</g>
		);
	}
	if (glyph === 'blockedDevice') {
		return (
			<g>
				{device === 'camera' ? <CameraShape x={168} y={56} color="#5f6368" /> : <MicrophoneShape x={167} y={58} color="#5f6368" />}
				<path d="M166 36 212 78" stroke="#d93025" strokeWidth={4} strokeLinecap="round" />
			</g>
		);
	}
	return (
		<g fill="none" stroke="#1f1f1f" strokeWidth={3.5}>
			<circle cx="187" cy="56" r="7" />
			<path
				d="M187 38v6M187 68v6M169 56h6M199 56h6M174.3 43.3l4.2 4.2M195.5 64.5l4.2 4.2M174.3 68.7l4.2-4.2M195.5 47.5l4.2-4.2"
				strokeLinecap="round"
			/>
		</g>
	);
};

export const BlockedIllustration = ({ device, glyph }: { device: MediaDevice; glyph: AddressBarGlyph }) => (
	<svg viewBox="0 0 300 220" className="w-full h-auto" role="img" aria-hidden>
		<path d="M20 216V32a10 10 0 0 1 10-10h110l12 16h148" fill="none" stroke="#9aa0a6" strokeWidth={2} />
		<circle cx="38" cy="30" r="5" fill="#ee6c4d" />
		<circle cx="54" cy="30" r="5" fill="#f4b400" />
		<circle cx="70" cy="30" r="5" fill="#34a853" />
		<path d="M20 44h280M20 80h280" stroke="#9aa0a6" strokeWidth={2} />
		<g fill="none" stroke="#5f6368" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
			<path d="M46 62H32m6-6-6 6 6 6" />
			<path d="M60 62h14m-6-6 6 6-6 6" />
			<path d="M100 56a8 8 0 1 0 2 8M100 50v7h-7" />
		</g>
		<rect x="122" y="50" width="178" height="24" rx="12" fill="#d3e3fd" />
		{DEVICE_ROWS.map(({ device: rowDevice, y }) => {
			const active = rowDevice === device;
			const color = active ? '#ee6c4d' : '#f6b7a8';
			return (
				<g key={rowDevice} opacity={active ? 1 : 0.55}>
					{rowDevice === 'camera' ? <CameraShape x={40} y={y} color={color} /> : <MicrophoneShape x={44} y={y} color={color} />}
					<rect x="104" y={y - 7} width="64" height="14" rx="7" fill="#c9daf8" />
					<circle cx="110" cy={y} r="11" fill="#fad2cf" stroke="#9aa0a6" strokeWidth={2} />
				</g>
			);
		})}
		<circle cx="187" cy="56" r="36" fill="#ffffff" stroke="#5f6368" strokeWidth={2.5} />
		<MagnifiedGlyph glyph={glyph} device={device} />
		<path d="M208 78v48l12-11 9 21 9-4-9-20h16Z" fill="#ffffff" stroke="#1f1f1f" strokeWidth={2.5} strokeLinejoin="round" />
	</svg>
);
