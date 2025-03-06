import { ActionEmitEvent, Icons } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { EventManagementEntity, selectClanById, selectMemberClanByUserId2, useAppSelector } from '@mezon/store-mobile';
import { EEventStatus } from '@mezon/utils';
import { DeviceEventEmitter, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonAvatar from '../../../componentUI/MezonAvatar';
import MezonButton from '../../../componentUI/MezonButton2';
import { EventChannelDetail } from '../EventChannelTitle';
import { EventLocation } from '../EventLocation';
import { EventMenu } from '../EventMenu';
import { EventTime } from '../EventTime';
import { style } from './styles';

interface IEventDetailProps {
	event: EventManagementEntity;
}

export function EventDetail({ event }: IEventDetailProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userCreate = useAppSelector((state) => selectMemberClanByUserId2(state, event?.creator_id || ''));
	const clans = useSelector(selectClanById(event?.clan_id || ''));

	function handlePress() {
		const data = {
			heightFitContent: true,
			children: <EventMenu event={event} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}

	return (
		<View style={styles.container}>
			<EventTime event={event} eventStatus={EEventStatus.CREATED} />
			{!!event?.channel_id && event.channel_id !== '0' && (
				<View style={styles.privateArea}>
					<View style={styles.privatePanel}>
						<Text style={styles.privateText}>Private Event</Text>
					</View>
				</View>
			)}
			<Text style={styles.title}>{event?.title}</Text>

			<View>
				<View style={styles.mainSection}>
					<View style={styles.inline}>
						<MezonAvatar avatarUrl={clans?.logo} username={clans?.clan_name} height={20} width={20} />
						<Text style={styles.smallText}>{clans?.clan_name}</Text>
					</View>

					<EventLocation event={event} />

					<View style={styles.inline}>
						<Icons.BellIcon height={16} width={16} color={themeValue.text} />
						<Text style={styles.smallText}>{event?.user_ids?.length}</Text>
						<Text style={styles.smallText}>{event?.user_ids?.length > 1 ? 'people are interested' : 'person is interested'}</Text>
					</View>

					<View style={styles.inline}>
						<MezonAvatar avatarUrl={userCreate?.user?.avatar_url} username={userCreate?.user?.username} height={20} width={20} />
						<Text style={styles.smallText}>Created by</Text>
						<Text style={[styles.smallText, styles.highlight]}>{userCreate?.user?.username}</Text>
					</View>
				</View>
			</View>

			{event.description && <Text style={styles.description}>{event.description}</Text>}

			<View style={styles.inline}>
				{/* <MezonButton title="End event" fluid /> */}
				<MezonButton
					icon={<Icons.CheckmarkLargeIcon height={16} width={16} color={themeValue.text} />}
					title="Interested"
					fluid
					border
					titleStyle={{ color: themeValue.text }}
				/>
				{/* <MezonButton title="Start event" fluid type="success" /> */}
				<MezonButton icon={<Icons.ShareIcon height={20} width={20} color={themeValue.text} />} />
				<MezonButton icon={<Icons.MoreVerticalIcon height={20} width={20} color={themeValue.text} />} onPress={handlePress} />
			</View>

			{!!event?.channel_id && event.channel_id !== '0' && <EventChannelDetail event={event} />}
		</View>
	);
}
