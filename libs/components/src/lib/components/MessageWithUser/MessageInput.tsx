import { useChannelMembers, useEditMessage, useEmojiSuggestionContext } from '@mezon/core';
import type { MessagesEntity } from '@mezon/store';
import { pinMessageActions, selectAllChannels, selectAllHashtagDm, selectAllRolesClan, selectCurrentChannelId, useAppDispatch } from '@mezon/store';
import {
	RECENT_EMOJI_CATEGORY,
	TITLE_MENTION_HERE,
	addMention,
	convertMessageToHtml,
	filterEmptyArrays,
	processEntitiesDirectly,
	searchMentionsHashtag
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ModalDeleteMess from '../../components/DeleteMessageModal/ModalDeleteMess';
import Mention, { type MentionData } from '../../components/MessageBox/ReactionMentionInput/Mention';
import MentionsInput, { type FormattedText, type MentionsInputHandle } from '../../components/MessageBox/ReactionMentionInput/MentionsInput';
import SuggestItem from '../../components/MessageBox/ReactionMentionInput/SuggestItem';
import parseHtmlAsFormattedText from '../../components/MessageBox/ReactionMentionInput/parseHtmlAsFormattedText';
import { UserMentionList } from '../../components/UserMentionList';

type MessageInputProps = {
	messageId: string;
	channelId: string;
	mode: number;
	channelLabel: string;
	message: MessagesEntity;
	isTopic: boolean;
};

type ChannelsMentionProps = {
	id: string;
	display: string;
	subText: string;
};

const MessageInput: React.FC<MessageInputProps> = ({ channelId, mode, channelLabel, message, isTopic }) => {
	const currentChannelId = useSelector(selectCurrentChannelId);
	const { openEditMessageState, idMessageRefEdit, handleCancelEdit, handleSend } = useEditMessage(
		isTopic ? currentChannelId || '' : channelId,
		channelLabel,
		mode,
		message
	);
	const { emojis } = useEmojiSuggestionContext();
	const editorRef = useRef<MentionsInputHandle | null>(null);
	const mentionListData = UserMentionList({ channelID: channelId, channelMode: mode });
	const rolesClan = useSelector(selectAllRolesClan);
	useChannelMembers({ channelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const [showModal, closeModal] = useModal(() => {
		return <ModalDeleteMess mess={message} closeModal={closeModal} mode={mode} />;
	}, [message?.id]);
	const dispatch = useAppDispatch();

	const queryEmojis = (query: string) => {
		if (!query || emojis.length === 0) return [];
		const q = query.toLowerCase();
		const matches: { id: string; display: string; src?: string }[] = [];

		for (const { id, shortname, category, src } of emojis) {
			if (category === RECENT_EMOJI_CATEGORY || !shortname || !shortname.includes(q)) continue;
			if (!id) continue;
			matches.push({ id, display: shortname, src });
			if (matches.length === 20) break;
		}

		return matches;
	};
	const channels = useSelector(selectAllChannels);

	const listChannelsMention = useMemo(() => {
		if (mode !== ChannelStreamMode.STREAM_MODE_GROUP && mode !== ChannelStreamMode.STREAM_MODE_DM) {
			return channels.map((item) => {
				return {
					id: item?.channel_id ?? '',
					display: item?.channel_label ?? '',
					subText: item?.category_name ?? ''
				};
			});
		} else {
			return [];
		}
	}, [mode, channels]);

	useEffect(() => {
		if (openEditMessageState && message.id === idMessageRefEdit) {
			editorRef.current?.focus();
		}
	}, [openEditMessageState, message.id, idMessageRefEdit]);

	const initialFormattedValue = useMemo(() => {
		if (!message.content) return '';

		const extendedMessage = {
			t: message.content.t || '',
			mentions: message.mentions || [],
			hg: message.content.hg || [],
			ej: message.content.ej || [],
			mk: message.content.mk || []
		};
		return convertMessageToHtml(extendedMessage);
	}, [message.content, message.mentions]);

	const [inputValue, setInputValue] = useState(initialFormattedValue);

	useEffect(() => {
		setInputValue(initialFormattedValue);
	}, [initialFormattedValue]);

	const handleSendWithFormattedText = async (formattedText: FormattedText) => {
		const { text: newPlainTextValue, entities } = formattedText;
		if (newPlainTextValue?.trim() === '') {
			showModal();
			return;
		}

		const initialFormattedText = parseHtmlAsFormattedText(initialFormattedValue, true, false);

		if (JSON.stringify(formattedText) === JSON.stringify(initialFormattedText)) {
			handleCancelEdit();
			return;
		}

		if (entities && entities.length > 0) {
			const {
				mentions: mentionList,
				hashtags: hashtagList,
				emojis: emojiList,
				markdown: markdownList
			} = processEntitiesDirectly(entities, newPlainTextValue, rolesClan);

			const payload = {
				t: newPlainTextValue,
				hg: hashtagList,
				ej: emojiList,
				mk: markdownList,
				cid: message?.content?.cid
			};

			const addMentionToPayload = addMention(payload, mentionList);
			const removeEmptyOnPayload = filterEmptyArrays(addMentionToPayload);

			try {
				handleSend(removeEmptyOnPayload, message.id, mentionList, isTopic ? channelId : message?.content?.tp || '', isTopic);

				dispatch(
					pinMessageActions.updatePinMessage({
						channelId,
						pinId: message.id,
						pinMessage: {
							...message,
							content: JSON.stringify(removeEmptyOnPayload)
						}
					})
				);
			} catch (error) {
				console.error('Error sending message:', error);
			}
		} else {
			const payload = {
				t: newPlainTextValue,
				cid: message?.content?.cid
			};

			try {
				handleSend(payload, message.id, [], isTopic ? channelId : message?.content?.tp || '', isTopic);

				dispatch(
					pinMessageActions.updatePinMessage({
						channelId,
						pinId: message.id,
						pinMessage: {
							...message,
							content: JSON.stringify(payload)
						}
					})
				);
			} catch (error) {
				console.error('Error sending message:', error);
			}
		}

		handleCancelEdit();
	};

	const commonChannels = useSelector(selectAllHashtagDm);

	const commonChannelsMention: ChannelsMentionProps[] = useMemo(() => {
		if (mode === ChannelStreamMode.STREAM_MODE_DM) {
			return commonChannels.map((item) => {
				return {
					id: item?.channel_id ?? '',
					display: item?.channel_label ?? '',
					subText: item?.clan_name ?? ''
				};
			}) as ChannelsMentionProps[];
		}
		return [];
	}, [mode, commonChannels]);

	const handleSearchUserMention = (search: string): MentionData[] => {
		return searchMentionsHashtag(search, mentionListData ?? []) as MentionData[];
	};

	const handleSearchHashtag = (search: string): MentionData[] => {
		if (mode === ChannelStreamMode.STREAM_MODE_DM) {
			return searchMentionsHashtag(search, commonChannelsMention ?? []) as MentionData[];
		} else {
			return searchMentionsHashtag(search, listChannelsMention ?? []) as MentionData[];
		}
	};

	const handleSave = () => {
		if (editorRef.current) {
			const element = editorRef.current.getElement();
			if (element) {
				const formattedText = parseHtmlAsFormattedText(element.innerHTML, true, false);
				handleSendWithFormattedText(formattedText as FormattedText);
			}
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement | HTMLInputElement>) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			handleCancelEdit();
		}
	};

	return (
		<div className="inputEdit w-full flex flex-col">
			<div className="w-full">
				<MentionsInput
					ref={editorRef}
					value={inputValue}
					setCaretToEnd={true}
					className={`w-full bg-theme-surface border-theme-primary rounded-lg p-[10px] text-theme-message customScrollLightMode mt-[5px]`}
					onSend={(formattedText: FormattedText) => {
						handleSendWithFormattedText(formattedText);
					}}
					onKeyDown={handleKeyDown}
					placeholder="Edit message..."
					style={{
						minHeight: '40px'
					}}
				>
					<Mention
						trigger="@"
						title="MEMBERS"
						data={handleSearchUserMention}
						displayPrefix="@"
						markup="@[__display__](__id__)"
						appendSpaceOnAdd={true}
						renderSuggestion={(
							suggestion: MentionData,
							search: string,
							_highlightedDisplay: React.ReactNode,
							_index: number,
							focused: boolean
						) => {
							return (
								<div
									className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-item-theme text-white' : ''
									}`}
								>
									<SuggestItem
										avatarUrl={suggestion.avatarUrl as string}
										valueHightLight={search}
										wrapSuggestItemStyle="justify-between w-full"
										subText={
											suggestion.display === TITLE_MENTION_HERE
												? 'Notify everyone who has permission to see this channel'
												: ((suggestion.username as string) ?? '')
										}
										subTextStyle={`${suggestion.display === TITLE_MENTION_HERE ? 'normal-case' : 'lowercase'} text-xs`}
										showAvatar={suggestion.display !== TITLE_MENTION_HERE}
										display={suggestion.display}
										color={suggestion.color as string}
									/>
								</div>
							);
						}}
					/>
					<Mention
						trigger="#"
						title="TEXT CHANNELS"
						data={handleSearchHashtag}
						displayPrefix="#"
						markup="#[__display__](__id__)"
						appendSpaceOnAdd={true}
						renderSuggestion={(suggestion, search, _highlightedDisplay, _index, focused) => (
							<div
								key={suggestion.id}
								className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
									focused ? 'bg-item-theme text-white' : ''
								}`}
							>
								<SuggestItem
									valueHightLight={search}
									display={suggestion.display}
									symbol="#"
									subText={suggestion.subText as string}
									channelId={suggestion.id}
								/>
							</div>
						)}
					/>
					<Mention
						trigger=":"
						title="EMOJI MATCHING"
						data={queryEmojis}
						markup="::[__display__](__id__)"
						appendSpaceOnAdd={true}
						renderSuggestion={(
							suggestion: MentionData,
							search: string,
							_highlightedDisplay: React.ReactNode,
							_index: number,
							focused: boolean
						) => {
							return (
								<div
									className={`bg-item-theme-hover flex items-center px-3 py-2 cursor-pointer rounded-lg ${
										focused ? 'bg-item-theme text-white' : ''
									}`}
								>
									<SuggestItem
										emojiId={suggestion.id}
										display={suggestion.display}
										valueHightLight={search}
										symbol={suggestion.emoji}
									/>
								</div>
							);
						}}
					/>
				</MentionsInput>
				<div className="text-xs flex text-theme-primary">
					<p className="pr-[3px]">escape to</p>
					<p
						className="pr-[3px] text-[#3297ff]"
						style={{ cursor: 'pointer' }}
						onClick={() => {
							handleCancelEdit();
						}}
					>
						cancel
					</p>
					<p className="pr-[3px]">• enter to</p>
					<p className="text-[#3297ff]" style={{ cursor: 'pointer' }} onClick={handleSave}>
						save
					</p>
				</div>
			</div>
		</div>
	);
};

export default React.memo(MessageInput);
