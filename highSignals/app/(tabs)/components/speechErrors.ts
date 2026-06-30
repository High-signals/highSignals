// Maps expo-speech-recognition error codes to short, user-friendly messages.
// Shared by the dictation UI so the wording stays consistent.
export function speechErrorMessage(code: string): string {
	switch (code) {
		case 'not-allowed':
		case 'service-not-allowed':
			return 'Mic permission needed'
		case 'no-speech':
		case 'speech-timeout':
			return 'No speech heard'
		case 'language-not-supported':
			return 'Language unavailable'
		case 'network':
			return 'Network error — tap to retry'
		default:
			return 'Dictation unavailable'
	}
}
