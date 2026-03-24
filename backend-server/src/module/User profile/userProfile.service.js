import AppError from './../../shared/service/appError.js'
import prisma from './../../config/db.js'

export async function getUserProfile(userId) {
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

  if (!userProfile) {
    throw new AppError('User profile not found', 404)
  }

  return userProfile
}

export async function updateUserProfile(userId, profileData) {
  const updatedProfile = await prisma.user.update({
    where: { id: userId },
    data: {
      name: profileData.name,
      avatar: profileData.avatar,
      bio: profileData.bio,
      twitterId: profileData.twitterId,
      facebookId: profileData.facebookId,
      linkedInId: profileData.linkedInId,
      tiktokId: profileData.tiktokId,
      instagramId: profileData.instagramId,
    },
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

  if (!updatedProfile) {
    throw new AppError('Failed to update user profile', 500)
  }

  return updatedProfile
}

export async function deleteUserProfile(userId) {
  await prisma.user.delete({
    where: { id: userId },
  })

  return { message: 'User profile deleted successfully' }
}
