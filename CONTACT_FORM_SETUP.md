# Email Contact Form Setup Guide

To enable direct email sending from your contact form, you need to set up EmailJS (free service).

## Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account
3. Verify your email address

## Step 2: Create Email Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended)
4. Connect your Gmail account (hetland.th@gmail.com)
5. Note down the **Service ID** (something like "service_xxxxxxx")

## Step 3: Create Email Template
1. Go to "Email Templates" in dashboard
2. Click "Create New Template"
3. Use this template content:

**Subject:** New Contact Form Message: {{subject}}

**Body:**
```
You have received a new message from your website contact form:

Name: {{from_name}}
Email: {{reply_to}}
Subject: {{subject}}

Message:
{{message}}

---
Sent from your website contact form
```

4. Save the template and note down the **Template ID** (something like "template_xxxxxxx")

## Step 4: Get Public Key
1. Go to "Account" in EmailJS dashboard
2. Find your **Public Key** (something like "xxxxxxxxxx")

## Step 5: Update the Contact Form
Open the contact-me/index.html file and replace these placeholders:

1. Line with `emailjs.init("YOUR_PUBLIC_KEY");` 
   Replace `YOUR_PUBLIC_KEY` with your actual public key

2. Line with `emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)`
   Replace:
   - `YOUR_SERVICE_ID` with your service ID
   - `YOUR_TEMPLATE_ID` with your template ID

## Example:
```javascript
// Initialize EmailJS
emailjs.init("abc123def456"); // Your public key

// Send email
emailjs.send('service_abc123', 'template_def456', templateParams)
```

## Step 6: Test the Form
1. Start your local server: `python -m http.server 8000`
2. Visit http://localhost:8000/contact-me
3. Fill out and submit the form
4. Check your email (hetland.th@gmail.com) for the message

## Free Tier Limits
- 200 emails per month
- 2 email services
- 2 email templates

This should be more than enough for a personal website contact form.

## Troubleshooting
- Make sure your Gmail account allows "Less secure app access" or use App Passwords
- Check browser console for any JavaScript errors
- Verify all IDs are correct (no typos)
- Test with a simple message first

That's it! Your contact form will now send emails directly to your inbox without opening the user's email client.