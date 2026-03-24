import prisma from '../../config/db.js'
import asyncWrapper from '../../shared/service/asyncHandler.js'
import { createICPService } from './icp.service.js'

export const createICP = asyncWrapper(async (req, res) => {
  const { id } = req.user
  const {
    profession,
    dreamClient,
    mainProblem,
    dreamOutcome,
    authorityStory,
    clientDemographics,
    otherDetails,
  } = req.body

  if (
    !profession ||
    !dreamClient ||
    !mainProblem ||
    !dreamOutcome ||
    !authorityStory ||
    !clientDemographics
  ) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  const newICP = await createICPService(id, {
    profession,
    dreamClient,
    mainProblem,
    dreamOutcome,
    authorityStory,
    clientDemographics,
    otherDetails,
  })

  res.status(201).json(newICP)
})

export const editICP = async (req, res) => {
  try {
    const { id } = req.user
    const {
      profession,
      dreamClient,
      mainProblem,
      dreamOutcome,
      authorityStory,
    } = req.body

    const updatedICP = await prisma.ICP.update({
      where: { userId: id },
      data: {
        profession,
        dreamClient,
        mainProblem,
        dreamOutcome,
        authorityStory,
      },
    })

    res.status(200).json(updatedICP)
  } catch (error) {
    console.error('Error updating ICP:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export const getICP = async (req, res) => {
  try {
    const { id } = req.user
    const icp = await prisma.ICP.findUnique({
      where: { userId: id },
    })
    if (!icp) {
      return res.status(404).json({ message: 'ICP not found' })
    }
    res.status(200).json(icp)
  } catch (error) {
    console.error('Error fetching ICP:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
