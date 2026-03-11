import prisma from '../../config/db.js'
import bcrypt from 'bcrypt'
import { generateAccessToken } from '../../shared/service/generateToken.js'
import AppError from '../../shared/service/appError.js'

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

  const isMatch = await bcrypt.compare(data.password, user.password)

  if (!isMatch) {
    throw new AppError('Invalid credentials', 400)
  }

  const accessToken = await generateAccessToken({ id: user.id })

  return { message: 'Login successful', accessToken }
}
