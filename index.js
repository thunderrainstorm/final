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
    
    // Create an array of all numbers to call (including the user's number)
    const allNumbers = [...numbers];
    if (userNumber && !numbers.includes(userNumber)) {
      allNumbers.push(userNumber);
    }
    
    // Call all numbers (emergency contacts and user) at once
    const calls = await Promise.all(allNumbers.map(number => 
      client.calls.create({
        url: "https://handler.twilio.com/twiml/EH96aeff33652b8b2fdd56abccfdb6e727",
        to: number,
        from: process.env.TWILIO_NUMBER
      })
    ));
    
    res.json({ 
      success: true, 
      calls: calls.map(c => c.sid)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
