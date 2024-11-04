import { useChannelMembers, useEditMessage, useEmojiSuggestion, useEscapeKey } from '@mezon/core';
import {
	ChannelMembersEntity,
	selectAllChannels,
	selectAllHashtagDm,
	selectAllRolesClan,
	selectChannelDraftMessage,
	selectTheme,
	useAppSelector
} from '@mezon/store';
import {
	IMessageSendPayload,
	IMessageWithUser,
	MentionDataProps,
	ThemeApp,
	addMention,
	createFormattedString,
	filterEmptyArrays,
	processText,
	searchMentionsHashtag
} from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { ApiMessageMention } from 'mezon-js/api.gen';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mention, MentionsInput, OnChangeHandlerFunc } from 'react-mentions';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import ModalDeleteMess from '../../components/DeleteMessageModal/ModalDeleteMess';
import CustomModalMentions from '../../components/MessageBox/ReactionMentionInput/CustomModalMentions';
import SuggestItem from '../../components/MessageBox/ReactionMentionInput/SuggestItem';
import useProcessMention from '../../components/MessageBox/ReactionMentionInput/useProcessMention';
import { UserMentionList } from '../../components/UserMentionList';
import lightMentionsInputStyle from './LightRmentionInputStyle';
import darkMentionsInputStyle from './RmentionInputStyle';
import mentionStyle from './RmentionStyle';

type MessageInputProps = {
	messageId: string;
	channelId: string;
	mode: number;
	channelLabel: string;
	message: IMessageWithUser;
};

type ChannelsMentionProps = {
	id: string;
	display: string;
	subText: string;
};

const MessageInput: React.FC<MessageInputProps> = ({ messageId, channelId, mode, channelLabel, message }) => {
	const { openEditMessageState, idMessageRefEdit, handleCancelEdit, handleSend, setChannelDraftMessage } = useEditMessage(
		channelId,
		channelLabel,
		mode,
		message
	);
	const { emojis } = useEmojiSuggestion();
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const appearanceTheme = useSelector(selectTheme);
	const mentionListData = UserMentionList({ channelID: channelId, channelMode: mode });
	const rolesClan = useSelector(selectAllRolesClan);
	const { membersOfChild, membersOfParent } = useChannelMembers({ channelId: channelId, mode: ChannelStreamMode.STREAM_MODE_CHANNEL ?? 0 });
	const [showModal, closeModal] = useModal(() => {
		return <ModalDeleteMess mess={message} closeModal={closeModal} mode={mode} />;
	}, [message?.id]);

	const queryEmojis = (query: string, callback: (data: any[]) => void) => {
		if (query.length === 0) return;
		const matches = emojis
			.filter((emoji) => emoji.shortname && emoji.shortname.indexOf(query.toLowerCase()) > -1)
			.slice(0, 20)
			.map((emojiDisplay) => ({ id: emojiDisplay?.id, display: emojiDisplay?.shortname }));
		callback(matches);
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
			textareaRef.current?.focus();
		}
	}, [openEditMessageState, message.id, idMessageRefEdit]);

	const channelDraftMessage = useAppSelector((state) => selectChannelDraftMessage(state, channelId));
	const processedContentDraft: IMessageSendPayload = useMemo(() => {
		return {
			t: channelDraftMessage?.draftContent?.t,
			hg: channelDraftMessage?.draftContent?.hg,
			ej: channelDraftMessage?.draftContent?.ej,
			lk: channelDraftMessage?.draftContent?.lk,
			mk: channelDraftMessage?.draftContent?.mk,
			vk: channelDraftMessage?.draftContent?.vk
		};
	}, [channelDraftMessage?.draftContent, messageId]);

	const processedMentionDraft: ApiMessageMention[] = channelDraftMessage?.draftMention;

	const addMentionToContent = useMemo(
		() => addMention(processedContentDraft, processedMentionDraft),
		[processedContentDraft, processedMentionDraft]
	);

	const attachmentOnMessage = useMemo(() => {
		return message.attachments;
	}, [message.attachments]);

	const formatContentDraft = useMemo(() => createFormattedString(addMentionToContent), [addMentionToContent]);

	const handleFocus = () => {
		if (textareaRef.current) {
			const length = textareaRef.current.value.length;
			textareaRef.current.setSelectionRange(length, length);
		}
	};

	useEscapeKey(handleCancelEdit);

	const draftContent = channelDraftMessage?.draftContent?.t;

	const originalContent = useMemo(() => {
		return message.content?.t;
	}, [message.content?.t]);

	const onSend = (e: React.KeyboardEvent<Element>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			e.stopPropagation();
			textareaRef.current?.blur();

			if (draftContent === '') {
				showModal();
			} else if (draftContent === originalContent) {
				handleCancelEdit();
			} else {
				handleSend(filterEmptyArrays(processedContentDraft), message.id, processedMentionDraft);
				handleCancelEdit();
			}
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			handleCancelEdit();
		}
	};

	const handleSave = () => {
		if (draftContent === '') {
			textareaRef.current?.blur();
			return showModal();
		} else if (draftContent !== '' && draftContent === originalContent) {
			return handleCancelEdit();
		} else {
			handleSend(filterEmptyArrays(processedContentDraft), message.id, processedMentionDraft);
		}
		handleCancelEdit();
	};

	const [titleMention, setTitleMention] = useState('');

	const handleChange: OnChangeHandlerFunc = (event, newValue, newPlainTextValue, mentions) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const { mentionList, hashtagList, emojiList } = useProcessMention(
			mentions,
			rolesClan,
			membersOfChild as ChannelMembersEntity[],
			membersOfParent as ChannelMembersEntity[]
		);
		const { links, markdowns, voiceRooms } = processText(newPlainTextValue);
		setChannelDraftMessage(
			channelId,
			messageId,
			{
				t: newPlainTextValue,
				hg: hashtagList,
				ej: emojiList,
				lk: links,
				mk: markdowns,
				vk: voiceRooms
			},
			mentionList,
			attachmentOnMessage ?? []
		);

		if (newPlainTextValue.endsWith('@')) {
			setTitleMention('Members');
		} else if (newPlainTextValue.endsWith('#')) {
			setTitleMention('Channel List');
		} else if (newPlainTextValue.endsWith(':')) {
			setTitleMention('Emoji matching');
		}
	};
	const commonChannels = useSelector(selectAllHashtagDm);

	const [valueHighlight, setValueHightlight] = useState<string>('');
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

	const handleSearchUserMention = (search: any, callback: any) => {
		setValueHightlight(search);
		callback(searchMentionsHashtag(search, mentionListData ?? []));
	};

	const handleSearchHashtag = (search: any, callback: any) => {
		setValueHightlight(search);
		if (mode === ChannelStreamMode.STREAM_MODE_DM) {
			callback(searchMentionsHashtag(search, commonChannelsMention ?? []));
		} else {
			callback(searchMentionsHashtag(search, listChannelsMention ?? []));
		}
	};

	return (
		<div className="inputEdit w-full flex flex-col">
			<div className="w-full">
				<MentionsInput
					onFocus={handleFocus}
					inputRef={textareaRef}
					value={formatContentDraft ?? '{}'}
					className={`w-full dark:bg-black bg-white border border-[#bebebe] dark:border-none rounded p-[10px] dark:text-white text-black customScrollLightMode mt-[5px] ${appearanceTheme === ThemeApp.Light && 'lightModeScrollBarMention'}`}
					onKeyDown={onSend}
					onChange={handleChange}
					rows={channelDraftMessage?.draftContent?.t?.split('\n').length}
					forceSuggestionsAboveCursor={true}
					style={appearanceTheme === ThemeApp.Light ? lightMentionsInputStyle : darkMentionsInputStyle}
					customSuggestionsContainer={(children: React.ReactNode) => {
						return <CustomModalMentions children={children} titleModalMention={titleMention} />;
					}}
				>
					<Mention
						appendSpaceOnAdd={true}
						data={handleSearchUserMention}
						trigger="@"
						displayTransform={(id: any, display: any) => {
							return display === '@here' ? `${display}` : `@${display}`;
						}}
						renderSuggestion={(suggestion: MentionDataProps) => {
							return (
								<SuggestItem
									valueHightLight={valueHighlight}
									avatarUrl={suggestion.avatarUrl}
									subText={
										suggestion.display === '@here'
											? 'Notify everyone who has permission to see this channel'
											: (suggestion.username ?? '')
									}
									subTextStyle={(suggestion.display === '@here' ? 'normal-case' : 'lowercase') + ' text-xs'}
									showAvatar={suggestion.display !== '@here'}
									emojiId=""
									display={suggestion.display}
								/>
							);
						}}
						style={mentionStyle}
						className="dark:bg-[#3B416B] bg-bgLightModeButton"
					/>
					<Mention
						markup="#[__display__](__id__)"
						appendSpaceOnAdd={true}
						data={handleSearchHashtag}
						trigger="#"
						displayTransform={(id: any, display: any) => {
							return `#${display}`;
						}}
						style={mentionStyle}
						renderSuggestion={(suggestion) => (
							<SuggestItem
								valueHightLight={valueHighlight}
								display={suggestion.display ?? ''}
								symbol="#"
								subText={(suggestion as ChannelsMentionProps).subText}
								channelId={suggestion.id}
								emojiId=""
							/>
						)}
						className="dark:bg-[#3B416B] bg-bgLightModeButton"
					/>
					<Mention
						trigger=":"
						markup="::[__display__](__id__)"
						data={queryEmojis}
						displayTransform={(id: any, display: any) => {
							return `${display}`;
						}}
						renderSuggestion={(suggestion) => {
							return (
								<SuggestItem
									display={suggestion.display ?? ''}
									symbol={(suggestion as any).emoji}
									emojiId={suggestion.id as string}
								/>
							);
						}}
						className="dark:bg-[#3B416B] bg-bgLightModeButton"
						appendSpaceOnAdd={true}
					/>
				</MentionsInput>
				<div className="text-xs flex text-textLightTheme dark:text-textDarkTheme">
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
