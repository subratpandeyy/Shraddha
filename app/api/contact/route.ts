import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 })
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9f9f9;">
          <h2>📩 New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <div style="margin-top: 12px; padding: 12px; background: #fff; border-left: 4px solid #4CAF50;">
            ${message}
          </div>
        </div>
      `,
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "📩 We received your message",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #4CAF50;">Thank you for contacting us, ${name}!</h2>
          <p style="font-size: 14px; color: #555;">
            We’ve received your message and our team will get you your resource asap.
          </p>
          <p style="font-size: 14px; color: #555;">
            <strong>Your message:</strong>
          </p>
          <blockquote style="margin: 12px 0; padding: 12px; background: #fff; border-left: 4px solid #4CAF50; color: #333;">
            ${message}
          </blockquote>
          <p style="font-size: 12px; color: #888; margin-top: 24px;">
            — Your Well Wishers
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}
