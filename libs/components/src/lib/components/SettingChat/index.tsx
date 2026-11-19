import { EmojiSuggestionProvider, useQuickReactionEmoji } from '@mezon/core';
import { appActions, fetchDMSetting, selectIsQuickReply, selectOnlyFriendsDM, updateDMSetting, useAppDispatch } from '@mezon/store';
import { generateE2eId, getSrcEmoji } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { EmojiRolePanel } from '../EmojiPicker/EmojiRolePanel';

type SettingChatProps = {
	menuIsOpen: boolean;
};

const SettingChat = ({ menuIsOpen }: SettingChatProps) => {
	const { t } = useTranslation('setting');
	const isQuickReply = useSelector(selectIsQuickReply);
	const onlyFriendsDM = useSelector(selectOnlyFriendsDM);
	const quickReaction = useQuickReactionEmoji();
	const [isQuickReactionPickerOpen, setIsQuickReactionPickerOpen] = useState(false);
	const dispatch = useAppDispatch();

	const handleSelectQuickReaction = (emojiId: string, emojiShortname: string) => {
		dispatch(appActions.setQuickReactionEmoji({ id: emojiId, shortname: emojiShortname }));
		setIsQuickReactionPickerOpen(false);
	};

	useEffect(() => {
		dispatch(fetchDMSetting());
	}, [dispatch]);

	const rows = [
		{
			id: 'quick_reply_switch',
			title: t('chat.quickReplies'),
			description: t('chat.quickRepliesDescription'),
			checked: isQuickReply,
			onChange: () => dispatch(appActions.toggleIsQuickReply())
		},
		{
			id: 'only_friends_dm_switch',
			title: t('chat.onlyFriendsDm.title'),
			description: t('chat.onlyFriendsDm.description'),
			checked: onlyFriendsDM,
			onChange: () => dispatch(updateDMSetting({ only_friends_dm: !onlyFriendsDM }))
		}
	] as const;

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink w-1/2 pt-[94px] pb-7 pr-[10px] sbm:pl-[40px] pl-[10px] overflow-x-hidden ${menuIsOpen ? 'min-w-[700px]' : ''} 2xl:min-w-[900px] max-w-[740px] hide-scrollbar text-theme-primary text-sm`}
		>
			<h1 className="text-xl font-semibold tracking-wider mb-8 text-theme-primary-active">{t('appSettings.chat')}</h1>
			<div className="flex flex-col gap-3">
				{rows.map(({ id, title, description, checked, onChange }) => (
					<div key={id} className="flex items-center justify-between gap-4 rounded-lg border border-color-primary bg-theme-setting-nav p-4">
						<div className="flex min-w-0 flex-col gap-1">
							<h2 id={`${id}-label`} className="text-base font-medium text-theme-primary-active">
								{title}
							</h2>
							<p id={`${id}-description`} className="text-sm text-theme-primary">
								{description}
							</p>
						</div>
						<label
							className="relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent p-px"
							data-e2e={generateE2eId(`user_setting.chat.${id}`)}
						>
							<input
								type="checkbox"
								role="switch"
								checked={checked}
								onChange={onChange}
								aria-labelledby={`${id}-label`}
								aria-describedby={`${id}-description`}
								className="peer sr-only"
							/>
							<span
								className={`flex h-5 w-8 items-center rounded-full border px-0.5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500 ${checked ? 'justify-end border-[#5865f2] bg-[#5865f2] hover:bg-[#4752c4]' : 'justify-start border-color-primary bg-theme-input bg-item-hover'}`}
							>
								<span className={`h-3 w-3 rounded-full bg-[var(--text-secondary)] ${checked ? '' : 'opacity-50'}`} />
							</span>
						</label>
					</div>
				))}
				<div className="flex flex-col gap-3 rounded-lg border border-color-primary bg-theme-setting-nav p-4">
					<div className="flex items-center justify-between gap-4">
						<div className="flex min-w-0 flex-col gap-1">
							<h2 id="quick_reaction-label" className="text-base font-medium text-theme-primary-active">
								{t('chat.quickReaction')}
							</h2>
							<p className="text-sm text-theme-primary">{t('chat.quickReactionDescription')}</p>
						</div>
						<button
							id="quick_reaction-button"
							type="button"
							onClick={() => setIsQuickReactionPickerOpen((isOpen) => !isOpen)}
							aria-expanded={isQuickReactionPickerOpen}
							aria-labelledby="quick_reaction-label quick_reaction-button"
							className="flex shrink-0 items-center gap-2 rounded-lg border border-color-primary bg-theme-input bg-item-hover px-3 py-1.5 text-theme-primary-active"
						>
							{quickReaction?.id && (
								<img
									src={getSrcEmoji(quickReaction.id, quickReaction.src)}
									alt={quickReaction.shortname}
									className="h-6 w-6 object-scale-down"
								/>
							)}
							{t('chat.quickReactionChange')}
						</button>
					</div>
					{isQuickReactionPickerOpen && (
						<div className="rounded-lg border border-color-primary bg-theme-setting-primary">
							<EmojiSuggestionProvider>
								<EmojiRolePanel onEmojiSelect={handleSelectQuickReaction} onClose={() => setIsQuickReactionPickerOpen(false)} />
							</EmojiSuggestionProvider>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SettingChat;
