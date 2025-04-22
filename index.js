require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 3000;
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.use(cors());
app.use(bodyParser.json());

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

app.post("/start-conference", async (req, res) => {
  try {
    const { numbers, userNumber } = req.body;
    
    // Call emergency contacts
    const contactCalls = await Promise.all(numbers.map(number => 
      client.calls.create({
        url: "https://handler.twilio.com/twiml/EH4bb012a10ef489bc78579d2a44676e73",
        to: number,
        from: process.env.TWILIO_NUMBER
      })
    ));

    // Call app user's phone
    const userCall = await client.calls.create({
      url: "https://handler.twilio.com/twiml/EH4bb012a10ef489bc78579d2a44676e73",
      to: userNumber,
      from: process.env.TWILIO_NUMBER
    });

    res.json({ 
      success: true, 
      contactCalls: contactCalls.map(c => c.sid),
      userCall: userCall.sid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));