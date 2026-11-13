import { describe, expect, it, jest } from '@jest/globals';
import { EBacktickType } from '@mezon/utils';
import type { ReactElement } from 'react';
import { MessageLine } from './MessageLine';
import './lite-embeds';

type JsonNode = string | { type: string; props: Record<string, unknown>; children: JsonNode[] | null } | null;
type TestInstance = {
	type: unknown;
	props: Record<string, unknown>;
	findAllByType: (type: string) => TestInstance[];
};
type TestRenderer = {
	root: TestInstance;
	toJSON: () => JsonNode | JsonNode[];
	unmount: () => void;
};

const { create } = jest.requireActual<{
	create: (element: ReactElement) => TestRenderer;
}>('react-test-renderer');

jest.mock('@mezon/core', () => ({ toMembersPage: (id: string) => `/members/${id}` }), { virtual: true });
jest.mock(
	'@mezon/store',
	() => ({
		channelsActions: { setAppChannelsListShowOnPopUp: jest.fn() },
		clansActions: { fetchClans: jest.fn() },
		getStore: () => ({ getState: () => ({}) }),
		inviteActions: { inviteUser: jest.fn(), setIsClickInvite: jest.fn(), getLinkInvite: jest.fn() },
		selectAppChannelById: () => undefined,
		selectCanvasIdsByChannelId: () => [],
		selectClanById: () => () => undefined,
		selectClanExists: () => false,
		selectTheme: () => 'dark',
		useAppDispatch: () => jest.fn()
	}),
	{ virtual: true }
);
jest.mock('@mezon/ui', () => ({ MezonIcon: () => null, MzIcons16: { mzCheck: {}, mzCopy: {}, mzPaste: {} } }), { virtual: true });
jest.mock(
	'@mezon/utils',
	() => ({
		...jest.requireActual<object>('../../../../../utils/src/lib/types/messageLine'),
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/inlineMarkdownStyles'),
		...jest.requireActual<object>('../../../../../utils/src/lib/utils/markdownBlocks'),
		ETokenMessage: {
			MENTIONS: 'mentions',
			EMOJIS: 'ej',
			HASHTAGS: 'hg',
			LINKS: 'lk',
			VOICE_LINKS: 'vk',
			MARKDOWNS: 'mk',
			LINKYOUTUBE: 'lk_yt',
			OGP_PREVIEW: 'lk_ogp'
		},
		ID_MENTION_HERE: '1775731111020111321',
		NX_CHAT_APP_ANNONYMOUS_USER_ID: 'anonymous',
		TITLE_MENTION_HERE: '@here',
		TypeMessage: { ChatRemove: 5, MessageBuzz: 8 },
		checkInviteLinkValid: () => false,
		convertMarkdown: (markdown: string) => markdown,
		createImgproxyUrl: (url: string) => url,
		generateE2eId: (id: string) => id,
		getFacebookEmbedSize: () => ({ width: 320, height: 180 }),
		getFacebookEmbedUrl: (url: string) => url,
		getTikTokEmbedSize: () => ({ width: 320, height: 180 }),
		getTikTokEmbedUrl: (url: string) => url,
		getYouTubeEmbedSize: () => ({ width: 320, height: 180 })
	}),
	{ virtual: true }
);
jest.mock('mezon-js', () => ({ ChannelStreamMode: { STREAM_MODE_CHANNEL: 2 } }), { virtual: true });
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => (key === 'message.edited' ? 'edited' : key) }) }));
jest.mock('react-redux', () => ({ useSelector: (selector: (state: unknown) => unknown) => selector({}) }));
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('react-modal-hook', () => ({ useModal: () => [jest.fn(), jest.fn()] }), { virtual: true });
jest.mock(
	'lowlight',
	() => ({
		common: {},
		createLowlight: () => ({
			registered: () => false,
			highlight: () => ({ type: 'root', children: [] }),
			highlightAuto: () => ({ type: 'root', children: [] })
		})
	}),
	{ virtual: true }
);
jest.mock('./lite-embeds', () => ({}), { virtual: true });
jest.mock('../MarkdownFormatText/highlight-github-dark.scss', () => ({}), { virtual: true });
jest.mock('../ContextMenu', () => ({ useMessageContextMenu: () => ({ showMessageContextMenu: jest.fn() }) }));
jest.mock('../InviteAcceptModal', () => ({ __esModule: true, default: () => null }));
jest.mock('./OgpEmbed', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components', () => {
	const actualMarkdown = jest.requireActual<{ MarkdownContent: unknown }>('../MarkdownFormatText/MarkdownContent');
	const actualPlain = jest.requireActual<{ PlainText: unknown }>('../MarkdownFormatText/PlainText');
	return {
		MarkdownContent: actualMarkdown.MarkdownContent,
		PlainText: actualPlain.PlainText,
		MentionUser: ({ tagUserName, tagRoleName }: { tagUserName?: string; tagRoleName?: string }) => (
			<a data-entity-type="MessageEntityMentionName">{tagUserName ?? tagRoleName ?? ''}</a>
		),
		EmojiMarkup: ({ emojiSyntax }: { emojiSyntax: string }) => <span>{emojiSyntax}</span>,
		ChannelHashtag: ({ channelLabel }: { channelLabel?: string }) => <span data-channel-hashtag="true">{channelLabel ?? ''}</span>,
		CanvasHashtag: ({ title }: { title: string }) => <span data-canvas-hashtag="true">{title}</span>
	};
});

function collectText(node: JsonNode | JsonNode[]): string {
	if (node === null || node === undefined) return '';
	if (typeof node === 'string') return node;
	if (Array.isArray(node)) return node.map(collectText).join('');
	return (node.children ?? []).map(collectText).join('');
}

describe('MessageLine markdown blocks and named links', () => {
	it('keeps plain messages without block markers or named links inline with exact textContent', () => {
		const t = 'hello world\nsecond line';
		const renderer = create(<MessageLine content={{ t }} isTokenClickAble={true} isJumMessageEnabled={false} isEditted={false} messageId="m1" />);
		expect(collectText(renderer.toJSON())).toBe(t);
		expect(renderer.root.findAllByType('div')).toHaveLength(1);
		renderer.unmount();
	});

	it('renders ul, ol, and quote blocks with aligned indentation and preserves textContent offsets for mentions and edited suffix', () => {
		const olAndQuote = 'intro\n1. first\n  2) @alice hi\n> quoted\noutro';
		const mentionStart = olAndQuote.indexOf('@alice');
		const mentionEnd = mentionStart + '@alice'.length;
		const renderer = create(
			<MessageLine
				content={{
					t: olAndQuote,
					mentions: [{ user_id: 'u1', s: mentionStart, e: mentionEnd, username: 'alice' }]
				}}
				isTokenClickAble={true}
				isJumMessageEnabled={false}
				isEditted={true}
				messageId="m2"
			/>
		);
		const fullText = collectText(renderer.toJSON());
		expect(fullText).toBe(`${olAndQuote}(edited)`);
		expect(fullText.slice(mentionStart, mentionEnd)).toBe('@alice');
		renderer.unmount();

		const ulText = '- one\n  * @bob ok';
		const bobStart = ulText.indexOf('@bob');
		const bobEnd = bobStart + '@bob'.length;
		const ulRenderer = create(
			<MessageLine
				content={{
					t: ulText,
					mentions: [{ user_id: 'u2', s: bobStart, e: bobEnd, username: 'bob' }]
				}}
				isTokenClickAble={true}
				isJumMessageEnabled={false}
				isEditted={false}
				messageId="m3"
			/>
		);
		const renderedUlText = collectText(ulRenderer.toJSON());
		expect(renderedUlText).toBe('• one\n  • @bob ok');
		expect(renderedUlText.length).toBe(ulText.length);
		expect(renderedUlText.slice(bobStart, bobEnd)).toBe('@bob');
		ulRenderer.unmount();
	});

	it('renders named links with label, title tooltip, style wrapping, skipped social/maps swap, and exact textContent', () => {
		const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
		const t = `watch [Mezon video](${url}) now`;
		const labelStart = t.indexOf('Mezon video');
		const labelEnd = labelStart + 'Mezon video'.length;
		const urlStart = t.indexOf(url);
		const urlEnd = urlStart + url.length;
		const renderer = create(
			<MessageLine
				content={{
					t,
					mk: [
						{ type: EBacktickType.BOLD, s: labelStart, e: labelEnd },
						{ type: EBacktickType.LINKYOUTUBE, s: urlStart, e: urlEnd }
					]
				}}
				isTokenClickAble={true}
				isJumMessageEnabled={false}
				isEditted={false}
				messageId="m4"
			/>
		);
		expect(collectText(renderer.toJSON())).toBe(t);
		const anchors = renderer.root.findAllByType('a');
		expect(anchors).toHaveLength(1);
		expect(anchors[0].props.href).toBe(url);
		expect(anchors[0].props.title).toBe(url);
		expect(anchors[0].props.children).toBe('Mezon video');
		expect(renderer.root.findAllByType('strong')).toHaveLength(1);
		expect(renderer.root.findAllByType('lite-youtube')).toHaveLength(0);
		renderer.unmount();
		const mapsUrl = 'https://www.google.com/maps?q=10.76,106.66';
		const mapsText = `at [office map](${mapsUrl})`;
		const ms = mapsText.indexOf(mapsUrl);
		const me = ms + mapsUrl.length;
		const mapsRenderer = create(
			<MessageLine
				content={{ t: mapsText, mk: [{ type: EBacktickType.LINK, s: ms, e: me }] }}
				isTokenClickAble={true}
				isJumMessageEnabled={false}
				isEditted={false}
				messageId="m4b"
			/>
		);
		expect(collectText(mapsRenderer.toJSON())).toBe(mapsText);
		expect(mapsRenderer.root.findAllByType('a')[0].props.children).toBe('office map');
		mapsRenderer.unmount();
	});

	it('skips block rendering in jump/reply preview mode while still converting named links and leaving channel links untouched', () => {
		const docUrl = 'https://mezon.ai/docs';
		const replyText = `- see [docs](${docUrl})`;
		const s = replyText.indexOf(docUrl);
		const e = s + docUrl.length;
		const replyRenderer = create(
			<MessageLine
				content={{ t: replyText, mk: [{ type: EBacktickType.LINK, s, e }] }}
				isTokenClickAble={false}
				isJumMessageEnabled={true}
				isEditted={false}
				messageId="m5"
			/>
		);
		expect(collectText(replyRenderer.toJSON())).toBe(replyText);
		const anchors = replyRenderer.root.findAllByType('a');
		expect(anchors).toHaveLength(1);
		expect(anchors[0].props.children).toBe('docs');
		expect(replyRenderer.root.findAllByType('div').length).toBeLessThanOrEqual(2);
		replyRenderer.unmount();

		const chanUrl = 'https://mezon.ai/chat/clans/1111111111111111111/channels/2222222222222222222';
		const chanText = `go [general](${chanUrl})`;
		const cs = chanText.indexOf(chanUrl);
		const ce = cs + chanUrl.length;
		const chanRenderer = create(
			<MessageLine
				content={{ t: chanText, mk: [{ type: EBacktickType.LINK, s: cs, e: ce }] }}
				isTokenClickAble={true}
				isJumMessageEnabled={false}
				isEditted={false}
				messageId="m6"
			/>
		);
		expect(chanRenderer.root.findAllByType('a')).toHaveLength(0);
		expect(collectText(chanRenderer.toJSON())).toBe(chanText);
		chanRenderer.unmount();
	});
});
