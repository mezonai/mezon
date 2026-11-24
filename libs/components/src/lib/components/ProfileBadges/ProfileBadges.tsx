import { MezonIcon } from '@mezon/ui';
import Tooltip from 'rc-tooltip';
import type { CSSProperties } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mzPro16 } from './proIcon';
import type { ProPalette, ProfileBadgeItem } from './proPalette';
import { hexToRgba } from './proPalette';

const TOOLTIP_TRIGGER: ('hover' | 'focus')[] = ['hover', 'focus'];
const OVERLAY_INNER_STYLE: CSSProperties = { minHeight: 'auto', padding: 0, background: 'transparent' };

type ProBadgeTileProps = {
	label: string;
	palette: ProPalette;
};

const ProBadgeTile = memo(({ label, palette }: ProBadgeTileProps) => {
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseEnter = useCallback(() => {
		setIsHovered(true);
	}, []);

	const handleMouseLeave = useCallback(() => {
		setIsHovered(false);
	}, []);

	const tileStyle = useMemo<CSSProperties>(() => {
		if (isHovered) {
			return {
				backgroundColor: hexToRgba(palette.accent, 0.3),
				border: `1px solid ${palette.accent}`,
				color: palette.accent,
				boxShadow: `0 0 10px ${hexToRgba(palette.accent, 0.5)}`
			};
		}
		return {
			backgroundColor: hexToRgba(palette.accent, 0.16),
			border: `1px solid ${hexToRgba(palette.accent, 0.45)}`,
			color: palette.accent
		};
	}, [isHovered, palette.accent]);

	const overlay = useMemo(
		() => <div className="px-2 py-1 text-xs font-medium rounded bg-[#1e1f22] text-white shadow-md whitespace-nowrap">{label}</div>,
		[label]
	);

	return (
		<Tooltip placement="top" trigger={TOOLTIP_TRIGGER} overlay={overlay} overlayInnerStyle={OVERLAY_INNER_STYLE} destroyTooltipOnHide>
			<span
				className="mz-hover inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] shrink-0 transition-all duration-150 cursor-default"
				style={tileStyle}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-label={label}
				tabIndex={0}
			>
				<MezonIcon icon={mzPro16} className="w-[14px] h-[14px]" />
			</span>
		</Tooltip>
	);
});

export type ProfileBadgesProps = {
	isPro?: boolean;
	badges?: ProfileBadgeItem[];
	palette: ProPalette;
	className?: string;
};

const ProfileBadgesBase = ({ isPro, badges, palette, className }: ProfileBadgesProps) => {
	const { t } = useTranslation('userProfile');
	const proLabel = t('badges.mezonPro');

	const visibleBadges = useMemo(() => (badges ?? (isPro ? [{ kind: 'pro' as const }] : [])).filter((item) => item.kind === 'pro'), [badges, isPro]);

	if (visibleBadges.length === 0) {
		return null;
	}

	return (
		<span className={`inline-flex items-center gap-1 shrink-0 ${className ?? ''}`}>
			{visibleBadges.map((item, idx) => (
				<ProBadgeTile key={`${item.kind}-${idx}`} label={proLabel} palette={palette} />
			))}
		</span>
	);
};

export const ProfileBadges = memo(ProfileBadgesBase);
