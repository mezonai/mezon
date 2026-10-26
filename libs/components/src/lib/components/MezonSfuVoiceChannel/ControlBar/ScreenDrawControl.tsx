import { useTranslation } from 'react-i18next';
import { ScreenDrawPenIcon } from '../MyVideoConference/ScreenAnnotation/screenDrawIcons';
import type { ScreenDrawMode } from '../MyVideoConference/ScreenAnnotation/useScreenDraw';

const SCREEN_DRAW_LABEL_KEYS: Record<ScreenDrawMode, [string, string]> = {
	broadcast: ['screenDraw.annotateScreen', 'screenDraw.stopAnnotating'],
	local: ['screenDraw.drawOnScreen', 'screenDraw.stopDrawing']
};

export const ScreenDrawControl = ({ mode, active, onToggle }: { mode: ScreenDrawMode; active: boolean; onToggle: () => void }) => {
	const { t } = useTranslation('channelVoice');
	const label = t(SCREEN_DRAW_LABEL_KEYS[mode][active ? 1 : 0]);
	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={active}
			className={`cursor-pointer p-2 text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)] ${
				active ? 'text-[var(--bg-icon-theme-active)]' : ''
			}`}
			onClick={onToggle}
		>
			<ScreenDrawPenIcon className="h-5 w-5" />
		</button>
	);
};
