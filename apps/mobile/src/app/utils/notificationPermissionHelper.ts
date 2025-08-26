import { ActionEmitEvent } from '@mezon/mobile-components';
import React from 'react';
import { DeviceEventEmitter } from 'react-native';
import { NotificationBottomSheet } from '../components/NotificationPermissionAlert';
import { getNotificationPermission } from './pushNotificationHelpers';
export interface NotificationPermissionCheckOptions {
	showBottomSheet?: boolean;
	onPermissionGranted?: () => void;
	onPermissionDenied?: () => void;
}

/**
 * Check notification permission and show bottom sheet if needed
 * Used when creating new channels, threads, or DMs
 */
export const checkNotificationPermissionMiddleware = async (options: NotificationPermissionCheckOptions = {}): Promise<boolean> => {
	const { showBottomSheet = true, onPermissionGranted, onPermissionDenied } = options;

	try {
		const hasPermission = await getNotificationPermission(false);

		if (hasPermission) {
			onPermissionGranted?.();
			return true;
		}

		onPermissionDenied?.();
		if (showBottomSheet) showNotificationPermissionBottomSheet();

		return false;

	} catch (error) {
		console.error('Error checking notification permission:', error);
		onPermissionDenied?.();
		return false;
	}
};

/**
 * Show notification permission bottom sheet
 */
export const showNotificationPermissionBottomSheet = () => {
	const data = {
		heightFitContent: true,
		children: React.createElement(NotificationBottomSheet, {
			onDismiss: () => {
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			},
			onOpenSettings: () => {
				console.log('Opening notification settings from create action...');
			}
		})
	};

	DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
};

/**
 * Check notification permission and show bottom sheet if needed, but always proceed with navigation
 * Used when creating new channels, threads, or DMs - always navigate regardless of permission status
 */
export const checkNotificationPermissionAndNavigate = async (
	navigationAction: (() => void) | (() => Promise<void>),
	options: NotificationPermissionCheckOptions = {}
): Promise<void> => {
	const { showBottomSheet = true } = options;

	try {
		const hasPermission = await getNotificationPermission(false);
		await navigationAction();

		if (!hasPermission && showBottomSheet) {
			showNotificationPermissionBottomSheet();
		}
	} catch (error) {
		console.error('Error checking notification permission:', error);
		// Still proceed with navigation even if there's an error
		await navigationAction();
	}
};
