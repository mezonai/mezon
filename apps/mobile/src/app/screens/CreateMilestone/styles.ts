import { Attributes, baseColor, size } from '@mezon/mobile-ui';
import { StyleSheet } from 'react-native';

export const styles = (theme: Attributes) =>
	StyleSheet.create({
		container: {
			flex: 1
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: size.s_12,
			paddingBottom: size.s_6
		},
		closeButton: {
			padding: size.s_4
		},
		headerTitle: {
			fontSize: size.s_20,
			fontWeight: '700',
			color: theme.text,
			flex: 1,
			textAlign: 'center',
			marginHorizontal: size.s_16
		},
		cancelText: {
			fontSize: size.s_16,
			color: theme.text,
			fontWeight: '500'
		},
		scrollView: {
			flex: 1
		},
		formContainer: {
			padding: size.s_16
		},
		fieldContainer: {
			marginBottom: size.s_24
		},
		fieldLabelRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: size.s_8,
			marginBottom: size.s_10
		},
		fieldLabel: {
			fontSize: size.s_16,
			fontWeight: '600',
			color: theme.textStrong
		},
		requiredBadge: {
			fontSize: size.s_12,
			fontWeight: '600',
			color: '#EF4444',
			backgroundColor: 'rgba(239, 68, 68, 0.1)',
			paddingHorizontal: size.s_8,
			paddingVertical: size.s_2,
			borderRadius: size.s_4,
			overflow: 'hidden' as const
		},
		optionalBadge: {
			fontSize: size.s_12,
			fontWeight: '600',
			color: theme.textDisabled,
			backgroundColor: 'rgba(128, 128, 128, 0.1)',
			paddingHorizontal: size.s_8,
			paddingVertical: 2,
			borderRadius: size.s_4,
			overflow: 'hidden' as const
		},
		wrapperFieldHintRow: {
			flexDirection: 'row' as const,
			justifyContent: 'space-between',
			alignItems: 'center'
		},
		fieldHintRow: {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			gap: size.s_6,
			marginTop: size.s_6
		},
		fieldHintText: {
			fontSize: size.s_12,
			color: theme.textDisabled
		},
		input: {
			backgroundColor: theme.secondary,
			borderRadius: size.s_12,
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_14,
			fontSize: size.s_16,
			color: theme.text,
			borderWidth: 1,
			borderColor: theme.border
		},
		textArea: {
			minHeight: 120,
			paddingTop: size.s_14
		},
		charCount: {
			fontSize: size.s_12,
			color: theme.textDisabled,
			textAlign: 'right' as const,
			marginTop: size.s_4
		},
		dateInput: {
			backgroundColor: theme.secondary,
			borderRadius: size.s_12,
			paddingHorizontal: size.s_16,
			paddingVertical: size.s_14,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderWidth: 1,
			borderColor: theme.border
		},
		dateText: {
			fontSize: size.s_16,
			color: theme.text
		},
		placeholderText: {
			color: theme.textDisabled
		},
		uploadContainer: {
			backgroundColor: 'rgba(139, 92, 246, 0.05)',
			borderRadius: size.s_16,
			borderWidth: 2,
			borderColor: '#8B5CF6',
			borderStyle: 'dashed',
			padding: size.s_32,
			alignItems: 'center'
		},
		uploadIconContainer: {
			width: 80,
			height: 80,
			borderRadius: 40,
			backgroundColor: 'rgba(139, 92, 246, 0.1)',
			alignItems: 'center',
			justifyContent: 'center',
			marginBottom: size.s_16
		},
		uploadTitle: {
			fontSize: size.s_18,
			fontWeight: '700',
			color: theme.textStrong,
			marginBottom: size.s_6
		},
		uploadSubtitle: {
			fontSize: size.s_14,
			color: theme.text,
			opacity: 0.7,
			marginBottom: size.s_20
		},
		addMediaButton: {
			backgroundColor: '#8B5CF6',
			paddingHorizontal: size.s_32,
			paddingVertical: size.s_12,
			borderRadius: size.s_24
		},
		addMediaButtonText: {
			color: baseColor.white,
			fontSize: size.s_16,
			fontWeight: '600'
		},
		mediaGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: size.s_12,
			marginBottom: size.s_16
		},
		mediaItem: {
			width: 100,
			height: 100,
			borderRadius: size.s_12,
			position: 'relative'
		},
		mediaImage: {
			width: '100%',
			height: '100%'
		},
		mediaImageWrapper: {
			borderRadius: size.s_12,
			overflow: 'hidden'
		},
		removeMediaButton: {
			position: 'absolute',
			top: -8,
			right: -8,
			backgroundColor: '#DA373C',
			borderRadius: 12,
			width: 24,
			height: 24,
			alignItems: 'center',
			justifyContent: 'center'
		},
		uploadingOverlay: {
			...StyleSheet.absoluteFillObject,
			backgroundColor: 'rgba(0, 0, 0, 0.45)',
			alignItems: 'center' as const,
			justifyContent: 'center' as const,
			borderRadius: size.s_12
		},
		membersScroll: {
			marginHorizontal: -size.s_20
		},
		memberItem: {
			alignItems: 'center',
			marginHorizontal: size.s_10,
			marginLeft: size.s_20
		},
		memberAvatarContainer: {
			width: 70,
			height: 70,
			borderRadius: 35,
			borderWidth: 3,
			borderColor: 'transparent',
			padding: 2,
			marginBottom: size.s_8,
			position: 'relative'
		},
		memberAvatarSelected: {
			borderColor: '#8B5CF6'
		},
		memberAvatar: {
			width: '100%',
			height: '100%',
			borderRadius: 32
		},
		selectedBadge: {
			position: 'absolute',
			top: -2,
			right: -2,
			width: 24,
			height: 24,
			borderRadius: 12,
			backgroundColor: '#8B5CF6',
			alignItems: 'center',
			justifyContent: 'center',
			borderWidth: 2,
			borderColor: theme.primary
		},
		memberName: {
			fontSize: size.s_14,
			color: theme.text,
			fontWeight: '500'
		},
		memberNameSelected: {
			color: '#8B5CF6',
			fontWeight: '600'
		},
		bottomSpacer: {
			height: 40
		},
		footer: {
			padding: size.s_16,
			paddingBottom: 0,
			marginBottom: size.s_32
		},
		saveButton: {
			backgroundColor: '#8B5CF6',
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: size.s_14,
			borderRadius: size.s_28,
			gap: size.s_10,
			shadowColor: '#8B5CF6',
			shadowOffset: {
				width: 0,
				height: 4
			},
			shadowOpacity: 0.3,
			shadowRadius: 8,
			elevation: 8
		},
		saveButtonText: {
			color: baseColor.white,
			fontSize: size.s_16,
			fontWeight: '700'
		},
		modalOverlay: {
			flex: 1,
			justifyContent: 'flex-end',
			backgroundColor: 'rgba(0, 0, 0, 0.5)'
		},
		modalContent: {
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.secondary,
			borderTopLeftRadius: size.s_20,
			borderTopRightRadius: size.s_20,
			paddingBottom: size.s_30
		},
		modalHeader: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			width: '100%',
			padding: size.s_16,
			borderBottomWidth: 1,
			borderBottomColor: theme.border
		},
		modalButtonText: {
			fontSize: size.s_16,
			color: '#8B5CF6',
			fontWeight: '600'
		}
	});
