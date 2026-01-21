# Firebase Phone Authentication Setup

## Step 1: Enable Phone Authentication in Firebase Console

1. Go to **Firebase Console** → https://console.firebase.google.com/project/fyp-deepfakeguard
2. Click **Authentication** in the left menu
3. Click on the **Sign-in method** tab
4. Find **Phone** in the list of providers
5. Click on **Phone**
6. Toggle **Enable** to ON
7. Click **Save**

## Step 2: Test the Registration Flow

1. Open your registration page
2. Fill in the form with:
   - Username
   - Email
   - Phone number (Singapore format: 8 digits)
   - Password
3. Click "Send Code"
   - Firebase will show an invisible reCAPTCHA (may ask you to verify you're human)
   - SMS will be sent to your phone automatically
4. Enter the 6-digit code from SMS
5. Click "Register"

## Important Notes

- **Free Tier**: 10,000 phone verifications per month
- **Quota**: Can check usage in Firebase Console → Usage and billing
- **Testing**: For testing without SMS, you can add test phone numbers in Firebase Console:
  - Go to Authentication → Sign-in method → Phone
  - Scroll down to "Phone numbers for testing"
  - Add test number and a code (e.g., +6591234567 with code 123456)

## What Changed

### Frontend (RegistrationPage.html):
- Now uses `signInWithPhoneNumber()` to send real SMS via Firebase
- Uses `RecaptchaVerifier` for spam protection
- Links phone credential to email/password account
- No longer uses custom backend functions for phone verification

### Backend Functions (Optional):
- The old custom functions (`sendPhoneVerificationCode`, `verifyPhoneCode`) are still there but not used
- They can be removed or kept as backup
- Phone verification is now handled entirely by Firebase Auth

## Troubleshooting

If SMS doesn't send:
1. Check that Phone auth is enabled in Firebase Console
2. Check browser console for errors
3. Try adding your number as a test number first
4. Make sure reCAPTCHA can load (not blocked by ad blockers)
