import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import { verifyAdminToken } from '../../services/auth';
import { parseCsv } from '../../services/csvParser';
import { query } from '../../db/client';
import { telegram } from '../../services/telegram';

// Disable default body parser so formidable can handle multipart
export const config = { api: { bodyParser: false } };

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!verifyAdminToken(req)) {
    res.status(401).json({ error: 'Unauthorised' });
    return;
  }

  // Parse multipart form
  const form = formidable({ maxFileSize: 1024 * 1024 }); // 1 MB limit
  const [, files] = await form.parse(req);

  const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
  if (!uploadedFile) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const csvText = fs.readFileSync(uploadedFile.filepath, 'utf8');
  fs.unlinkSync(uploadedFile.filepath); // clean up temp file

  const { rows, errors } = parseCsv(csvText);

  if (rows.length === 0) {
    res.status(400).json({ error: 'No valid rows found', details: errors });
    return;
  }

  // Insert into DB
  for (const row of rows) {
    await query(
      `INSERT INTO scheduled_markets (question, end_time, publish_time, status)
       VALUES ($1, $2, $3, 'pending')`,
      [row.question, row.endTime, row.publishTime]
    );
  }

  // Notify Telegram
  const earliest = rows
    .map((r) => r.publishTime)
    .sort((a, b) => a.getTime() - b.getTime())[0]
    .toISOString();
  await telegram.scheduledMarkets(rows.length, earliest);

  res.status(200).json({
    inserted: rows.length,
    skipped: errors.length,
    errors,
  });
}
