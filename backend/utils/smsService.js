// Using Twilio as example - replace with your SMS provider
const twilio = require("twilio");

// Option 1: Using Twilio
const sendSMSWithTwilio = async (phoneNumber, message) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

    await client.messages.create({
      body: message,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    console.log(`SMS sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("Twilio SMS failed:", error);
    return false;
  }
};

// Option 2: Using a generic HTTP API (like Vonage, MessageBird, etc.)
const sendSMSWithHTTP = async (phoneNumber, message) => {
  try {
    const response = await axios.post(
      process.env.SMS_API_URL,
      {
        to: phoneNumber,
        message: message,
        apiKey: process.env.SMS_API_KEY,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    console.log(`SMS sent to ${phoneNumber}`);
    return response.data.success;
  } catch (error) {
    console.error("HTTP SMS failed:", error);
    return false;
  }
};

// Main SMS function - choose your provider
const sendSMS = async (phoneNumber, message) => {
  // Format phone number (ensure it has country code)
  let formattedPhone = phoneNumber;
  if (!phoneNumber.startsWith("+")) {
    formattedPhone = `+94${phoneNumber}`; // Sri Lanka country code
  }

  // Use your preferred SMS provider
  // return await sendSMSWithTwilio(formattedPhone, message);
  return await sendSMSWithHTTP(formattedPhone, message);
};

module.exports = { sendSMS };
