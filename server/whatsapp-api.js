// Server-side WhatsApp API endpoint
// This should be deployed as a separate API service or serverless function

const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(cors());

// WhatsApp message sending endpoint
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { accountSid, authToken, to, from, body, contentSid, contentVariables } = req.body;

    // Validate required fields
    if (!accountSid || !authToken || !to || !from) {
      return res.status(400).json({
        error: 'Missing required fields: accountSid, authToken, to, from'
      });
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Prepare message options
    const messageOptions = {
      from: from,
      to: to
    };

    // Add content based on what's provided
    if (contentSid) {
      messageOptions.contentSid = contentSid;
      if (contentVariables) {
        messageOptions.contentVariables = contentVariables;
      }
    } else if (body) {
      messageOptions.body = body;
    } else {
      return res.status(400).json({
        error: 'Either body or contentSid must be provided'
      });
    }

    // Send message via Twilio
    const message = await client.messages.create(messageOptions);

    // Return success response
    res.json({
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      accountSid: message.accountSid,
      dateCreated: message.dateCreated,
      direction: message.direction,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    });

  } catch (error) {
    console.error('Twilio WhatsApp Error:', error);
    
    // Return error response
    res.status(500).json({
      error: error.message || 'Failed to send WhatsApp message',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-api' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`WhatsApp API server running on port ${PORT}`);
});

module.exports = app;
