import { ViewStyle } from 'react-native';

export interface IUserStatusProps {
	status: IUserStatus;
	customStyles?: ViewStyle;
	iconSize?: number;
	customStatus?: string;
}

export interface IUserStatus {
	status?: boolean;
	isMobile?: boolean;
	userStatus?: string;
}
