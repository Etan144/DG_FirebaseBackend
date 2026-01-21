# Phone Verification Usage Guide

## Overview
The phone verification system allows users to verify their Singapore phone numbers in addition to email verification. The system only accepts Singapore phone numbers in the format `+65` followed by 8 digits starting with 6, 8, or 9.

## Available Cloud Functions

### 1. `sendPhoneVerificationCode`
Sends a 6-digit verification code to a Singapore phone number.

**Parameters:**
- `phoneNumber`: String - Singapore phone number in format `+65XXXXXXXX`

**Returns:**
```javascript
{
  success: true,
  message: "Verification code sent",
  code: "123456" // Only in development/emulator mode
}
```

**Example Usage:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendCode = httpsCallable(functions, 'sendPhoneVerificationCode');

async function requestVerificationCode(phoneNumber) {
  try {
    const result = await sendCode({ phoneNumber: phoneNumber });
    console.log(result.data.message);
    // In production, user receives SMS
    // In development, check console logs for the code
    return result.data;
  } catch (error) {
    console.error("Error sending code:", error.message);
    throw error;
  }
}

// Usage example
requestVerificationCode("+6591234567");
```

### 2. `verifyPhoneCode`
Verifies the code sent to the phone number.

**Parameters:**
- `code`: String - The 6-digit verification code

**Returns:**
```javascript
{
  success: true,
  message: "Phone number verified successfully",
  phoneNumber: "+6591234567"
}
```

**Features:**
- Code expires after 5 minutes
- Maximum 3 verification attempts
- Automatically updates user record with verified phone number

**Example Usage:**
```javascript
const verifyCode = httpsCallable(functions, 'verifyPhoneCode');

async function verifyPhoneNumber(code) {
  try {
    const result = await verifyCode({ code: code });
    console.log(result.data.message);
    console.log("Verified phone:", result.data.phoneNumber);
    return result.data;
  } catch (error) {
    console.error("Verification failed:", error.message);
    throw error;
  }
}

// Usage example
verifyPhoneNumber("123456");
```

### 3. `checkPhoneVerificationStatus`
Checks if the current user's phone number is verified.

**Parameters:**
None (uses authenticated user's context)

**Returns:**
```javascript
{
  phoneVerified: true,
  phoneNumber: "+6591234567"
}
```

**Example Usage:**
```javascript
const checkStatus = httpsCallable(functions, 'checkPhoneVerificationStatus');

async function checkPhoneStatus() {
  try {
    const result = await checkStatus();
    if (result.data.phoneVerified) {
      console.log("Phone verified:", result.data.phoneNumber);
    } else {
      console.log("Phone not verified");
    }
    return result.data;
  } catch (error) {
    console.error("Error checking status:", error.message);
    throw error;
  }
}

// Usage example
checkPhoneStatus();
```

## Complete Verification Flow Example

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

class PhoneVerification {
  constructor() {
    this.sendCode = httpsCallable(functions, 'sendPhoneVerificationCode');
    this.verifyCode = httpsCallable(functions, 'verifyPhoneCode');
    this.checkStatus = httpsCallable(functions, 'checkPhoneVerificationStatus');
  }

  // Step 1: Request verification code
  async requestCode(phoneNumber) {
    try {
      // Validate format on client side first
      if (!this.isValidSingaporeNumber(phoneNumber)) {
        throw new Error("Invalid Singapore phone number format");
      }

      const result = await this.sendCode({ phoneNumber });
      return {
        success: true,
        message: result.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Step 2: Verify the code
  async verify(code) {
    try {
      const result = await this.verifyCode({ code });
      return {
        success: true,
        message: result.data.message,
        phoneNumber: result.data.phoneNumber
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Check current status
  async getStatus() {
    try {
      const result = await this.checkStatus();
      return result.data;
    } catch (error) {
      return {
        phoneVerified: false,
        phoneNumber: null
      };
    }
  }

  // Client-side validation helper
  isValidSingaporeNumber(phoneNumber) {
    const regex = /^\+65[689]\d{7}$/;
    return regex.test(phoneNumber.replace(/\s/g, ''));
  }
}

// Usage in your app
const phoneVerification = new PhoneVerification();

// Example: Complete verification flow
async function setupPhoneVerification() {
  const phoneNumber = "+6591234567";
  
  // Step 1: Send code
  console.log("Sending verification code...");
  const sendResult = await phoneVerification.requestCode(phoneNumber);
  if (!sendResult.success) {
    console.error("Failed to send code:", sendResult.message);
    return;
  }
  
  console.log("Code sent! Check your SMS.");
  
  // Step 2: User enters code (simulated here)
  const userEnteredCode = "123456"; // Get this from user input
  
  console.log("Verifying code...");
  const verifyResult = await phoneVerification.verify(userEnteredCode);
  if (!verifyResult.success) {
    console.error("Verification failed:", verifyResult.message);
    return;
  }
  
  console.log("Success! Phone number verified:", verifyResult.phoneNumber);
  
  // Step 3: Check status
  const status = await phoneVerification.getStatus();
  console.log("Current status:", status);
}
```

## Error Handling

Common errors you may encounter:

| Error Code | Message | Solution |
|------------|---------|----------|
| `unauthenticated` | Login required | User must be logged in |
| `invalid-argument` | Invalid Singapore phone number | Check phone format: +65XXXXXXXX |
| `not-found` | No verification code found | Request a new code first |
| `already-exists` | Phone number already verified | No action needed |
| `deadline-exceeded` | Verification code expired | Request a new code |
| `resource-exhausted` | Too many failed attempts | Request a new code |
| `invalid-argument` | Invalid verification code | Check the code and try again |

## Database Collections

The phone verification system uses the following Firestore collections:

### `phone_verifications/{userId}`
Stores temporary verification data:
```javascript
{
  phoneNumber: "+6591234567",
  code: "123456",
  expiresAt: 1234567890000,
  createdAt: 1234567890000,
  verified: false,
  attempts: 0,
  verifiedAt: null // Set when verified
}
```

### `users/{userId}` 
Stores permanent verification status:
```javascript
{
  phoneNumber: "+6591234567",
  phoneVerified: true,
  phoneVerifiedAt: 1234567890000,
  // ... other user fields
}
```

## Security Rules

Make sure your Firestore security rules protect phone verification data:

```javascript
// Add to firestore.rules
match /phone_verifications/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## SMS Integration (Production)

The current implementation logs the verification code for testing. To integrate with an SMS provider like Twilio:

1. Install Twilio SDK: `npm install twilio`
2. Add Twilio credentials to Firebase config
3. Update the `sendPhoneVerificationCode` function in `auth.ts`

**Note:** For production use, you should integrate with an SMS service provider to actually send the codes via SMS.
