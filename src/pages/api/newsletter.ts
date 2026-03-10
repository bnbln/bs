import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend, type CreateContactOptions, type ErrorResponse, type UpdateContactOptions } from 'resend'

type Data = {
    message: string
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const newsletterSegmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID?.trim()

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isAlreadySubscribedError = (error: ErrorResponse) => {
    if (error.statusCode === 409) {
        return true
    }

    const lowerMessage = error.message.toLowerCase()
    return lowerMessage.includes('already') && lowerMessage.includes('exist')
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' })
    }

    if (!resend) {
        console.error('RESEND_API_KEY is missing.')
        return res.status(500).json({ message: 'Email service is not configured' })
    }

    const createPayload: CreateContactOptions = {
        email,
        unsubscribed: false,
    }

    if (newsletterSegmentId) {
        createPayload.segments = [{ id: newsletterSegmentId }]
    }

    try {
        const { error: createError } = await resend.contacts.create(createPayload)

        if (!createError) {
            return res.status(200).json({ message: 'You are now subscribed.' })
        }

        if (!isAlreadySubscribedError(createError)) {
            console.error('Resend newsletter create error:', createError)
            return res.status(500).json({ message: 'Could not subscribe right now. Please try again later.' })
        }

        const updatePayload: UpdateContactOptions = {
            email,
            unsubscribed: false,
        }

        const { error: updateError } = await resend.contacts.update(updatePayload)
        if (updateError) {
            console.error('Resend newsletter update error:', updateError)
            return res.status(500).json({ message: 'Could not update subscription right now. Please try again later.' })
        }

        return res.status(200).json({ message: 'You are already subscribed.' })
    } catch (error) {
        console.error('Newsletter subscription error:', error)
        return res.status(500).json({ message: 'Could not subscribe right now. Please try again later.' })
    }
}
