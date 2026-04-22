import prisma from '../../config/db.js'
import bcrypt from 'bcrypt'
import { randomInt } from 'crypto'
import { generateAccessToken } from '../../shared/service/generateToken.js'
import AppError from '../../shared/service/appError.js'
import { verifyGoogleToken } from './../../shared/service/GoogleAuth.js'
import { sendVerificationEmail } from '../../shared/service/sendVerificationEmail.js'

const OTP_EXPIRY_MINUTES = 10

const normalizeEmail = (email) => email.trim().toLowerCase()

const generateOtpCode = () => randomInt(100000, 1000000).toString()

export async function registerUser(data) {
	const existingUser = await prisma.user.findUnique({
		where: { email: data.email },
	})

	if (existingUser) {
		throw new AppError('User already exists')
	}

	if (data.password.length < 8) {
		throw new AppError('Password must be at least 8 characters long', 400)
	}

	const hashedPassword = await bcrypt.hash(data.password, 10)

	const user = await prisma.user.create({
		data: {
			email: data.email,
			password: hashedPassword,
			name: data.name,
			provider: ['LOCAL'],
		},
	})

	const accessToken = await generateAccessToken({ id: user.id })

	return { message: 'User registered successfully', accessToken }
}

export async function loginUser(data) {
	const user = await prisma.user.findUnique({
		where: { email: data.email },
	})

	if (!user) {
		throw new AppError('Invalid credentials', 400)
	}

	if (!user.password && !user.provider.includes('LOCAL')) {
		throw new AppError(
			'User registered with Google. Please login with Google',
			400,
		)
	}

	const isMatch = await bcrypt.compare(data.password, user.password)

	if (!isMatch) {
		throw new AppError('Invalid credentials', 400)
	}

	const accessToken = await generateAccessToken({ id: user.id })

	return { message: 'Login successful', accessToken }
}

export async function googleAuth(data) {
	const { idToken } = data

	if (!idToken) {
		throw new AppError('Google token required', 400)
	}

	const payload = await verifyGoogleToken(idToken)

	const { sub: googleId, email, name, email_verified } = payload

	if (!email_verified) {
		throw new AppError('Google email not verified', 400)
	}

	let user = await prisma.user.findUnique({
		where: { email },
	})

	// USER EXISTS
	if (user) {
		if (!user.provider.includes(PROVIDER.GOOGLE)) {
			user = await prisma.user.update({
				where: { id: user.id },
				data: {
					provider: {
						push: PROVIDER.GOOGLE,
					},
					googleId,
				},
			})
		}
	} else {
		user = await prisma.user.create({
			data: {
				email,
				name: name.replace(/\s+/g, '').toLowerCase(),
				googleId,
				provider: [PROVIDER.GOOGLE],
			},
		})
	}

	const accessToken = await generateAccessToken({
		id: user.id,
	})

	return {
		message: 'Google authentication successful',
		accessToken,
	}
}

export async function forgotPassword(data) {
	const email = normalizeEmail(data.email || '')

	if (!email) {
		throw new AppError('Email is required', 400)
	}

	const user = await prisma.user.findUnique({
		where: { email },
	})

	if (!user) {
		throw new AppError('User does not exist please register', 404)
	}

	const otpCode = generateOtpCode()
	const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

	await prisma.otp.upsert({
		where: { userId: user.id },
		update: {
			code: otpCode,
			expiresAt,
		},
		create: {
			userId: user.id,
			code: otpCode,
			expiresAt,
		},
	})

	const emailResult = await sendVerificationEmail(email, otpCode)

	if (!emailResult.success) {
		throw new AppError(
			emailResult.error || 'Failed to send password reset code',
			500,
		)
	}

	return {
		message:
			'If the email exists, a password reset code will be sent shortly.',
	}
}

export async function resetPassword(data) {
	const email = normalizeEmail(data.email || '')
	const otpCode = data.resetToken.trim()
	const newPassword = data.newPassword
	const confirmPassword = data.confirmPassword

	if (!otpCode) {
		throw new AppError('Reset code is required', 400)
	}

	if (!newPassword || !confirmPassword) {
		throw new AppError('Password and confirm password are required', 400)
	}

	if (newPassword !== confirmPassword) {
		throw new AppError('Passwords do not match', 400)
	}

	if (newPassword.length < 8) {
		throw new AppError('Password must be at least 8 characters long', 400)
	}

	let otpRecord = null
	let user = null

	if (email) {
		user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			throw new AppError('Invalid reset code', 400)
		}

		otpRecord = await prisma.otp.findUnique({
			where: { userId: user.id },
		})
	} else {
		otpRecord = await prisma.otp.findFirst({
			where: { code: otpCode },
			include: {
				user: true,
			},
		})

		user = otpRecord?.user || null
	}

	if (!otpRecord || !user) {
		throw new AppError('Invalid reset code', 400)
	}

	if (otpRecord.code !== otpCode) {
		throw new AppError('Invalid reset code', 400)
	}

	if (otpRecord.expiresAt < new Date()) {
		await prisma.otp.deleteMany({
			where: { userId: user.id },
		})

		throw new AppError('Reset code has expired', 400)
	}

	const hashedPassword = await bcrypt.hash(newPassword, 10)

	await prisma.$transaction([
		prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		}),
		prisma.otp.deleteMany({
			where: { userId: user.id },
		}),
	])

	return {
		message: 'Password has been reset successfully',
	}
}
