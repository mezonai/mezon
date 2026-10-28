import { selectClanUnreadStates, selectOrderedClansWithGroups } from '@mezon/store';
import { FloatButton } from '@mezon/ui';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type RailScrollTarget = {
	clanIds: string[];
	selector: string;
};

type RailScrollTargets = {
	above: RailScrollTarget | null;
	below: RailScrollTarget | null;
};

const CLAN_ICON_HEIGHT = 40;
const BOTTOM_FLOAT_RESERVE = 32;
const TOP_FLOAT_RESERVE = 4;

const PILL_CLASS =
	'pointer-events-auto !my-0 uppercase !text-[8px] !leading-tight !px-3 !py-1 !opacity-100 ' +
	'shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_2px_4px_rgba(0,0,0,0.28),0_10px_22px_rgba(0,0,0,0.42)] ' +
	'ring-1 ring-black/25 transition-[transform,box-shadow,filter] duration-200 ease-out ' +
	'hover:-translate-y-0.5 hover:brightness-105 ' +
	'hover:shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_4px_10px_rgba(0,0,0,0.32),0_16px_32px_rgba(0,0,0,0.48)] ' +
	'active:translate-y-0 active:brightness-100 active:shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_2px_6px_rgba(0,0,0,0.35),0_8px_18px_rgba(0,0,0,0.38)]';

type ClanRailUnreadFloatButtonProps = {
	scrollContainerRef: React.RefObject<HTMLElement | null>;
};

const getStickyHeaderBottom = (container: HTMLElement) => {
	const sticky = container.firstElementChild;
	if (!(sticky instanceof HTMLElement)) {
		return container.getBoundingClientRect().top;
	}
	return sticky.getBoundingClientRect().bottom;
};

const getVisibleBand = (container: HTMLElement) => {
	const containerRect = container.getBoundingClientRect();
	const visibleTop = getStickyHeaderBottom(container) + TOP_FLOAT_RESERVE;
	const visibleBottom = containerRect.bottom - BOTTOM_FLOAT_RESERVE;
	return { visibleTop, visibleBottom };
};

const getVisiblePx = (visibleTop: number, visibleBottom: number, elementRect: DOMRect) => {
	const overlapTop = Math.max(elementRect.top, visibleTop);
	const overlapBottom = Math.min(elementRect.bottom, visibleBottom);
	return Math.max(0, overlapBottom - overlapTop);
};

const clanHasBadgeCount = (clanUnreadStates: ReturnType<typeof selectClanUnreadStates>, clanId: string) =>
	(clanUnreadStates.entities[clanId]?.badge ?? 0) > 0;

const isClanInsufficientlyVisibleAbove = (container: HTMLElement, element: HTMLElement) => {
	const { visibleTop, visibleBottom } = getVisibleBand(container);
	if (visibleBottom <= visibleTop) return false;

	const elementRect = element.getBoundingClientRect();
	const visiblePx = getVisiblePx(visibleTop, visibleBottom, elementRect);
	if (visiblePx >= CLAN_ICON_HEIGHT * 0.85) return false;

	return elementRect.bottom < visibleTop + CLAN_ICON_HEIGHT * 0.5;
};

const isClanInsufficientlyVisibleBelow = (container: HTMLElement, element: HTMLElement) => {
	const { visibleTop, visibleBottom } = getVisibleBand(container);
	if (visibleBottom <= visibleTop) return false;

	const elementRect = element.getBoundingClientRect();
	const visiblePx = getVisiblePx(visibleTop, visibleBottom, elementRect);
	if (visiblePx >= CLAN_ICON_HEIGHT * 0.85) return false;

	return elementRect.top >= visibleTop && elementRect.bottom > visibleBottom - CLAN_ICON_HEIGHT * 0.5;
};

const scrollClanIntoView = (container: HTMLElement, element: HTMLElement) => {
	const { visibleTop, visibleBottom } = getVisibleBand(container);
	const elementRect = element.getBoundingClientRect();
	const bandCenter = visibleTop + (visibleBottom - visibleTop) / 2;
	const targetTop = bandCenter - elementRect.height / 2;
	const delta = elementRect.top - targetTop;
	container.scrollBy({ top: delta, behavior: 'smooth' });
};

const targetsKey = (targets: RailScrollTargets) => `${targets.above?.selector ?? ''}|${targets.below?.selector ?? ''}`;

export const ClanRailUnreadFloatButton = memo(({ scrollContainerRef }: ClanRailUnreadFloatButtonProps) => {
	const { t } = useTranslation('common');
	const orderedClansWithGroups = useSelector(selectOrderedClansWithGroups);
	const clanUnreadStates = useSelector(selectClanUnreadStates);

	const railTargets = useMemo((): RailScrollTarget[] => {
		const targets: RailScrollTarget[] = [];
		for (const item of orderedClansWithGroups) {
			if (!item) continue;
			if (item.type === 'clan' && item.clan) {
				targets.push({
					clanIds: [item.clan.id],
					selector: `[data-id="${item.clan.id}"]`
				});
			} else if (item.type === 'group' && 'group' in item && item.group) {
				const group = item.group;
				if (group.isExpanded) {
					for (const clanId of group.clanIds) {
						targets.push({
							clanIds: [clanId],
							selector: `[data-id="${clanId}"]`
						});
					}
				} else {
					targets.push({
						clanIds: group.clanIds,
						selector: `[data-clan-rail-item="group:${group.id}"]`
					});
				}
			}
		}
		return targets;
	}, [orderedClansWithGroups]);

	const railTargetsRef = useRef(railTargets);
	railTargetsRef.current = railTargets;
	const clanUnreadStatesRef = useRef(clanUnreadStates);
	clanUnreadStatesRef.current = clanUnreadStates;

	const [scrollTargets, setScrollTargets] = useState<RailScrollTargets>({ above: null, below: null });
	const scrollTargetsRef = useRef<RailScrollTargets>({ above: null, below: null });
	const rafIdRef = useRef<number | null>(null);
	const [topInsetPx, setTopInsetPx] = useState(120);

	const computeScrollTargets = useCallback((): RailScrollTargets => {
		const container = scrollContainerRef.current;
		if (!container) return { above: null, below: null };

		const sticky = container.firstElementChild;
		if (sticky instanceof HTMLElement) {
			setTopInsetPx(sticky.offsetHeight + TOP_FLOAT_RESERVE);
		}

		const unread = clanUnreadStatesRef.current;
		let above: RailScrollTarget | null = null;
		let below: RailScrollTarget | null = null;

		for (const target of railTargetsRef.current) {
			const hasBadge = target.clanIds.some((clanId) => clanHasBadgeCount(unread, clanId));
			if (!hasBadge) continue;

			const element = container.querySelector(target.selector);
			if (!(element instanceof HTMLElement)) continue;

			if (!above && isClanInsufficientlyVisibleAbove(container, element)) {
				above = target;
			}
			if (!below && isClanInsufficientlyVisibleBelow(container, element)) {
				below = target;
			}
			if (above && below) break;
		}

		return { above, below };
	}, [scrollContainerRef]);

	const scheduleUpdate = useCallback(() => {
		if (rafIdRef.current !== null) return;
		rafIdRef.current = requestAnimationFrame(() => {
			rafIdRef.current = null;
			const next = computeScrollTargets();
			if (targetsKey(next) === targetsKey(scrollTargetsRef.current)) return;
			scrollTargetsRef.current = next;
			setScrollTargets(next);
		});
	}, [computeScrollTargets]);

	useEffect(() => {
		scheduleUpdate();
	}, [clanUnreadStates, railTargets, scheduleUpdate]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const onLayoutChange = () => scheduleUpdate();
		container.addEventListener('scroll', onLayoutChange, { passive: true });
		window.addEventListener('resize', onLayoutChange);

		const observer = new ResizeObserver(onLayoutChange);
		observer.observe(container);
		for (const child of Array.from(container.children)) {
			if (child instanceof HTMLElement) observer.observe(child);
		}

		return () => {
			container.removeEventListener('scroll', onLayoutChange);
			window.removeEventListener('resize', onLayoutChange);
			observer.disconnect();
			if (rafIdRef.current !== null) {
				cancelAnimationFrame(rafIdRef.current);
				rafIdRef.current = null;
			}
		};
	}, [scrollContainerRef, scheduleUpdate]);

	const scrollToTarget = useCallback(
		(target: RailScrollTarget | null) => {
			const container = scrollContainerRef.current;
			if (!container || !target) return;

			const element = container.querySelector(target.selector);
			if (element instanceof HTMLElement) {
				scrollClanIntoView(container, element);
			}
		},
		[scrollContainerRef]
	);

	const label = t('clanRailNew');

	if (!scrollTargets.above && !scrollTargets.below) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-[60]">
			{scrollTargets.above && (
				<div className="absolute left-0 right-0 flex justify-center px-0.5" style={{ top: topInsetPx }}>
					<FloatButton content={label} onClick={() => scrollToTarget(scrollTargetsRef.current.above)} className={PILL_CLASS} />
				</div>
			)}
			{scrollTargets.below && (
				<div className="absolute bottom-[92px] left-0 right-0 flex justify-center px-0.5">
					<FloatButton content={label} onClick={() => scrollToTarget(scrollTargetsRef.current.below)} className={PILL_CLASS} />
				</div>
			)}
		</div>
	);
});
