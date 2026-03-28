import prisma from '../../config/db.js'
import bcrypt from 'bcrypt'
import { generateAccessToken } from '../../shared/service/generateToken.js'
import AppError from '../../shared/service/appError.js'
import { verifyGoogleToken } from './../../shared/service/GoogleAuth.js'

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
      provider: ['local'],
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
