import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ImageWithSkeleton from '../../components/common/ImageWithSkeleton';
import { getClanHref, getClanInitials, type DiscoverClan } from './communityUtils';

interface ClanOrbitProps {
	clans: DiscoverClan[];
	title?: string;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}

const ClanOrbit: React.FC<ClanOrbitProps> = ({ clans, title, onSelect }) => {
	const { t } = useTranslation('discover');
	const scrollerRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef({ tracking: false, startX: 0, scrollLeft: 0, moved: false });
	const [dragging, setDragging] = useState(false);

	if (clans.length < 2) return null;

	const scrollByDir = (direction: -1 | 1) => {
		scrollerRef.current?.scrollBy({ left: direction * 280, behavior: 'smooth' });
	};

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== 'mouse' || event.button !== 0) return;
		if ((event.target as HTMLElement | null)?.closest('[data-orbit-node]')) return;
		const node = scrollerRef.current;
		if (!node) return;
		dragRef.current = {
			tracking: true,
			startX: event.clientX,
			scrollLeft: node.scrollLeft,
			moved: false
		};
	};

	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		const node = scrollerRef.current;
		if (!drag.tracking || !node) return;
		const delta = event.clientX - drag.startX;
		if (!drag.moved && Math.abs(delta) < 10) return;
		drag.moved = true;
		setDragging(true);
		node.scrollLeft = drag.scrollLeft - delta;
	};

	const endDrag = () => {
		dragRef.current.tracking = false;
		setDragging(false);
	};

	return (
		<section className="bg-[var(--surface-ink)] text-white py-16 md:py-24 overflow-hidden" aria-labelledby="orbit-heading">
			<div className="px-4 md:px-8 lg:px-12 flex items-end justify-between gap-4 mb-10">
				<h2 id="orbit-heading" className="text-3xl md:text-5xl font-extrabold tracking-[-0.04em]">
					{title || t('orbitTitle')}
				</h2>
				<div className="flex items-center gap-2 shrink-0">
					<button
						type="button"
						onClick={() => scrollByDir(-1)}
						className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-[#8960e0] inline-flex items-center justify-center"
						aria-label={t('orbitPrev')}
					>
						←
					</button>
					<button
						type="button"
						onClick={() => scrollByDir(1)}
						className="w-12 h-12 rounded-full bg-white/10 text-white hover:bg-[#8960e0] inline-flex items-center justify-center"
						aria-label={t('orbitNext')}
					>
						→
					</button>
				</div>
			</div>
			<div
				ref={scrollerRef}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerLeave={endDrag}
				onPointerCancel={endDrag}
				className={`flex items-center overflow-x-auto snap-x snap-mandatory scrollbar-hide hide-scrollbar px-8 md:px-16 pb-8 ${
					dragging ? 'cursor-grabbing select-none' : 'cursor-grab'
				}`}
			>
				{clans.map((clan, index) => (
					<OrbitNode key={clan.clan_id || clan.short_url || index} clan={clan} index={index} onSelect={onSelect} />
				))}
			</div>
		</section>
	);
};

const OrbitNode = ({
	clan,
	index,
	onSelect
}: {
	clan: DiscoverClan;
	index: number;
	onSelect?: (clan: DiscoverClan, meta: { section?: string; position?: number }) => void;
}) => {
	const { t } = useTranslation('discover');
	const [error, setError] = useState(false);
	const name = clan.clan_name || t('detail.unnamed');
	const src = clan.clan_logo || clan.banner;
	const size = index % 3 === 0 ? 'w-44 h-44 md:w-64 md:h-64' : 'w-32 h-32 md:w-48 md:h-48';
	const href = getClanHref(clan);

	return (
		<div
			className={`relative shrink-0 snap-center -ml-6 first:ml-0 ${index % 2 === 0 ? 'translate-y-4' : '-translate-y-2'}`}
			style={{ zIndex: index + 1 }}
		>
			<Link
				data-orbit-node
				to={href}
				onClick={() => onSelect?.(clan, { section: 'orbit', position: index })}
				className={`block ${size} rounded-full overflow-hidden ring-[6px] ring-[#5865f2]/50 hover:ring-[#de82e6] transition-transform duration-300 hover:scale-105 motion-reduce:transform-none bg-[#8960e0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5865f2]`}
			>
				{src && !error ? (
					<ImageWithSkeleton
						src={src}
						alt=""
						className="w-full h-full object-cover pointer-events-none"
						onError={() => setError(true)}
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">{getClanInitials(name)}</div>
				)}
			</Link>
			<p className="mt-3 text-center text-sm font-semibold truncate max-w-[10rem] mx-auto pointer-events-none">{name}</p>
		</div>
	);
};

export default ClanOrbit;
