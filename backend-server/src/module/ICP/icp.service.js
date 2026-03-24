import AppError from './../../shared/service/appError.js'
import prisma from '../../config/db.js'

export async function createICPService(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AppError('User not found', 404)
  }

  const {
    profession,
    dreamClient,
    mainProblem,
    dreamOutcome,
    authorityStory,
    clientDemographics,
    otherDetails,
  } = data

  const newICP = await prisma.ICP.create({
    data: {
      profession,
      dreamClient,
      mainProblem,
      dreamOutcome,
      authorityStory,
      clientDemographics,
      otherDetails,
      user: { connect: { id: userId } },
    },
  })

  return newICP
}
