import type { EBacktickType, IMarkdownOnMessage } from '@mezon/utils';
import { ETokenMessage, convertMarkdown, parseHtmlAsFormattedText, processMarkdownEntities } from '@mezon/utils';
import { useMemo } from 'react';
import { MarkdownContent } from '../../MarkdownFormatText/MarkdownContent';
import type { ElementToken } from '../../MessageWithUser/MessageLine';

interface EmbedDescriptionProps {
	description: string;
}

export function EmbedDescription({ description }: EmbedDescriptionProps) {
	const { text, entities } = parseHtmlAsFormattedText(String(description || ''));
	const markdownList: IMarkdownOnMessage[] = processMarkdownEntities(text, entities);

	const mkm = markdownList.map((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS }));
	const elements: ElementToken[] = [...mkm].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

	let lastindex = 0;
	const content = useMemo(() => {
		const formattedContent: React.ReactNode[] = [];

		elements.forEach((element, index) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			const contentInElement = text?.substring(s, e);

			if (lastindex < s) {
				formattedContent.push(
					<p key={`plain-${lastindex}`} className="whitespace-pre-line break-words">
						{text?.slice(lastindex, s) ?? ''}
					</p>
				);
			}

			if (element.kindOf === ETokenMessage.MARKDOWNS) {
				let content = contentInElement ?? '';
				content = convertMarkdown(content, element.type as EBacktickType);
				formattedContent.push(
					<MarkdownContent
						isBacktick={true}
						isTokenClickAble={false}
						isJumMessageEnabled={false}
						key={`markdown-${index}-${s}-${contentInElement}`}
						content={content}
						isInPinMsg={false}
						typeOfBacktick={element.type}
					/>
				);
			}

			lastindex = e;
		});

		if (text && lastindex < text?.length) {
			formattedContent.push(
				<p key={`plain-${lastindex}-end`} className="whitespace-pre-line break-words">
					{text.slice(lastindex)}
				</p>
			);
		}

		return formattedContent;
	}, [elements]);

	return <div className="mt-2 text-sm text-theme-primary break-words">{content}</div>;
}
