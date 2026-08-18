import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface CustomAlertProps {
	visible: boolean
	title: string
	message: string
	onClose: () => void
	onConfirm?: () => void
	showCancel?: boolean
}

export default function CustomAlert({ visible, title, message, onClose, onConfirm, showCancel = false }: CustomAlertProps) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType='fade'
			onRequestClose={onClose}
		>
			<View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
				<View style={[styles.modalContent, { alignItems: 'center', width: '80%', paddingVertical: 28, borderRadius: 24, borderWidth: 1.5, borderColor: '#EADBCE' }]}>
					<Ionicons name="information-circle-outline" size={44} color="#1D4A79" style={{ marginBottom: 14 }} />
					<Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 8 }]}>{title}</Text>
					<Text style={{ color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
						{message}
					</Text>
					
					<View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
						{showCancel && (
							<TouchableOpacity
								style={[styles.cancelButton, { flex: 1 }]}
								onPress={onClose}
							>
								<Text style={styles.cancelText}>Cancel</Text>
							</TouchableOpacity>
						)}
						<TouchableOpacity
							style={[styles.confirmButton, { flex: 1 }]}
							onPress={onConfirm || onClose}
						>
							<Text style={styles.confirmText}>Okay</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
	},
	modalContent: {
		backgroundColor: '#FAF7F2',
		paddingHorizontal: 24,
	},
	modalTitle: {
		color: '#163354',
		fontSize: 18,
		fontWeight: '800',
	},
	confirmButton: {
		backgroundColor: '#1D4A79',
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
	},
	confirmText: {
		color: '#FFFFFF',
		fontWeight: '700',
		fontSize: 15,
	},
	cancelButton: {
		backgroundColor: '#F5EFE6',
		borderWidth: 1.5,
		borderColor: '#EADBCE',
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
	},
	cancelText: {
		color: '#163354',
		fontWeight: '700',
		fontSize: 15,
	}
})
