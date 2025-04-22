require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.use(cors());
app.use(bodyParser.json());

// SMS Endpoint
app.post("/send-sms", async (req, res) => {
  try {
    const sms = await client.messages.create({
      body: req.body.message,
      from: process.env.TWILIO_NUMBER,
      to: req.body.to
    });
    res.status(200).json({ success: true, sid: sms.sid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conference Call Endpoint
app.post("/start-conference", async (req, res) => {
  try {
    const { numbers, userNumber } = req.body;
    const twilioNumber = process.env.TWILIO_NUMBER;
    const twimlUrl = "https://handler.twilio.com/twiml/EH96aeff33652b8b2fdd56abccfdb6e727";

    // Call emergency contacts
    const contactCalls = await Promise.all(
      numbers.map(number => 
        client.calls.create({
          url: twimlUrl,
          to: number,
          from: twilioNumber
        })
      )
    );

    // Call user's phone
    const userCall = await client.calls.create({
      url: twimlUrl,
      to: userNumber,
      from: twilioNumber
    });

    // Call Twilio number to join conference
    const twilioCall = await client.calls.create({
      url: twimlUrl,
      to: twilioNumber, // Twilio calls itself
      from: twilioNumber
    });

    res.status(200).json({
      success: true,
      calls: {
        contacts: contactCalls.map(c => c.sid),
        user: userCall.sid,
        twilio: twilioCall.sid
      }
    });

  } catch (error) {
    console.error("Conference error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
