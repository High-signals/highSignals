import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Google from 'expo-auth-session/providers/google'
import type { AuthSessionResult } from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'
let GoogleSignin: any = null
try {
	if (Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
		GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin
	}
} catch (e) {
	console.warn('Google Signin module load failed:', e)
}

WebBrowser.maybeCompleteAuthSession()

const FIREBASE_SIGN_IN_WITH_IDP_URL =
	'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp'
const GOOGLE_PROVIDER_ID = 'google.com'
const MISSING_CLIENT_ID = 'missing-google-client-id'
const FIREBASE_REQUEST_URI = 'http://localhost'
const TOKEN_WAIT_TIMEOUT_MS = 15000
const isWeb = Platform.OS === 'web'

type GoogleCredential = {
	key: 'id_token' | 'access_token'
	value: string
}

type PendingSignIn = {
	resolve: (firebaseIdToken: string | null) => void
	reject: (error: Error) => void
	timeoutId: ReturnType<typeof setTimeout> | null
}

type FirebaseTokenResponse = {
	idToken?: string
	error?: {
		message?: string
	}
}

const getEnvValue = (value?: string) => {
	const trimmed = value?.trim()
	return trimmed || undefined
}

const toError = (error: unknown) =>
	error instanceof Error ? error : new Error('Google sign-in failed')

const getGoogleClientSetupError = ({
	webClientId,
	iosClientId,
}: {
	webClientId?: string
	iosClientId?: string
}) => {
	if (!webClientId) {
		return 'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
	}

	if (Platform.OS === 'ios') {
		if (!iosClientId) {
			return 'Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
		}

		if (iosClientId === webClientId) {
			return 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be an iOS OAuth client ID, not the Web client ID'
		}
	}

	return null
}

const extractGoogleCredential = (
	result: AuthSessionResult,
): GoogleCredential | null => {
	if (result.type !== 'success') return null

	const idToken = result.params.id_token || result.authentication?.idToken
	if (idToken) {
		return {
			key: 'id_token',
			value: idToken,
		}
	}

	const accessToken =
		result.params.access_token || result.authentication?.accessToken
	if (accessToken) {
		return {
			key: 'access_token',
			value: accessToken,
		}
	}

	return null
}

const getGoogleAuthError = (result: AuthSessionResult) => {
	if (result.type === 'error') {
		return new Error(
			result.error?.message ||
				result.params.error_description ||
				result.params.error ||
				'Google sign-in failed',
		)
	}

	return new Error('Google sign-in did not complete')
}

const exchangeGoogleCredentialForFirebaseToken = async (
	firebaseApiKey: string,
	credential: GoogleCredential,
) => {
	const providerParams = new URLSearchParams({
		[credential.key]: credential.value,
		providerId: GOOGLE_PROVIDER_ID,
	})

	const response = await fetch(
		`${FIREBASE_SIGN_IN_WITH_IDP_URL}?key=${firebaseApiKey}`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				postBody: providerParams.toString(),
				requestUri: FIREBASE_REQUEST_URI,
				returnIdpCredential: true,
				returnSecureToken: true,
			}),
		},
	)

	const data = (await response.json()) as FirebaseTokenResponse

	if (!response.ok) {
		throw new Error(
			data.error?.message?.replace(/_/g, ' ') ||
				'Firebase Google sign-in failed',
		)
	}

	if (!data.idToken) {
		throw new Error('Firebase did not return an ID token')
	}

	return data.idToken
}

export function useFirebaseGoogleSignIn() {
	const [loading, setLoading] = useState(false)
	const pendingSignInRef = useRef<PendingSignIn | null>(null)

	const firebaseApiKey = getEnvValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY)
	const googleWebClientId = getEnvValue(
		process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
	)
	const googleIosClientId = getEnvValue(
		process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
	)

	const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
		{
			clientId: googleWebClientId || MISSING_CLIENT_ID,
			webClientId: googleWebClientId,
			iosClientId: Platform.OS === 'ios' ? googleIosClientId : undefined,
			selectAccount: true,
		},
		{
			path: 'oauthredirect',
		},
	)

	const clearPendingSignIn = useCallback(() => {
		const pendingSignIn = pendingSignInRef.current

		if (pendingSignIn?.timeoutId) {
			clearTimeout(pendingSignIn.timeoutId)
		}

		pendingSignInRef.current = null
		setLoading(false)
	}, [])

	const resolvePendingSignIn = useCallback(
		(firebaseIdToken: string | null) => {
			const pendingSignIn = pendingSignInRef.current
			if (!pendingSignIn) return

			clearPendingSignIn()
			pendingSignIn.resolve(firebaseIdToken)
		},
		[clearPendingSignIn],
	)

	const rejectPendingSignIn = useCallback(
		(error: unknown) => {
			const pendingSignIn = pendingSignInRef.current
			if (!pendingSignIn) return

			clearPendingSignIn()
			pendingSignIn.reject(toError(error))
		},
		[clearPendingSignIn],
	)

	const handleAuthResult = useCallback(
		async (result: AuthSessionResult) => {
			if (!pendingSignInRef.current) return true

			if (result.type === 'cancel' || result.type === 'dismiss') {
				resolvePendingSignIn(null)
				return true
			}

			if (result.type === 'error' || result.type === 'locked') {
				rejectPendingSignIn(getGoogleAuthError(result))
				return true
			}

			if (result.type !== 'success') return false

			const googleCredential = extractGoogleCredential(result)
			if (!googleCredential) return false

			try {
				if (!firebaseApiKey) {
					throw new Error('Missing EXPO_PUBLIC_FIREBASE_API_KEY')
				}

				const firebaseIdToken =
					await exchangeGoogleCredentialForFirebaseToken(
						firebaseApiKey,
						googleCredential,
					)
				resolvePendingSignIn(firebaseIdToken)
			} catch (error) {
				rejectPendingSignIn(error)
			}

			return true
		},
		[firebaseApiKey, rejectPendingSignIn, resolvePendingSignIn],
	)

	useEffect(() => {
		if (!response || !pendingSignInRef.current) return

		void handleAuthResult(response)
	}, [handleAuthResult, response])

	useEffect(() => {
		return () => {
			const pendingSignIn = pendingSignInRef.current

			if (pendingSignIn?.timeoutId) {
				clearTimeout(pendingSignIn.timeoutId)
			}

			pendingSignInRef.current = null
		}
	}, [])

	useEffect(() => {
		if (isWeb || !googleWebClientId || !GoogleSignin) return

		GoogleSignin.configure({
			webClientId: googleWebClientId,
			iosClientId: googleIosClientId,
		})
	}, [googleIosClientId, googleWebClientId])

	const signInWithGoogle = useCallback(async () => {
		if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
			throw new Error(
				'Google sign-in requires a development build or standalone app, not Expo Go.',
			)
		}

		if (!firebaseApiKey) {
			throw new Error('Missing EXPO_PUBLIC_FIREBASE_API_KEY')
		}

		const setupError = getGoogleClientSetupError({
			webClientId: googleWebClientId,
			iosClientId: googleIosClientId,
		})

		if (setupError) {
			throw new Error(setupError)
		}

		if (pendingSignInRef.current) {
			throw new Error('Google sign-in is already in progress')
		}

		setLoading(true)

		if (!isWeb) {
			try {
				if (Platform.OS === 'android') {
					await GoogleSignin.hasPlayServices({
						showPlayServicesUpdateDialog: true,
					})
				}

				GoogleSignin.configure({
					webClientId: googleWebClientId,
					iosClientId: googleIosClientId,
				})

				const result = await GoogleSignin.signIn()
				if (result.type === 'cancelled') {
					setLoading(false)
					return null
				}

				const idToken =
					result.data.idToken || (await GoogleSignin.getTokens()).idToken

				if (!idToken) {
					throw new Error('Google sign-in did not return an ID token')
				}

				const firebaseIdToken =
					await exchangeGoogleCredentialForFirebaseToken(firebaseApiKey, {
						key: 'id_token',
						value: idToken,
					})

				setLoading(false)
				return firebaseIdToken
			} catch (error) {
				setLoading(false)
				throw toError(error)
			}
		}

		if (!request) {
			setLoading(false)
			throw new Error('Google sign-in is still initializing')
		}

		return new Promise<string | null>((resolve, reject) => {
			pendingSignInRef.current = {
				resolve,
				reject,
				timeoutId: null,
			}

			const waitForToken = () => {
				if (!pendingSignInRef.current) return

				pendingSignInRef.current.timeoutId = setTimeout(() => {
					rejectPendingSignIn(
						new Error('Google sign-in did not return an ID token'),
					)
				}, TOKEN_WAIT_TIMEOUT_MS)
			}

			void promptAsync()
				.then(async (result) => {
					const handled = await handleAuthResult(result)

					if (!handled) {
						waitForToken()
					}
				})
				.catch((error) => {
					rejectPendingSignIn(error)
				})
		})
	}, [
		firebaseApiKey,
		googleIosClientId,
		googleWebClientId,
		handleAuthResult,
		promptAsync,
		rejectPendingSignIn,
		request,
	])

	return {
		loading,
		signInWithGoogle,
	}
}
