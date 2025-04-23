import { useChannelRedirect } from '../../hooks/useChannelRedirect';

export default function ClanIndex() {
	useChannelRedirect();

	return (
		<div className="flex-row bg-bgSurface flex grow">
			<div className="flex flex-col bg-bgSurface relative"></div>
			<div className="flex flex-col flex-1 shrink min-w-0 bg-bgSecondary h-[100%] overflow-hidden"></div>
		</div>
	);
}
