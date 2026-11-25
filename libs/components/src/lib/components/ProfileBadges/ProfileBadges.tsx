import { MezonIcon } from '@mezon/ui';
import Tooltip from 'rc-tooltip';
import type { CSSProperties } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mzPro16 } from './proIcon';
import type { ProPalette, ProfileBadgeItem } from './proPalette';
import { hexToRgba } from './proPalette';
import { useProPalette } from './useProPalette';

const TOOLTIP_TRIGGER: ('hover' | 'focus')[] = ['hover', 'focus'];
const HOVER_ONLY_TOOLTIP_TRIGGER: ('hover' | 'focus')[] = ['hover'];
const OVERLAY_INNER_STYLE: CSSProperties = { minHeight: 'auto', padding: 0, background: 'transparent' };

type ProBadgeTileProps = {
	label: string;
	palette: ProPalette;
	focusable?: boolean;
	cursorClassName?: string;
};

const ProBadgeTile = memo(({ label, palette, focusable = true, cursorClassName = 'cursor-default' }: ProBadgeTileProps) => {
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

	const tooltipTrigger = focusable ? TOOLTIP_TRIGGER : HOVER_ONLY_TOOLTIP_TRIGGER;
	const tabIndex = focusable ? 0 : undefined;
	const tileClassName = `mz-hover inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] shrink-0 transition-all duration-150 ${cursorClassName}`;

	return (
		<Tooltip placement="top" trigger={tooltipTrigger} overlay={overlay} overlayInnerStyle={OVERLAY_INNER_STYLE} destroyTooltipOnHide>
			<span
				className={tileClassName}
				style={tileStyle}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-label={label}
				tabIndex={tabIndex}
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

export type ClanProBadgeProps = {
	className?: string;
};

const ClanProBadgeBase = ({ className }: ClanProBadgeProps) => {
	const { t } = useTranslation('userProfile');
	const palette = useProPalette();
	const label = t('badges.clanPro');

	return (
		<span className={`inline-flex items-center shrink-0 ${className ?? ''}`}>
			<ProBadgeTile label={label} palette={palette} focusable={false} cursorClassName="cursor-pointer" />
		</span>
	);
};

export const ClanProBadge = memo(ClanProBadgeBase);
