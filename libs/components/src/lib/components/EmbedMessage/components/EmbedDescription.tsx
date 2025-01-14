import { convertMarkdown, EBacktickType, ETokenMessage } from '@mezon/utils';
import { useMemo } from 'react';
import { MarkdownContent } from '../../MarkdownFormatText/MarkdownContent';
import useProcessedContent from '../../MessageBox/ReactionMentionInput/useProcessedContent';
import { ElementToken } from '../../MessageWithUser/MessageLine';

interface EmbedDescriptionProps {
	description: string;
}

export function EmbedDescription({ description }: EmbedDescriptionProps) {
	const { markdownList } = useProcessedContent(description);
	const mkm = Array.isArray(markdownList) ? markdownList.map((item) => ({ ...item, kindOf: ETokenMessage.MARKDOWNS })) : [];
	const elements: ElementToken[] = [...mkm].sort((a, b) => (a.s ?? 0) - (b.s ?? 0));

	let lastindex = 0;
	const content = useMemo(() => {
		const formattedContent: React.ReactNode[] = [];

		elements.forEach((element, index) => {
			const s = element.s ?? 0;
			const e = element.e ?? 0;

			const contentInElement = description?.substring(s, e);

			if (lastindex < s) {
				formattedContent.push(<p key={`plain-${lastindex}`}>{description?.slice(lastindex, s) ?? ''}</p>);
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

		if (description && lastindex < description?.length) {
			formattedContent.push(<p key={`plain-${lastindex}-end`}>{description.slice(lastindex)}</p>);
		}

		return formattedContent;
	}, [elements]);

	return <div className="mt-2 text-sm text-textSecondary800 dark:text-textSecondary">{content}</div>;
}
