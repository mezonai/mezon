import { useTheme } from '@mezon/mobile-ui';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { styles as createStyles } from './styles';

const LuckyMoney: React.FC = () => {
	const { themeValue } = useTheme();
	const styles = createStyles(themeValue);
	const navigation = useNavigation();

	const [amount, setAmount] = useState('10000000');
	const [envelopeCount, setEnvelopeCount] = useState('20');
	const [message, setMessage] = useState('Chúc mừng năm mới');
	const [isRandomDistribution, setIsRandomDistribution] = useState(true);

	const handleBack = () => {
		navigation.goBack();
	};

	const handleSend = () => {
		if (!amount || parseFloat(amount) <= 0) {
			Alert.alert('Error', 'Please enter a valid amount');
			return;
		}

		if (!envelopeCount || parseInt(envelopeCount) <= 0) {
			Alert.alert('Error', 'Please enter a valid number of envelopes');
			return;
		}

		// TODO: Implement send lucky money logic
		Alert.alert('Success', 'Lucky money sent successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
	};

	const handleViewHistory = () => {
		// @ts-expect-error - Navigation type issue
		navigation.navigate(APP_SCREEN.LUCKY_MONEY_HISTORY, {
			totalAmount: `${formatAmount(amount)}đ`,
			senderName: 'You',
			message
		});
	};

	const formatAmount = (text: string) => {
		// Remove non-numeric characters
		const numeric = text.replace(/[^0-9]/g, '');
		// Format with thousand separators
		return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={handleBack} style={styles.backButton}>
					<Icon name="arrow-left" size={24} color="white" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Gửi lì xì nhóm</Text>
			</View>

			<ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
				{/* Red Envelope Container */}
				<View style={styles.envelopeContainer}>
					{/* Icon Container */}
					<View style={styles.iconCircle}>
						<Icon name="account-group" size={32} color="#C62828" />
					</View>

					{/* Distribution Type Toggle */}
					<View style={styles.distributionToggle}>
						<TouchableOpacity
							style={[styles.toggleButton, isRandomDistribution && styles.toggleButtonActive]}
							onPress={() => setIsRandomDistribution(true)}
						>
							<Icon
								name={isRandomDistribution ? 'check-circle' : 'circle-outline'}
								size={20}
								color={isRandomDistribution ? '#FDD835' : 'white'}
							/>
							<Text style={styles.toggleText}>Chia may mắn</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.toggleButton, !isRandomDistribution && styles.toggleButtonActive]}
							onPress={() => setIsRandomDistribution(false)}
						>
							<Icon
								name={!isRandomDistribution ? 'check-circle' : 'circle-outline'}
								size={20}
								color={!isRandomDistribution ? '#FDD835' : 'white'}
							/>
							<Text style={styles.toggleText}>Chia đều</Text>
						</TouchableOpacity>
					</View>

					{/* Input Form */}
					<View style={styles.formContainer}>
						{/* Amount Input */}
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>Số tiền</Text>
							<View style={styles.inputWrapper}>
								<TextInput
									style={styles.input}
									value={formatAmount(amount)}
									onChangeText={(text) => setAmount(text.replace(/\./g, ''))}
									keyboardType="numeric"
									placeholder="0"
									placeholderTextColor="#999"
								/>
								<Text style={styles.currency}>đ</Text>
								{amount && (
									<TouchableOpacity onPress={() => setAmount('')} style={styles.clearButton}>
										<Icon name="close-circle" size={20} color="#999" />
									</TouchableOpacity>
								)}
							</View>
						</View>

						{/* Envelope Count Input */}
						<View style={styles.inputGroup}>
							<Text style={styles.inputLabel}>Số bao</Text>
							<View style={styles.inputWrapper}>
								<TextInput
									style={styles.input}
									value={envelopeCount}
									onChangeText={setEnvelopeCount}
									keyboardType="numeric"
									placeholder="0"
									placeholderTextColor="#999"
								/>
								{envelopeCount && (
									<TouchableOpacity onPress={() => setEnvelopeCount('')} style={styles.clearButton}>
										<Icon name="close-circle" size={20} color="#999" />
									</TouchableOpacity>
								)}
							</View>
						</View>

						{/* Message Input */}
						<View style={styles.messageContainer}>
							<Icon name="card-text-outline" size={20} color="#999" />
							<TextInput
								style={styles.messageInput}
								value={message}
								onChangeText={setMessage}
								placeholder="Enter your message"
								placeholderTextColor="#999"
							/>
						</View>
					</View>

					{/* Send Button */}
					<TouchableOpacity style={styles.sendButton} onPress={handleSend}>
						<Text style={styles.sendButtonText}>Gửi lì xì</Text>
					</TouchableOpacity>
				</View>

				{/* View History Link */}
				<TouchableOpacity style={styles.historyLink} onPress={handleViewHistory}>
					<Text style={styles.historyLinkText}>Xem lịch sử</Text>
				</TouchableOpacity>

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</View>
	);
};

export default LuckyMoney;
