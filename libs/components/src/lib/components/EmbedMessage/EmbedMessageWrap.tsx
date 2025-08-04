import { useCustomNavigate } from '@mezon/core';
import { channelsActions, getStore, selectAppChannelById } from '@mezon/store';
import { IEmbedProps, ObserveFn } from '@mezon/utils';
import { useDispatch } from 'react-redux';
import { SummarySection } from '../SummarySection';
import { EmbedMessage } from './EmbedMessage';

interface EmbedMessageWrapProps {
	embeds: IEmbedProps[];
	senderId?: string;
	messageId?: string;
	channelId: string;
	observeIntersectionForLoading?: ObserveFn;
	summary?: string;
}

export function EmbedMessageWrap({ embeds, senderId, messageId, channelId, observeIntersectionForLoading, summary }: EmbedMessageWrapProps) {
	const navigate = useCustomNavigate();
	const dispatch = useDispatch();

	const extractChannelParams = (url: string) => {
		const pattern = /mezon\.ai\/channel-app\/([^/]+)\/([^/]+)\?([^#]+)/i;
		const match = url.match(pattern);

		if (match) {
			const params = new URLSearchParams(match[3]);
			return {
				channelId: match[1],
				clanId: match[2],
				code: params.get('code'),
				subpath: params.get('subpath')
			};
		}
		return null;
	};

	const onEmbedClick = (embed: IEmbedProps) => {
		if (!embed.url) return;

		const params = extractChannelParams(embed.url);
		if (!params?.channelId || !params?.clanId) return;
		navigate(`/chat/clans/${params.clanId}/channels/${params.channelId}`);
		const store = getStore();
		const appChannel = selectAppChannelById(store.getState(), params.channelId);

		if (appChannel) {
			dispatch(
				channelsActions.setAppChannelsListShowOnPopUp({
					clanId: params.clanId,
					channelId: params.channelId,
					appChannel: {
						...appChannel,
						code: params.code as string,
						subpath: params.subpath as string
					}
				})
			);
		}
	};

	return (
		<div className="w-full">
			{embeds.map((embed, index) => (
				<EmbedMessage
					key={index}
					embed={embed}
					senderId={senderId}
					message_id={messageId}
					onClick={() => onEmbedClick(embed)}
					channelId={channelId}
					observeIntersectionForLoading={observeIntersectionForLoading}
				/>
			))}
			<div className="max-w-[520px]">{summary && <SummarySection summary={summary} audio={true} />}</div>
		</div>
	);
}
