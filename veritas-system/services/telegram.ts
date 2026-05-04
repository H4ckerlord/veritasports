/**
 * Telegram notification service.
 * Uses the Bot API via plain fetch – no extra dependency.
 */

const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID ?? '';

async function sendMessage(chatId: string, text: string): Promise<void> {
  if (!process.env.TELEGRAM_BOT_TOKEN || !chatId) return;

  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    if (!res.ok) {
      // Silent – we never log user data
    }
  } catch {
    // Silent failure – Telegram is non-critical
  }
}

export const telegram = {
  /** Notify admin that markets were scheduled from a CSV upload */
  scheduledMarkets(count: number, publishTime: string) {
    return sendMessage(
      ADMIN_CHAT_ID,
      `📅 Scheduled *${count}* market(s) for *${publishTime}*`
    );
  },

  /** Notify admin that a market was successfully created on Azuro */
  marketCreated(question: string, azuroId: string) {
    return sendMessage(
      ADMIN_CHAT_ID,
      `✅ Market created: _${question}_\nID: \`${azuroId}\``
    );
  },

  /** Notify admin of a market creation failure */
  marketFailed(question: string, error: string) {
    return sendMessage(
      ADMIN_CHAT_ID,
      `❌ Failed to create market: _${question}_\nError: ${error}`
    );
  },

  /** Forward anonymous user feedback */
  feedback(wallet: string | null, message: string) {
    const from = wallet ? `\`${wallet}\`` : 'Anonymous';
    return sendMessage(
      ADMIN_CHAT_ID,
      `📢 Feedback from ${from}:\n${message}`
    );
  },
};
