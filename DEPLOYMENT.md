# Deployment Guide

## Environment Variables Required

Make sure to set these environment variables in your deployment platform (Vercel, Netlify, etc.):

### Required for Document Management
- `NEXT_PUBLIC_ADMIN_PASSWORD` - Admin password for uploading documents
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - MongoDB database name (e.g., `document_manager`)

### Required for Cloudinary (File Storage)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

### Required for Contact Form
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail **App Password** (NOT your regular Gmail password)

## Setting Up Gmail for Contact Form

### Important: Use Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Create an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Generate password
   - Copy the 16-character password (without spaces)
   - Use this as your `EMAIL_PASS` environment variable

3. **Set Environment Variables**:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Common Issues After Deployment

1. **"Email service not configured"**
   - ✅ Ensure `EMAIL_USER` and `EMAIL_PASS` are set in your deployment platform
   - ✅ Verify the variable names are exact (case-sensitive)

2. **"Email authentication failed"**
   - ✅ You must use an **App Password**, not your regular Gmail password
   - ✅ Remove any spaces from the App Password
   - ✅ Ensure 2FA is enabled on your Gmail account

3. **"Unable to connect to email service"**
   - ✅ Check if your deployment platform allows outbound SMTP connections
   - ✅ Some platforms block port 587/465 - check their documentation

## Testing the Contact Form

After deployment:
1. Open your deployed site
2. Scroll to the contact form
3. Fill in the form and submit
4. Check your browser console for any error messages
5. Check your email inbox for the confirmation email

## Vercel Deployment

In Vercel:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all the variables listed above
4. Redeploy your application

## Alternative: Use a Contact Form Service

If Gmail is causing issues, consider using:
- **Resend** (https://resend.com/) - Free tier available
- **SendGrid** (https://sendgrid.com/) - Free tier: 100 emails/day
- **Mailgun** (https://www.mailgun.com/) - Free tier available

These services are more reliable for production environments.
