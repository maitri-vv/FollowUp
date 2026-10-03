import { Memory, MemoryCategory } from './types';

const DATE_RE = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4}),?\s*(?:-|–)?\s*/;
const WA_RE = /^\[?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4}),?\s*(?:,?\s*)?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*-\s*([^:]+):\s*(.*)$/;

function category(text: string): MemoryCategory {
  const t = text.toLowerCase();
  if (/\b(due|deadline|by \d|before \d|tomorrow|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/.test(t)) return 'deadline';
  if (/\b(pay|payment|maintenance|dues|amount|₹|rs\.?\s?\d|premium)\b/.test(t)) return 'payment';
  if (/\b(offer|discount|deal|festival price|cheaper|free)\b/.test(t)) return 'offer';
  if (/\b(pdf|document|form|quotation|statement|bill|receipt)\b/.test(t)) return 'document';
  if (/\b(send|share|please|need you to|request)\b/.test(t)) return 'request';
  if (/\b(renew|renewal|expires|expiry|premium)\b/.test(t)) return 'renewal';
  return 'general';
}

function normalizeDate(d: string): string | undefined {
  const [a,b,c] = d.split(/[\/.-]/);
  if (!a || !b || !c) return undefined;
  const year = c.length === 2 ? `20${c}` : c;
  return `${year.padStart(4,'0')}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;
}

export async function parseFile(file: File): Promise<Memory[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'txt' || ext === 'md' || ext === 'csv' || ext === 'json' || ext === 'jsonl') {
    const raw = await file.text();
    return parseText(raw, file.name, ext);
  }
  if (file.type.startsWith('image/')) {
    return [{id: crypto.randomUUID(), text:`Image imported: ${file.name}. OCR can be added in the next pass; keep the original screenshot as a source item.`,sourceName:file.name,kind:'screenshot',category:'general',createdAt:Date.now()}];
  }
  return [{id:crypto.randomUUID(),text:`Imported file: ${file.name}. This file type is stored as a source placeholder in the prototype.`,sourceName:file.name,kind:'document',category:'document',createdAt:Date.now()}];
}

function parseText(raw: string, sourceName: string, ext?: string): Memory[] {
  if (ext === 'json' || ext === 'jsonl') {
    try {
      const parsed = JSON.parse(raw);
      const rows = Array.isArray(parsed) ? parsed : [parsed];
      return rows.flatMap((row, i) => {
        const text = typeof row === 'string' ? row : JSON.stringify(row);
        return [{id:crypto.randomUUID(),text,sourceName,kind:'message' as const,category:category(text),createdAt:Date.now()-i}];
      });
    } catch { /* fall through */ }
  }
  const lines = raw.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const out: Memory[] = [];
  for (const line of lines) {
    const m = line.match(WA_RE);
    if (m) {
      const [,dd,mm,yy,,sender,text] = m;
      const date = normalizeDate(`${dd}/${mm}/${yy}`);
      out.push({id:crypto.randomUUID(),text,sourceName,sender,group:sourceName.replace(/\.[^.]+$/,''),date,kind:'message',category:category(text),createdAt:Date.now()});
      continue;
    }
    const d = line.match(DATE_RE);
    const clean = d ? line.slice(d[0].length) : line;
    if (clean.length >= 8) out.push({id:crypto.randomUUID(),text:clean,sourceName,date:d?normalizeDate(d[0].trim().replace(/,$/,'')):undefined,kind:'message',category:category(clean),createdAt:Date.now()});
  }
  if (!out.length && raw.trim()) {
    const chunks = raw.match(/[\s\S]{1,900}(?:\n|$)/g) ?? [raw];
    return chunks.map(text=>({id:crypto.randomUUID(),text:text.trim(),sourceName,kind:'document' as const,category:category(text),createdAt:Date.now()})).filter(x=>x.text);
  }
  return out;
}
