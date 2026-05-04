/**
 * CSV parser for market scheduling uploads.
 * Expected columns: question, end_time_utc, publish_time_utc
 */

export interface ScheduledMarketRow {
  question: string;
  endTime: Date;
  publishTime: Date;
}

export interface ParseResult {
  rows: ScheduledMarketRow[];
  errors: string[];
}

export function parseCsv(csvText: string): ParseResult {
  const lines = csvText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must have a header row and at least one data row.'] };
  }

  // Normalize header
  const headers = parseLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, '_')
  );

  const questionIdx = headers.indexOf('question');
  const endIdx = headers.indexOf('end_time_utc');
  const publishIdx = headers.indexOf('publish_time_utc');

  const missing: string[] = [];
  if (questionIdx === -1) missing.push('question');
  if (endIdx === -1) missing.push('end_time_utc');
  if (publishIdx === -1) missing.push('publish_time_utc');

  if (missing.length > 0) {
    return {
      rows: [],
      errors: [`Missing required columns: ${missing.join(', ')}`],
    };
  }

  const rows: ScheduledMarketRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const question = cols[questionIdx]?.trim();
    const endRaw = cols[endIdx]?.trim();
    const publishRaw = cols[publishIdx]?.trim();

    if (!question) {
      errors.push(`Row ${i + 1}: missing question`);
      continue;
    }

    const endTime = new Date(endRaw);
    const publishTime = new Date(publishRaw);

    if (isNaN(endTime.getTime())) {
      errors.push(`Row ${i + 1}: invalid end_time_utc "${endRaw}"`);
      continue;
    }
    if (isNaN(publishTime.getTime())) {
      errors.push(`Row ${i + 1}: invalid publish_time_utc "${publishRaw}"`);
      continue;
    }
    if (publishTime >= endTime) {
      errors.push(
        `Row ${i + 1}: publish_time_utc must be before end_time_utc`
      );
      continue;
    }

    rows.push({ question, endTime, publishTime });
  }

  return { rows, errors };
}

/** Simple CSV line parser that handles quoted fields. */
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
