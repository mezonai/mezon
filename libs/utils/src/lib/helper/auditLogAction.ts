import { ActionLog } from '../types';

const ACTION_LOG_API_OVERRIDES: Partial<Record<ActionLog, string>> = {
	[ActionLog.UPDATE_CHANNEL_PRIVATE_ACTION_AUDIT]: 'Update Channel private',
	[ActionLog.DELETE_CHANNE_ACTION_AUDIT]: 'Delete Channel'
};

export const actionLogToApiValue = (actionLog: string): string => {
	if (!actionLog || actionLog === ActionLog.ALL_ACTION_AUDIT) {
		return '';
	}

	const override = ACTION_LOG_API_OVERRIDES[actionLog as ActionLog];
	if (override) {
		return override;
	}

	return actionLog
		.replace(/_ACTION_AUDIT$/, '')
		.split('_')
		.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
		.join(' ');
};
