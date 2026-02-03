import { useTheme } from '@mezon/mobile-ui';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles as createStyles } from './styles';

interface RecipientItem {
	id: string;
	name: string;
	avatar: string;
	amount: string;
	timestamp: string;
	isLuckiest?: boolean;
}

interface RouteParams {
	envelopeId?: string;
	totalAmount?: string;
	senderName?: string;
	message?: string;
}

const LuckyMoneyHistory: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();
	const route = useRoute();
	const params = route.params as RouteParams;

	// Mock data
	const [envelopeData] = useState({
		senderName: params.senderName || 'Di',
		totalAmount: params.totalAmount || '50.000đ',
		receivedAmount: '431đ',
		openedCount: 5,
		totalCount: 50,
		message: params.message || 'Nhận cài nhặc quá lì xì. Nhớm cua ca nhẹm lấc gì mở bao',
		timeRemaining: '43 giây',
		qrCode: 'LUCKY_MONEY_12345'
	});

	const [recipients] = useState<RecipientItem[]>([
		{
			id: '1',
			name: 'Heo Sữa',
			avatar: 'https://picsum.photos/100/100',
			amount: '5.412đ',
			timestamp: '13:58 - 21/01'
		},
		{
			id: '2',
			name: 'Nhun Nhun',
			avatar: 'https://picsum.photos/100/101',
			amount: '17.218đ',
			timestamp: '13:58 - 21/01'
		},
		{
			id: '3',
			name: 'Võ Trần',
			avatar: 'https://picsum.photos/100/102',
			amount: '431đ',
			timestamp: '13:58 - 21/01'
		},
		{
			id: '4',
			name: 'Trần Gia Khang',
			avatar: 'https://picsum.photos/100/103',
			amount: '7.237đ',
			timestamp: '13:58 - 21/01'
		},
		{
			id: '5',
			name: 'Su',
			avatar: 'https://picsum.photos/100/104',
			amount: '19.702đ',
			timestamp: '13:56 - 21/01',
			isLuckiest: true
		}
	]);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleViewBalance = () => {
		// TODO: Navigate to wallet/balance screen
		console.log('View balance');
	};

	const handleSendBack = () => {
		// TODO: Navigate to send lucky money screen
		navigation.goBack();
	};

	return (
		<View style={styles.container}>
			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
			{/* Header with QR Code */}
			<View style={styles.header}>
				{/* QR Code Placeholder */}
				<View style={styles.qrContainer}>
					<View style={styles.qrPlaceholder}>
						<Icon name="qrcode" size={60} color="#333" />
					</View>
				</View>

					{/* Title and Amount */}
					<Text style={styles.headerTitle}>
						Nhận lì xì may mắn từ {envelopeData.senderName}
					</Text>
					<Text style={styles.receivedAmount}>{envelopeData.receivedAmount}</Text>
					<Text style={styles.totalAmount}>
						{envelopeData.openedCount} của {envelopeData.totalAmount}
					</Text>
				</View>

				{/* Content Card */}
				<View style={styles.contentCard}>
					{/* Message */}
					<View style={styles.messageContainer}>
						<Text style={styles.messageText}>{envelopeData.message}</Text>
						<Image
							source={{ uri: 'https://via.placeholder.com/40x20?text=Zalo' }}
							style={styles.brandLogo}
						/>
					</View>

					{/* Stats */}
					<View style={styles.statsContainer}>
						<Text style={styles.statsText}>
							{envelopeData.openedCount}/{envelopeData.totalCount} bao đã mở trong{' '}
							{envelopeData.timeRemaining}
						</Text>
						<Text style={styles.statsAmount}>{envelopeData.totalAmount}</Text>
					</View>

					{/* Recipients List */}
					<View style={styles.recipientsList}>
						{recipients.map((recipient) => (
							<View key={recipient.id} style={styles.recipientItem}>
								<Image
									source={{ uri: recipient.avatar }}
									style={styles.recipientAvatar}
								/>
								<View style={styles.recipientInfo}>
									<Text style={styles.recipientName}>{recipient.name}</Text>
									<Text style={styles.recipientTime}>{recipient.timestamp}</Text>
								</View>
								<View style={styles.recipientAmountContainer}>
									<Text style={styles.recipientAmount}>{recipient.amount}</Text>
									{recipient.isLuckiest && (
										<View style={styles.luckiestBadge}>
											<Icon name="crown" size={16} color="#FDD835" />
											<Text style={styles.luckiestText}>May mắn nhất</Text>
										</View>
									)}
								</View>
							</View>
						))}
					</View>
				</View>

				{/* Footer Text */}
				<Text style={styles.footerText}>
					Tiền đã chuyển vào ví của bạn, sử dụng để lì xì tiếp nhé!
				</Text>

				{/* Action Buttons */}
				<View style={styles.actionButtons}>
					<TouchableOpacity style={styles.balanceButton} onPress={handleViewBalance}>
						<Text style={styles.balanceButtonText}>Xem số dư</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.sendBackButton} onPress={handleSendBack}>
						<Text style={styles.sendBackButtonText}>Lì xì cho họ</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.bottomSpacer} />
			</ScrollView>

			{/* Close Button */}
			<TouchableOpacity style={styles.closeButton} onPress={handleBack}>
				<Icon name="close" size={24} color="white" />
			</TouchableOpacity>
		</View>
	);
};

export default LuckyMoneyHistory;
