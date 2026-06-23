"use server";

import { headers } from "next/headers";

interface RateLimitInfo {
  timestamps: number[];
}

const ipCache = new Map<string, RateLimitInfo>();

/**
 * Sends a message to a Telegram chat via Bot API.
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to be set in environment variables.
 * 
 * @param winner The name of the winning team to format in the notification
 * @returns Promise<boolean> indicating success
 */
export async function sendTelegramMessage(winner?: string): Promise<boolean> {
  // 1. Get Client IP from headers
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "unknown";

  const now = Date.now();
  const oneHourInMs = 60 * 60 * 1000;

  // 2. Sliding window Rate Limiting: 5 requests per hour
  const info = ipCache.get(ip) || { timestamps: [] };
  
  // Filter out timestamps older than 1 hour
  info.timestamps = info.timestamps.filter((ts) => now - ts <= oneHourInMs);

  if (info.timestamps.length >= 5) {
    console.warn(`Rate limit exceeded for IP: ${ip}. Request blocked.`);
    return false;
  }

  // Record this request timestamp
  info.timestamps.push(now);
  ipCache.set(ip, info);

  // Periodic pruning of the cache to prevent memory growth
  if (ipCache.size > 1000) {
    for (const [key, value] of ipCache.entries()) {
      const validTimestamps = value.timestamps.filter((ts) => now - ts <= oneHourInMs);
      if (validTimestamps.length === 0) {
        ipCache.delete(key);
      } else {
        ipCache.set(key, { timestamps: validTimestamps });
      }
    }
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram environment variables (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID) are missing.");
    return false;
  }

  const text = `☕ <b>[World Cup 2026]</b> Một người dùng vừa click vào link ủng hộ tác giả!\n\n🏆 Trận thắng gần đây: <b>${winner || "Mặc định"}</b>`;

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Telegram API error (${response.status}):`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error dispatching Telegram message:", error);
    return false;
  }
}
