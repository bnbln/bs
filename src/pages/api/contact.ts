import type { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'

type Data = {
    message: string
}

const contactRecipient = process.env.CONTACT_EMAIL || 'benediktschnupp@me.com'
const resendFrom = process.env.RESEND_FROM || 'Portfolio Contact <onboarding@resend.dev>'
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : ''
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    const privacy = req.body?.privacy === true

    if (!name || !email || !message || !privacy) {
        return res.status(400).json({ message: 'Missing required fields' })
    }

    if (!resend) {
        console.error('RESEND_API_KEY is missing.')
        return res.status(500).json({ message: 'Email service is not configured' })
    }

    try {
        const { error } = await resend.emails.send({
            from: resendFrom,
            to: [contactRecipient],
            replyTo: email,
            subject: `New Contact Request from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
        <h3>New Contact Request</h3>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      `,
        })

        if (error) {
            console.error('Resend email error:', error)
            return res.status(500).json({ message: 'Error sending email' })
        }

        res.status(200).json({ message: 'Message sent successfully' })
    } catch (error) {
        console.error('Error sending email:', error)
        res.status(500).json({ message: 'Error sending email' })
    }
}
