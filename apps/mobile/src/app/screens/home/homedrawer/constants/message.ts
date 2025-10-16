import { TFunction } from 'i18next';
import { EMessageActionType } from '../enums';
import { IMessageAction } from '../types';

export const getMessageActions = (t: TFunction): IMessageAction[] => {
	return [
		{
			id: 17,
			title: t('message:actions.resend'),
			type: EMessageActionType.ResendMessage
		},
		{
			id: 2,
			title: t('message:actions.forwardAllMessages'),
			type: EMessageActionType.ForwardAllMessages
		},
		{
			id: 16,
			title: t('message:actions.giveACoffee'),
			type: EMessageActionType.GiveACoffee
		},
		{
			id: 3,
			title: t('message:actions.editMessage'),
			type: EMessageActionType.EditMessage
		},
		{
			id: 4,
			title: t('message:actions.reply'),
			type: EMessageActionType.Reply
		},
		{
			id: 1,
			title: t('message:actions.forward'),
			type: EMessageActionType.ForwardMessage
		},
		{
			id: 5,
			title: t('message:actions.createThread'),
			type: EMessageActionType.CreateThread
		},
		{
			id: 6,
			title: t('message:actions.copyText'),
			type: EMessageActionType.CopyText
		},
		{
			id: 21,
			title: t('message:actions.copyImage'),
			type: EMessageActionType.CopyImage
		},
		{
			id: 22,
			title: t('message:actions.shareImage'),
			type: EMessageActionType.ShareImage
		},
		{
			id: 19,
			title: t('message:actions.markUnRead'),
			type: EMessageActionType.MarkUnRead
		},
		{
			id: 18,
			title: t('message:actions.topicDiscussion'),
			type: EMessageActionType.TopicDiscussion
		},
		{
			id: 7,
			title: t('message:actions.deleteMessage'),
			type: EMessageActionType.DeleteMessage
		},
		{
			id: 8,
			title: t('message:actions.pinMessage'),
			type: EMessageActionType.PinMessage
		},
		{
			id: 9,
			title: t('message:actions.unPinMessage'),
			type: EMessageActionType.UnPinMessage
		},
		// {
		// 	id: 11,
		// 	title: t('message:actions.mention'),
		// 	type: EMessageActionType.Mention
		// },
		{
			id: 13,
			title: t('message:actions.report'),
			type: EMessageActionType.Report
		},
		{
			id: 14,
			title: t('message:actions.saveImage'),
			type: EMessageActionType.SaveImage
		},
		{
			id: 15,
			title: t('message:actions.markMessage'),
			type: EMessageActionType.MarkMessage
		},
		{
			id: 20,
			title: t('message:actions.quickMenu'),
			type: EMessageActionType.QuickMenu
		}
	];
};
