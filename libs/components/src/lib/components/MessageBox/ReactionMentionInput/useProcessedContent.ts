import { IBoldTextOnMessage, ILinkOnMessage, ILinkVoiceRoomOnMessage, IMarkdownOnMessage, processText } from '@mezon/utils';
import { useEffect, useState } from 'react';

const useProcessedContent = (inputText: string) => {
	const [linkList, setLinkList] = useState<ILinkOnMessage[]>([]);
	const [markdownList, setMarkdownList] = useState<IMarkdownOnMessage[]>([]);
	const [voiceLinkRoomList, setVoiceLinkRoomList] = useState<ILinkVoiceRoomOnMessage[]>([]);
	const [boldTextList, setBoldTextList] = useState<IBoldTextOnMessage[]>([]);

	useEffect(() => {
		const processInput = () => {
			const { links, markdowns, voiceRooms, boldTexts } = processText(inputText);
			setLinkList(links);
			setMarkdownList(markdowns);
			setVoiceLinkRoomList(voiceRooms);
			setBoldTextList(boldTexts);
		};

		processInput();
	}, [inputText]);
	return { linkList, markdownList, inputText, voiceLinkRoomList, boldTextList };
};

export default useProcessedContent;
