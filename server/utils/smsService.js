const twilio = require('twilio');

/**
 * Sends an SMS via Twilio
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - SMS message content
 */
const sendSMS = async (to, body) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    // Validation for Twilio SID format
    const isValidSid = accountSid && accountSid.startsWith('AC');

    if (!isValidSid || accountSid === 'your_account_sid') {
      console.log(`[TWILIO-LOG] To: ${to} | Body: ${body}`);
      console.log(`[TWILIO-LOG] Info: Configure valid Twilio credentials (starting with 'AC') in .env to send real SMS.`);
      return { success: true, sid: 'mock_sid' };
    }

    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: body,
      from: twilioNumber,
      to: to
    });

    console.log(`[TWILIO-SUCCESS] SMS sent to ${to}. Message SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error(`[TWILIO-ERROR] Failed to send SMS to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendSMS;
