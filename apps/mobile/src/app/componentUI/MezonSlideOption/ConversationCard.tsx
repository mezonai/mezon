import { useTheme } from '@mezon/mobile-ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation(['common']);

	const conversationCards: IConversationCard[] = [
		{
			id: '1',
			name: 'John Doe',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543445_13.jpg',
			message: t('cardConversationMessage.johnDoe'),
			date: '10m'
		},
		{
			id: '2',
			name: 'Jane Smith',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543446_31.webp',
			message: t('cardConversationMessage.janeSmith'),
			date: '1h'
		},
		{
			id: '3',
			name: 'Alice Johnson',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543445_4.webp',
			message: t('cardConversationMessage.aliceJohnson'),
			date: '8h'
		},
		{
			id: '4',
			name: 'Bob Brown',
			avatar: 'https://cdn.mezon.ai/0/1812749818716491776/1782991817428439000/1757087543447_22.png',
			message: t('cardConversationMessage.bobBrown'),
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
				style={[StyleSheet.absoluteFill]}
			/>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>{t('cardConversationMessage.title')}</Text>
			</View>

			<View style={styles.conversationsList}>{conversationCards.map((item) => renderConversationCard(item))}</View>
		</View>
	);
};

export default ConversationCard;
