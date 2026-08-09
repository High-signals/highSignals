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
			<View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }]}>
				<View style={[styles.modalContent, { alignItems: 'center', width: '75%', paddingVertical: 32, borderRadius: 24 }]}>
					<Ionicons name="information-circle-outline" size={48} color="#d4af37" style={{ marginBottom: 16 }} />
					<Text style={[styles.modalTitle, { textAlign: 'center', marginBottom: 8 }]}>{title}</Text>
					<Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
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
		backgroundColor: '#112240',
		paddingHorizontal: 24,
	},
	modalTitle: {
		color: '#ffffff',
		fontSize: 18,
		fontWeight: '600',
	},
	confirmButton: {
		backgroundColor: '#d4af37',
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
	},
	confirmText: {
		color: '#000000',
		fontWeight: '600',
		fontSize: 16,
	},
	cancelButton: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.2)',
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
	},
	cancelText: {
		color: '#ffffff',
		fontWeight: '600',
		fontSize: 16,
	}
})
