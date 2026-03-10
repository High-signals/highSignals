import jwt from 'jsonwebtoken'

import prisma from '../config/db.js'

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ error: 'Access token missing' })
  }
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })
    if (!user) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' })
  }
}
