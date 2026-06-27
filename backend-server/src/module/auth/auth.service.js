import prisma from '../../config/db.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { generateAccessToken } from '../../shared/service/generateToken.js'
import AppError from '../../shared/service/appError.js'
import { verifyGoogleToken } from './../../shared/service/GoogleAuth.js'

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || null,
    bio: user.bio || null,
  }
}

export async function registerUser(data) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new AppError('User already exists')
  }

  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
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

  return {
    message: 'User registered successfully',
    accessToken,
    user: sanitizeUser(user),
  }
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

  return {
    message: 'Login successful',
    accessToken,
    user: sanitizeUser(user),
  }
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

  if (user) {
    if (!user.provider.includes('GOOGLE')) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: {
            push: 'GOOGLE',
          },
          googleId,
        },
      })
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: name,
        googleId,
        provider: ['GOOGLE'],
      },
    })
  }

  const accessToken = await generateAccessToken({
    id: user.id,
  })

  return {
    message: 'Google authentication successful',
    accessToken,
    user: sanitizeUser(user),
  }
}

export async function forgotPassword(data) {
  const { email } = data

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new AppError('No user found with this email', 404)
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: tokenExpiry,
    },
  })

  const resetUrl = `${process.env.FRONTEND_URL}/forgot-password/reset?token=${resetToken}`

  return {
    message: 'Password reset link sent to email',
    resetToken,
    resetUrl,
  }
}

export async function resetPassword(data) {
  const { resetToken, newPassword, confirmPassword } = data

  if (!resetToken || !newPassword || !confirmPassword) {
    throw new AppError('Reset token and new password are required', 400)
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400)
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400)
  }

  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  })

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  })

  return {
    message: 'Password reset successful',
  }
}
