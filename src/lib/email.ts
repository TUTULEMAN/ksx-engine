import type { Company, Contact, Settings } from './types';

export const MERGE_FIELDS = [
  { key: 'first_name', label: 'Contact first name' },
  { key: 'last_name', label: 'Contact last name' },
  { key: 'company', label: 'Company name' },
  { key: 'industry', label: 'Industry' },
  { key: 'city', label: 'Company city' },
  { key: 'years', label: 'Years in business' },
  { key: 'my_name', label: 'Your name' },
  { key: 'my_title', label: 'Your title' },
  { key: 'my_phone', label: 'Your phone' },
  { key: 'signature', label: 'Your signature' },
];

export function fillTemplate(
  text: string,
  ctx: { contact?: Contact; company?: Company; settings: Settings },
): string {
  const { contact, company, settings } = ctx;
  const values: Record<string, string> = {
    first_name: contact?.firstName ?? 'there',
    last_name: contact?.lastName ?? '',
    company: company?.name ?? contact?.organization ?? 'your company',
    industry: company?.subIndustry.toLowerCase() ?? 'your industry',
    city: company?.city ?? contact?.city ?? 'your area',
    years: company ? String(new Date().getFullYear() - company.founded) : 'many',
    my_name: settings.userName,
    my_title: settings.userTitle,
    my_phone: settings.userPhone,
    signature: settings.signature,
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k: string) => values[k] ?? m);
}

export function composeUrl(client: Settings['emailClient'], to: string, subject: string, body: string): string {
  const e = encodeURIComponent;
  if (client === 'gmail') return `https://mail.google.com/mail/?view=cm&fs=1&to=${e(to)}&su=${e(subject)}&body=${e(body)}`;
  if (client === 'outlook') return `https://outlook.office.com/mail/deeplink/compose?to=${e(to)}&subject=${e(subject)}&body=${e(body)}`;
  return `mailto:${e(to)}?subject=${e(subject)}&body=${e(body)}`;
}

export function openCompose(client: Settings['emailClient'], to: string, subject: string, body: string) {
  const url = composeUrl(client, to, subject, body);
  if (client === 'mailto') window.location.href = url;
  else window.open(url, '_blank');
}
