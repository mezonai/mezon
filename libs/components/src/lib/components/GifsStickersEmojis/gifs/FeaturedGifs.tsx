import { useGifs } from '@mezon/core';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';

type FeaturedGifsProps = {
	channelId: string;
	channelLabel: string;
	controlEmoji?: boolean;
	clanId?: string;
	mode: number;
	onClickToTrending: () => void;
};

function FeaturedGifs({ onClickToTrending }: FeaturedGifsProps) {
	const { dataGifsFeartured } = useGifs();
	return (
		<div
			className="relative h-32 rounded-md cursor-pointer overflow-hidden group"
			onClick={onClickToTrending}
			role="button"
			data-e2e={generateE2eId('mention.popover.gifs.trending')}
		>
			<div className="absolute inset-0 bg-black opacity-80 z-20 transition-opacity group-hover:opacity-70"></div>
			<div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none gap-2">
				<Icons.TrendingGifs />
				<span className="text-white text-lg font-manrope">Trending GIFs</span>
			</div>
			<img
				className="w-full h-full object-cover brightness-100 rounded-sm"
				src={dataGifsFeartured[0].media_formats.gif.url}
				alt={dataGifsFeartured[0].media_formats.gif.url}
			/>
			<div className="absolute inset-0 border-2 border-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md z-30"></div>
		</div>
	);
}

export default FeaturedGifs;
