interface PasteProcessResult {
  shouldInsertAsHtml: boolean;
  content: string;
  hasMentions: boolean;
}

export const processPasteContent = (htmlContent: string, plainText: string): PasteProcessResult => {
  if (!htmlContent || htmlContent === plainText) {
    return {
      shouldInsertAsHtml: false,
      content: plainText,
      hasMentions: false,
    };
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const mentionElements = tempDiv.querySelectorAll('a[data-entity-type="MessageEntityMentionName"], a[data-entity-type="MessageEntityMentionRole"]');
  const hasMentions = mentionElements.length > 0;

  const images = tempDiv.querySelectorAll('img');
  images.forEach(el => el.remove());

  const scripts = tempDiv.querySelectorAll('script, style, link, meta, title');
  scripts.forEach(el => el.remove());

  if (hasMentions) {
    let processedContent = tempDiv.innerHTML;
    processedContent = processedContent.replace(/&nbsp;/g, ' ');
    processedContent = processedContent.replace(/<br\s*\/?>/gi, '\n');
    processedContent = processedContent.replace(/<\/p>/gi, '\n');
    processedContent = processedContent.replace(/<p[^>]*>/gi, '');
    processedContent = processedContent.replace(/<div[^>]*>/gi, '\n');
    processedContent = processedContent.replace(/<\/div>/gi, '');

    return {
      shouldInsertAsHtml: true,
      content: processedContent,
      hasMentions: true,
    };
  } else {
    let cleanText = tempDiv.innerHTML;

    cleanText = cleanText.replace(/&nbsp;/g, ' ');
    cleanText = cleanText.replace(/&tab;/g, '\t');
    cleanText = cleanText.replace(/<br\s*\/?>/gi, '\n');
    cleanText = cleanText.replace(/<\/p>/gi, '\n');
    cleanText = cleanText.replace(/<p[^>]*>/gi, '');
    cleanText = cleanText.replace(/<div[^>]*>/gi, '\n');
    cleanText = cleanText.replace(/<\/div>/gi, '');
    cleanText = cleanText.replace(/<[^>]*>/g, '');

    const textarea = document.createElement('textarea');
    textarea.innerHTML = cleanText;
    cleanText = textarea.value || plainText || '';

    return {
      shouldInsertAsHtml: false,
      content: cleanText,
      hasMentions: false,
    };
  }
};

export const insertPastedContent = (
  content: string,
  shouldInsertAsHtml: boolean,
  target: HTMLElement,
  onContentChange: (html: string) => void
): void => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  if (shouldInsertAsHtml) {
    const fragment = range.createContextualFragment(content);
    range.insertNode(fragment);
  } else {
    range.insertNode(document.createTextNode(content));
  }

  const newHtml = target.innerHTML;
  onContentChange(newHtml);
};
