import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { google } from "googleapis";

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = "YOUR_CLIENT_ID";
const CLIENT_SECRET = "YOUR_CLIENT_SECRET";
const REDIRECT_URI = "https://yourfrontend.com/callback.html";

// 1) Exchange code → Tokens
app.post("/oauth/exchange", async (req, res) => {
    const { code } = req.body;

    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);
    params.append("redirect_uri", REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    const result = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const data = await result.json();
    res.json(data);
});

// 2) Gmail — Telegram subject filter
app.post("/gmail/telegram", async (req, res) => {
    const { access_token } = req.body;

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });

    const gmail = google.gmail({ version: "v1", auth });

    const list = await gmail.users.messages.list({
        userId: "me",
        q: 'subject:"Telegram"',
        maxResults: 50
    });

    if (!list.data.messages) return res.json({ mails: [] });

    const mails = [];

    for (let msg of list.data.messages) {
        const detail = await gmail.users.messages.get({
            userId: "me",
            id: msg.id
        });

        const snippet = detail.data.snippet;
        const subject =
            detail.data.payload.headers.find(h => h.name === "Subject")?.value;

        mails.push({
            id: msg.id,
            subject,
            snippet
        });
    }

    res.json({ mails });
});

app.listen(3000, () => console.log("API server running"));
