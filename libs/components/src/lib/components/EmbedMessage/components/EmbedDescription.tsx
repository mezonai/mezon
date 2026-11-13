import type { IMarkdownOnMessage } from '@mezon/utils';
import { EBacktickType, parseHtmlAsFormattedText, processMarkdownEntities, sanitizeHref } from '@mezon/utils';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { MarkdownContent } from '../../MarkdownFormatText/MarkdownContent';

interface EmbedDescriptionProps {
	description: string;
	messageId?: string;
}

const LINK_TYPES = new Set<string>([EBacktickType.LINK, EBacktickType.LINKYOUTUBE, EBacktickType.LINKFACEBOOK, EBacktickType.LINKTIKTOK]);

function isWebUrl(value: string): boolean {
	return /^https?:\/\//i.test(sanitizeHref(value) ?? '');
}

function renderMarkdown(item: IMarkdownOnMessage, value: string, key: string, messageId?: string): ReactNode {
	if (LINK_TYPES.has(item.type as string)) {
		if (!isWebUrl(value)) {
			return <span key={key}>{value}</span>;
		}
		return (
			<MarkdownContent
				key={key}
				isLink={true}
				isTokenClickAble={true}
				isJumMessageEnabled={false}
				content={value}
				typeOfBacktick={EBacktickType.LINK}
				messageId={messageId}
			/>
		);
	}

	if (item.type === EBacktickType.BOLD) {
		return <b key={key}>{value}</b>;
	}

	return (
		<MarkdownContent
			key={key}
			isBacktick={true}
			isTokenClickAble={false}
			isJumMessageEnabled={false}
			content={value}
			isInPinMsg={false}
			typeOfBacktick={item.type}
		/>
	);
}

export function EmbedDescription({ description, messageId }: EmbedDescriptionProps) {
	const content = useMemo(() => {
		const { text, entities } = parseHtmlAsFormattedText(String(description || ''));
		const markdownList = [...processMarkdownEntities(text, entities)].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));
		const nodes: ReactNode[] = [];
		let lastIndex = 0;

		markdownList.forEach((item) => {
			const s = item.s ?? 0;
			const e = item.e ?? 0;
			if (s < lastIndex) return;

			if (lastIndex < s) {
				nodes.push(<span key={`plain-${lastIndex}`}>{text.slice(lastIndex, s)}</span>);
			}
			nodes.push(renderMarkdown(item, text.slice(s, e), `markdown-${s}`, messageId));
			lastIndex = e;
		});

		if (lastIndex < text.length) {
			nodes.push(<span key={`plain-${lastIndex}`}>{text.slice(lastIndex)}</span>);
		}

		return nodes;
	}, [description, messageId]);

	return (
		<div className="mt-2 text-sm text-theme-primary whitespace-pre-line [overflow-wrap:anywhere] [&_*]:[overflow-wrap:anywhere]">{content}</div>
	);
}
