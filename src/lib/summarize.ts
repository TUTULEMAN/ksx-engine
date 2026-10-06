import type { AiSettings, Company, Contact } from './types';

export type Interest = 'hot' | 'warm' | 'cold' | 'unclear';

export interface EmailSummary {
  summary: string;
  interest: Interest;
  isReply: boolean;
  keyPoints: string[];
  nextSteps: { title: string; dueInDays: number }[];
  suggestedReply: string;
  source: 'ai' | 'basic';
}

export const DEFAULT_AI: AiSettings = { provider: 'none', apiKey: '', model: '' };

export const DEFAULT_MODELS: Record<Exclude<AiSettings['provider'], 'none'>, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
};

interface Ctx {
  contact?: Contact;
  company?: Company;
  myName: string;
}

/** Drops quoted history ("> ..." and "On ... wrote:") and signatures so only the newest message is analyzed. */
export function newestMessage(text: string): string {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^on .+wrote:$/i.test(t) || /^-{2,}\s*original message/i.test(t) || (/^from:\s/i.test(t) && out.length > 3)) break;
    if (t === '--' || t === '-- ') break;
    if (t.startsWith('>')) continue;
    out.push(line);
  }
  return out.join('\n').trim() || text.trim();
}

const HOT = [/interested/i, /let'?s (talk|chat|connect|set up)/i, /happy to/i, /open to/i, /\bcall\b/i, /\bmeet/i, /available/i, /send (over|me)/i, /\bnda\b/i, /sounds good/i, /tell me more/i];
const COLD = [/not interested/i, /not (for sale|selling)/i, /no thanks/i, /remove me/i, /unsubscribe/i, /stop (emailing|contacting)/i, /not a fit/i, /no interest/i];

export function basicSummary(text: string, ctx: Ctx): EmailSummary {
  const body = newestMessage(text);
  const sentences = body
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && !/^(hi|hello|hey|dear|thanks|thank you|best|regards|sincerely|cheers)\b[^.]*[,.!]?$/i.test(s));

  const cold = COLD.some((r) => r.test(body));
  const hotHits = HOT.filter((r) => r.test(body)).length;
  const interest: Interest = cold ? 'cold' : hotHits >= 2 ? 'hot' : hotHits === 1 ? 'warm' : 'unclear';

  const important = sentences.filter((s) => /\?|\$|\d|nda|financial|p&l|price|valuation|value|retire|sell|timing|call|meet|week|month|year|broker|partner|family|employees/i.test(s));
  const keyPoints = (important.length ? important : sentences).slice(0, 4);

  const who = ctx.contact?.firstName ?? 'them';
  const steps: EmailSummary['nextSteps'] = [];
  if (cold) steps.push({ title: `Log pass reason and set a 6-month check-in with ${who}`, dueInDays: 180 });
  if (/\b(call|meet|chat|zoom|phone|coffee|lunch)\b/i.test(body)) steps.push({ title: `Schedule a call with ${who}`, dueInDays: 1 });
  if (/\bnda\b|confidential/i.test(body)) steps.push({ title: `Send NDA to ${who}`, dueInDays: 1 });
  if (/financial|p&l|tax return|statements|numbers/i.test(body)) steps.push({ title: `Follow up on financials with ${who}`, dueInDays: 3 });
  if (/\?/.test(body)) steps.push({ title: `Answer ${who}'s questions`, dueInDays: 1 });
  if (!steps.length) steps.push({ title: `Reply to ${who}`, dueInDays: 1 });

  const first = ctx.contact?.firstName ?? 'there';
  const suggestedReply = cold
    ? `Hi ${first},\n\nThanks for letting me know, I appreciate the reply. If anything changes down the road, I'd be glad to reconnect.\n\nBest,\n${ctx.myName}`
    : `Hi ${first},\n\nThanks for getting back to me. I'd love to find a time to talk this week. Would any of these work for a 20-minute call?\n\n- \n- \n\nBest,\n${ctx.myName}`;

  const lead = keyPoints[0] ?? body.slice(0, 160);
  const label = { hot: 'Interested', warm: 'Open, needs nurturing', cold: 'Not interested', unclear: 'Interest unclear' }[interest];
  return {
    summary: `${label}. ${lead}`,
    interest,
    isReply: /^(re|aw|sv):/im.test(text) || /wrote:/i.test(text) || interest !== 'unclear',
    keyPoints,
    nextSteps: steps.slice(0, 4),
    suggestedReply,
    source: 'basic',
  };
}

const SYSTEM = `You help a search fund operator (someone buying one small business to run as CEO) triage emails from business owners, brokers, lenders, and advisors.
Read the email or thread and respond with JSON only, matching:
{"summary": string (1-2 plain sentences), "interest": "hot"|"warm"|"cold"|"unclear" (the sender's interest in selling or moving the deal forward), "isReply": boolean (true if this is the contact replying to the operator), "keyPoints": string[] (max 4, concrete facts: numbers, timing, concerns, asks), "nextSteps": [{"title": string (imperative, specific), "dueInDays": number}] (max 4), "suggestedReply": string (short, warm, plain-English reply from the operator, signed with their name)}`;

function userPrompt(text: string, ctx: Ctx) {
  const lines = [
    `Operator name: ${ctx.myName}`,
    ctx.contact && `Contact: ${ctx.contact.firstName} ${ctx.contact.lastName}, ${ctx.contact.title} at ${ctx.contact.organization} (${ctx.contact.type})`,
    ctx.company && `Company: ${ctx.company.name}, ${ctx.company.subIndustry}, ${ctx.company.city} ${ctx.company.state}`,
    '',
    'Email:',
    text.slice(0, 20000),
  ];
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}

function parseJson(raw: string): Omit<EmailSummary, 'source'> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('The AI response was not valid JSON.');
  const j = JSON.parse(match[0]);
  const interest: Interest = ['hot', 'warm', 'cold', 'unclear'].includes(j.interest) ? j.interest : 'unclear';
  return {
    summary: String(j.summary ?? ''),
    interest,
    isReply: Boolean(j.isReply),
    keyPoints: Array.isArray(j.keyPoints) ? j.keyPoints.map(String).slice(0, 4) : [],
    nextSteps: Array.isArray(j.nextSteps)
      ? j.nextSteps.slice(0, 4).map((s: { title?: unknown; dueInDays?: unknown }) => ({ title: String(s.title ?? ''), dueInDays: Math.max(0, Math.round(Number(s.dueInDays) || 1)) })).filter((s: { title: string }) => s.title)
      : [],
    suggestedReply: String(j.suggestedReply ?? ''),
  };
}

export async function summarizeEmail(text: string, ctx: Ctx, ai: AiSettings): Promise<EmailSummary> {
  if (ai.provider === 'none' || !ai.apiKey.trim()) return basicSummary(text, ctx);
  const model = ai.model.trim() || DEFAULT_MODELS[ai.provider];

  if (ai.provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.apiKey.trim()}` },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userPrompt(text, ctx) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return { ...parseJson(data.choices?.[0]?.message?.content ?? ''), source: 'ai' };
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ai.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 1200, system: SYSTEM, messages: [{ role: 'user', content: userPrompt(text, ctx) }] }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content = (data.content ?? []).map((c: { text?: string }) => c.text ?? '').join('');
  return { ...parseJson(content), source: 'ai' };
}
