import { ReactNode } from "react";

export type TextFilter = (
  'escape_html' | 'br_html' | 'br'
);

const SIMPLE_MARKDOWN_REGEX = /(\*\*|__).+?\1/g;


export function compact<T>(array: T[]) {
  return array.filter(Boolean);
}

export default function renderText(
  part: ReactNode,
  filters: Array<TextFilter> = ['escape_html'],
): ReactNode[] {
  if (typeof part !== 'string') {
    return [part];
  }

  return compact(filters.reduce((text, filter) => {
    switch (filter) {
      case 'escape_html':
        return escapeHtml(text);

      case 'br':
        return addLineBreaks(text, 'jsx');

      case 'br_html':
        return addLineBreaks(text, 'html');
    }

    return text;
  }, [part] as ReactNode[]));
}

function escapeHtml(ReactNodes: ReactNode[]): ReactNode[] {
  const divEl = document.createElement('div');
  return ReactNodes.reduce((result: ReactNode[], part) => {
    if (typeof part !== 'string') {
      result.push(part);
      return result;
    }

    divEl.innerText = part;
    result.push(divEl.innerHTML);

    return result;
  }, []);
}


function addLineBreaks(ReactNodes: ReactNode[], type: 'jsx' | 'html'): ReactNode[] {
  return ReactNodes.reduce((result: ReactNode[], part) => {
    if (typeof part !== 'string') {
      result.push(part);
      return result;
    }

    const splittenParts = part
      .split(/\r\n|\r|\n/g)
      .reduce((parts: ReactNode[], line: string, i, source) => {
        const trimmedLine = line.trimLeft();
        const indentLength = line.length - trimmedLine.length;
        parts.push(String.fromCharCode(160).repeat(indentLength) + trimmedLine);

        if (i !== source.length - 1) {
          parts.push(
            '<br/>'
          );
        }

        return parts;
      }, []);

    return [...result, ...splittenParts];
  }, []);
}

export function areLinesWrapping(text: string, element: HTMLElement) {
  const lines = (text.trim().match(/\n/g) || '').length + 1;
  const { lineHeight } = getComputedStyle(element);
  const lineHeightParsed = parseFloat(lineHeight.split('px')[0]);

  return element.clientHeight >= (lines + 1) * lineHeightParsed;
}
