import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { style } from './styles';

interface IConversationCard {
	id: string;
	name: string;
	avatar: string;
	message: string;
	date: string;
}

const ConversationCard = () => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);

	const conversationCards: IConversationCard[] = [
		{
			id: '1',
			name: 'John Doe',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543445_13.jpg',
			message: 'Hey, are we still on for the meeting tomorrow?',
			date: '10m'
		},
		{
			id: '2',
			name: 'Jane Smith',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543446_31.webp',
			message: "Don't forget to check out the new project updates!",
			date: '1h'
		},
		{
			id: '3',
			name: 'Alice Johnson',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543445_4.webp',
			message: 'Can you send me the files from last week?',
			date: '8h'
		},
		{
			id: '4',
			name: 'Bob Brown',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543447_22.png',
			message: "Let's grab lunch sometime next week.",
			date: '14h'
		}
	];

	const renderConversationCard = (item: IConversationCard) => (
		<View key={item.id} style={styles.conversationCard}>
			<View style={styles.avatarContainer}>
				<Image source={{ uri: item.avatar }} style={styles.avatar} resizeMode="cover" />
				<View style={styles.onlineIndicator} />
			</View>

			<View style={styles.conversationContent}>
				<View style={styles.conversationHeader}>
					<Text style={styles.userName} numberOfLines={1}>
						{item.name}
					</Text>
					<Text style={styles.timestamp}>{item.date}</Text>
				</View>

				<Text style={styles.lastMessage} numberOfLines={2}>
					{item.message}
				</Text>
			</View>
		</View>
	);

	return (
		<View style={styles.containerConversation}>
			<LinearGradient
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 0 }}
				colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
				style={[StyleSheet.absoluteFillObject]}
			/>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Messages</Text>
			</View>

			<View style={styles.conversationsList}>{conversationCards.map((item) => renderConversationCard(item))}</View>
		</View>
	);
};

export default ConversationCard;
