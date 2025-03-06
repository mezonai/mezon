import { useColorRole } from '../contexts/ColorRoleContext';

export function useColorsRoleById(messageSenderId: string) {
	const { getUserHighestRoleColor } = useColorRole();

	return {
		highestPermissionRoleColor: getUserHighestRoleColor(messageSenderId)
	};
}
