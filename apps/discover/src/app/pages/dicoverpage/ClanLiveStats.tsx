import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getMemberCount, getOnlineCount, type DiscoverClan } from './communityUtils';

interface ClanLiveStatsProps {
	clan: DiscoverClan;
	className?: string;
	align?: 'left' | 'right';
	extra?: ReactNode;
}

const LiveDot = () => (
	<span className="relative inline-flex h-2.5 w-2.5 shrink-0" aria-hidden>
		<span className="absolute inset-0 rounded-full bg-[#22c55e] opacity-50 motion-safe:animate-ping" />
		<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
	</span>
);

export default function ClanLiveStats({ clan, className = '', align = 'left', extra }: ClanLiveStatsProps) {
	const { t } = useTranslation('discover');
	const members = getMemberCount(clan);
	const online = getOnlineCount(clan);

	return (
		<p className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${align === 'right' ? 'justify-end' : ''} ${className}`}>
			<span className="inline-flex items-center gap-2">
				<LiveDot />
				<span>{t('memberCount', { count: members })}</span>
			</span>
			{online > 0 ? (
				<>
					<span className="opacity-40" aria-hidden>
						·
					</span>
					<span className="text-[#de82e6]">{t('onlineCount', { count: online })}</span>
				</>
			) : null}
			{extra}
		</p>
	);
}
