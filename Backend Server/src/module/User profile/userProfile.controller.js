import prisma from '../config/db.js'

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        twitterId: true,
        facebookId: true,
        linkedInId: true,
        tiktokId: true,
        instagramId: true,
      },
    })
    res.json(userProfile)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
