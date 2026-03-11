import asyncHandler from '../../shared/service/asyncHandler.js'
import { registerUser, loginUser } from './auth.service.js'

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: 'Email, password and name are required' })
  }

  const result = await registerUser({ email, password, name })
  return res.status(201).json(result)
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }
  const result = await loginUser({ email, password })
  return res.status(200).json(result)
})

export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ error: 'Google token required' })
    }

    const payload = await verifyGoogleToken(idToken)

    const { sub: googleId, email, name, email_verified } = payload

    if (!email_verified) {
      return res.status(400).json({ error: 'Google email not verified' })
    }

    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (user) {
      if (user.provider !== 'google') {
        return res.status(400).json({
          error: 'Account exists. Login with email and password',
        })
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name.replace(/\s+/g, '').toLowerCase(),
          googleId,
          provider: 'google',
        },
      })
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      id: user.id,
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    })

    return res.status(200).json({
      message: 'Google authentication successful',
      accessToken,
    })
  } catch (err) {
    return res.status(500).json({ error: 'Google authentication failed' })
  }
}

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken)
      return res.status(401).json({ error: 'Refresh token missing' })

    const tokenExists = await prisma.user.findUnique({
      where: { refreshToken },
    })
    if (!tokenExists)
      return res.status(403).json({ error: 'Invalid refresh token' })

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid refresh token' })

      const newAccessToken = generateAccessToken(user)
      res.json({ accessToken: newAccessToken })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken)
      return res.status(400).json({ error: 'Refresh token missing' })
    await prisma.user.update({
      where: { refreshToken },
      data: { refreshToken: null },
    })
    res.clearCookie('refreshToken')
    return res.status(200).json({ message: 'Logout successful' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
