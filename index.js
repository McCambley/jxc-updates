// @ts-check
import { load } from "cheerio";
import OpenAI from "openai";
import express from "express";
import "dotenv/config";
import sqlite3 from "sqlite3";

const apiKey = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 3000;
const systemPrompt =
  "Translate the input into a concise, user-friendly text message for skiers. The message should include essential details such as trail conditions, grooming updates, special notes, and any relevant instructions or policies. Ensure the tone is clear, friendly, and professional. The message must not exceed 500 characters. Prioritize clarity and brevity. Sign off as SkiBot.";
const URL = "https://www.jacksonxc.org/trail-report";

const openai = new OpenAI({ apiKey });
const app = express();
const db = new sqlite3.Database("ski_reports.db");
const MINUTES = 1000 * 60;
const MAX_AGE_MINUTES = 5;

//  Initialize Database
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_summary TEXT NOT NULL,
    original_report TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP  
  )`);
});

function getLatestReport() {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT report_summary, original_report, created_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 1
      `,
      (err, row) => {
        if (err) reject(err);
        resolve(row);
      }
    );
  });
}

// Function to store new report
function storeReport(reportData) {
  const {
    message: { content },
    originalText,
  } = reportData;
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO reports (report_summary, original_report, prompt) VALUES (?, ?, ?)",
      [content, originalText, systemPrompt],
      function (err) {
        if (err) reject(err);
        resolve("ok");
      }
    );
  });
}

/**
 *
 * @param {string} text
 */
async function summarizeText(text) {
  const completion = await openai.chat.completions.create({
    // model: "gpt-4o",
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  const message = completion.choices[0].message;

  return message;
}

async function readTrailReport() {
  const response = await fetch(URL);
  const trailReport = await response.text();
  const $ = load(trailReport);

  const reportBody = $("section.av_textblock_section");
  const reportText = reportBody.text();
  const usableText = reportText.split("Season passes")[0];

  const message = await summarizeText(usableText);

  return {
    message,
    systemPrompt,
    originalText: usableText,
  };
}

// Function to check if we need to fetch new data
function isReportStale(timestamp) {
  if (!timestamp) return true;

  const then = new Date(timestamp + "Z");
  const reportTime = then.getTime();
  const now = new Date();
  const currentTime = now.getTime();
  // const hoursSinceReport = (currentTime - reportTime) / (1000 * 60 * 60);
  const minutesSinceReport = (currentTime - reportTime) / MINUTES;

  // Consider report stale if it's more than 1 hour old
  // return hoursSinceReport > 1;
  return minutesSinceReport > MAX_AGE_MINUTES;
}

app.get("/", async (req, res) => {
  db.run("DELETE from reports");
  res.status(200).send({ status: "ok" });
});

app.get("/ski-report", async (req, res) => {
  // Check for cached report
  const latestReport = await getLatestReport();

  // If there's a recent report, return it
  if (latestReport && !isReportStale(latestReport.created_at)) {
    console.log("Returning cached report");
    res.json({
      data: latestReport.report_summary,
      cached: true,
      timestamp: latestReport.created_at,
    });
  } else {
    // Otherwise, fetch new report
    const newReport = await readTrailReport();
    // Store new report
    await storeReport(newReport);
    // Return new report
    res.json({
      data: newReport.message.content,
      cached: false,
      timestamp: new Date(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
