import { fillTemplate } from './email';
import { addDays, toDateInput } from './format';
import { defaultValuation } from './valuation';
import type {
  Activity,
  BuyBox,
  Company,
  Contact,
  Deal,
  EmailMessage,
  EmailTemplate,
  Enrollment,
  Sequence,
  Settings,
  Stage,
  Task,
} from './types';

/* All companies and people generated here are fictional sample data. */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface IndustryDef {
  name: string;
  margin: [number, number];
  recurring: [number, number];
  subs: { name: string; suffixes: string[]; customers: string; recurringNoun: string }[];
  highlights: string[];
  risks: string[];
}

export const INDUSTRIES: IndustryDef[] = [
  {
    name: 'Skilled Trades',
    margin: [0.1, 0.22],
    recurring: [0.2, 0.55],
    subs: [
      { name: 'Plumbing Services', suffixes: ['Plumbing & Drain', 'Plumbing Co.', 'Rooter & Plumbing'], customers: 'residential homeowners and light commercial accounts', recurringNoun: 'service agreements and repeat repair work' },
      { name: 'HVAC Services', suffixes: ['Heating & Air', 'Mechanical', 'Comfort Systems'], customers: 'homeowners, property managers, and small commercial buildings', recurringNoun: 'maintenance memberships' },
      { name: 'Electrical Contracting', suffixes: ['Electric', 'Electrical Services', 'Power & Lighting'], customers: 'commercial GCs, facilities, and residential service', recurringNoun: 'facility service contracts' },
    ],
    highlights: ['Membership program growing double digits', 'Strong Google review profile (4.8★, 1,000+ reviews)', 'Dispatch and pricing run on modern FSM software', 'Deep technician bench with in-house apprenticeship'],
    risks: ['Technician recruiting is the main growth constraint', 'Some revenue tied to new-construction cycles', 'Owner still prices large jobs personally'],
  },
  {
    name: 'IT Managed Services',
    margin: [0.14, 0.26],
    recurring: [0.6, 0.9],
    subs: [
      { name: 'Managed IT Services', suffixes: ['IT Partners', 'Technology Group', 'Managed Services'], customers: 'SMBs in professional services, healthcare, and manufacturing', recurringNoun: 'monthly per-seat managed services contracts' },
      { name: 'Cybersecurity Services', suffixes: ['Cyber', 'Security Partners', 'Secure IT'], customers: 'regional banks, credit unions, and medical groups', recurringNoun: 'multi-year managed security agreements' },
    ],
    highlights: ['Net revenue retention above 105%', 'Standardized tool stack across clients', 'Average client tenure over 7 years', 'Tiered help desk with documented SLAs'],
    risks: ['Vendor price increases compress margin', 'Key engineer holds most client relationships', 'Project revenue is lumpy'],
  },
  {
    name: 'Healthcare Services',
    margin: [0.12, 0.24],
    recurring: [0.4, 0.8],
    subs: [
      { name: 'Home Health Agency', suffixes: ['Home Health', 'Care Partners', 'Home Care'], customers: 'Medicare and private-pay patients across a multi-county footprint', recurringNoun: 'ongoing episodic care' },
      { name: 'Medical Billing', suffixes: ['Revenue Cycle', 'Medical Billing', 'Claims Solutions'], customers: 'independent physician groups and ASCs', recurringNoun: 'percentage-of-collections contracts' },
    ],
    highlights: ['Payor mix diversified across commercial and government', 'Clean survey and compliance history', 'Referral network of 200+ physicians'],
    risks: ['Reimbursement rate exposure', 'Licensing and change-of-ownership timing', 'Clinical labor availability'],
  },
  {
    name: 'Business Services',
    margin: [0.14, 0.28],
    recurring: [0.45, 0.85],
    subs: [
      { name: 'Payroll & HR Services', suffixes: ['Payroll', 'HR Solutions', 'Workforce Services'], customers: 'small businesses with 10–200 employees', recurringNoun: 'per-employee-per-month processing fees' },
      { name: 'Document Management', suffixes: ['Records Management', 'Document Solutions', 'Archive Services'], customers: 'law firms, hospitals, and municipalities', recurringNoun: 'storage and retrieval contracts' },
    ],
    highlights: ['Sticky, mission-critical service with low churn', 'Pricing power demonstrated through annual increases', 'Systems and SOPs documented'],
    risks: ['Software disruption risk over the long term', 'Owner handles top 10 client relationships'],
  },
  {
    name: 'Vertical SaaS',
    margin: [0.15, 0.35],
    recurring: [0.8, 0.95],
    subs: [
      { name: 'Software for Property Managers', suffixes: ['Software', 'Systems', 'Cloud'], customers: 'independent property management firms', recurringNoun: 'annual subscriptions' },
      { name: 'Field Service Software', suffixes: ['Software', 'Labs', 'Technologies'], customers: 'specialty contractors and service businesses', recurringNoun: 'monthly SaaS subscriptions' },
    ],
    highlights: ['Gross margins above 80%', 'Gross logo churn under 8% annually', 'Product roadmap backlog with clear upsell modules'],
    risks: ['Small engineering team, key-person risk on CTO', 'Legacy codebase needs investment'],
  },
  {
    name: 'Insurance Services',
    margin: [0.15, 0.3],
    recurring: [0.65, 0.9],
    subs: [
      { name: 'Warranty Administration', suffixes: ['Warranty Services', 'Service Contracts', 'Protection Plans'], customers: 'auto dealers and home builders', recurringNoun: 'multi-year service contracts' },
      { name: 'Independent Insurance Agency', suffixes: ['Insurance Agency', 'Insurance Group', 'Risk Partners'], customers: 'commercial P&C and personal lines clients', recurringNoun: 'renewal commissions' },
    ],
    highlights: ['Retention above 90% on renewal book', 'Carrier appointments with 20+ markets', 'Float income on client deposits'],
    risks: ['Carrier contingency income fluctuates', 'Regulatory licensing transfer required'],
  },
  {
    name: 'Testing & Inspection',
    margin: [0.16, 0.28],
    recurring: [0.5, 0.8],
    subs: [
      { name: 'Elevator Inspection', suffixes: ['Elevator Inspection', 'Vertical Services', 'Lift Inspection'], customers: 'building owners and property managers', recurringNoun: 'code-mandated annual inspections' },
      { name: 'Environmental Testing Lab', suffixes: ['Analytical Labs', 'Environmental Testing', 'Labs'], customers: 'municipal water systems and engineering firms', recurringNoun: 'recurring compliance sampling' },
    ],
    highlights: ['Non-discretionary, regulation-driven demand', 'Accreditations create barriers to entry', 'Route density in core metro'],
    risks: ['Certified inspector recruiting', 'Equipment recapitalization due in 2 years'],
  },
  {
    name: 'Facility Services',
    margin: [0.08, 0.18],
    recurring: [0.6, 0.9],
    subs: [
      { name: 'Commercial Janitorial', suffixes: ['Building Services', 'Facility Solutions', 'Commercial Cleaning'], customers: 'office, medical, and education facilities', recurringNoun: 'monthly janitorial contracts' },
      { name: 'Pest Control', suffixes: ['Pest Control', 'Pest Solutions', 'Exterminating'], customers: 'residential subscribers and food-service accounts', recurringNoun: 'quarterly service plans' },
    ],
    highlights: ['High contract renewal rates', 'Route-based density economics', 'Low capex requirements'],
    risks: ['Wage inflation pressure on margin', 'Competitive bidding on larger contracts'],
  },
  {
    name: 'Fire & Life Safety',
    margin: [0.14, 0.26],
    recurring: [0.45, 0.75],
    subs: [
      { name: 'Fire Sprinkler Inspection', suffixes: ['Fire Protection', 'Fire & Safety', 'Sprinkler Services'], customers: 'commercial property owners, schools, and hospitals', recurringNoun: 'code-mandated inspection and monitoring' },
      { name: 'Fire Alarm Monitoring', suffixes: ['Alarm & Monitoring', 'Life Safety', 'Signal Systems'], customers: 'multi-family and commercial buildings', recurringNoun: 'monthly monitoring contracts' },
    ],
    highlights: ['Inspection work pulls through high-margin repair revenue', 'Fragmented market ripe for add-ons', 'NICET-certified technicians on staff'],
    risks: ['Installation backlog tied to construction', 'Owner holds key AHJ relationships'],
  },
  {
    name: 'Environmental Services',
    margin: [0.12, 0.24],
    recurring: [0.4, 0.7],
    subs: [
      { name: 'Grease Trap & Septic', suffixes: ['Environmental', 'Pumping Services', 'Waste Solutions'], customers: 'restaurants, municipalities, and rural homeowners', recurringNoun: 'scheduled pumping routes' },
    ],
    highlights: ['Owned disposal permits are hard to replicate', 'Route density across 3 counties'],
    risks: ['Fleet capex intensity', 'Environmental compliance exposure'],
  },
  {
    name: 'Staffing',
    margin: [0.07, 0.15],
    recurring: [0.3, 0.6],
    subs: [
      { name: 'Travel Nurse Staffing', suffixes: ['Medical Staffing', 'Clinical Staffing', 'Healthcare Staffing'], customers: 'regional hospitals and long-term care facilities', recurringNoun: 'ongoing contract placements' },
      { name: 'IT Staffing', suffixes: ['Talent', 'Technical Staffing', 'Consulting'], customers: 'mid-market enterprises', recurringNoun: 'long-term contractor engagements' },
    ],
    highlights: ['MSP relationships with 3 health systems', 'Proprietary candidate database of 15,000+'],
    risks: ['Bill rate normalization post-pandemic', 'Working capital intensive'],
  },
  {
    name: 'Financial Services',
    margin: [0.18, 0.32],
    recurring: [0.6, 0.9],
    subs: [
      { name: 'Outsourced Accounting & CFO', suffixes: ['CFO Partners', 'Accounting Group', 'Financial'], customers: 'venture-backed and founder-led companies', recurringNoun: 'monthly retainer engagements' },
      { name: 'Registered Investment Adviser', suffixes: ['Wealth Management', 'Capital Advisors', 'Wealth Partners'], customers: 'mass-affluent families and business owners', recurringNoun: 'AUM-based fees' },
    ],
    highlights: ['Recurring retainer model with annual price escalators', 'Client tenure averaging 9 years'],
    risks: ['Advisor/client relationship transferability', 'Market-linked fee revenue'],
  },
];

const PREFIXES = ['Summit', 'Ridgeline', 'Blue Heron', 'Keystone', 'Lakeshore', 'Ironwood', 'Northstar', 'Granite', 'Cardinal', 'Harbor', 'Prairie', 'Liberty', 'Pinnacle', 'Copper', 'Evergreen', 'Bluewater', 'Redstone', 'Oak Creek', 'Silverline', 'Patriot', 'Magnolia', 'Trident', 'Anchor', 'Beacon', 'Heritage', 'Frontier', 'Juniper', 'Meridian', 'Cobalt', 'Sterling', 'Tri-County', 'Bayside', 'Piedmont', 'Cumberland', 'Sawtooth', 'Riverbend', 'Old Dominion', 'Lone Pine', 'Westfield', 'Highland'];

const CITIES: [string, string][] = [
  ['Evansville', 'IN'], ['Asheville', 'NC'], ['Charlotte', 'NC'], ['Nashville', 'TN'], ['Knoxville', 'TN'], ['Columbus', 'OH'], ['Cincinnati', 'OH'], ['Indianapolis', 'IN'], ['Louisville', 'KY'], ['Atlanta', 'GA'], ['Savannah', 'GA'], ['Tampa', 'FL'], ['Orlando', 'FL'], ['Jacksonville', 'FL'], ['Dallas', 'TX'], ['Austin', 'TX'], ['San Antonio', 'TX'], ['Houston', 'TX'], ['Phoenix', 'AZ'], ['Denver', 'CO'], ['Boise', 'ID'], ['Salt Lake City', 'UT'], ['Kansas City', 'MO'], ['St. Louis', 'MO'], ['Omaha', 'NE'], ['Minneapolis', 'MN'], ['Milwaukee', 'WI'], ['Chicago', 'IL'], ['Grand Rapids', 'MI'], ['Pittsburgh', 'PA'], ['Richmond', 'VA'], ['Raleigh', 'NC'], ['Greenville', 'SC'], ['Birmingham', 'AL'], ['Oklahoma City', 'OK'], ['Tulsa', 'OK'], ['Sacramento', 'CA'], ['Portland', 'OR'], ['Albany', 'NY'], ['Hartford', 'CT'],
];

const OFF_MARKET_SOURCES = ['KSX proprietary database', 'Direct mail response', 'Owner referral', 'Industry association list', 'CPA / attorney referral', 'Cold call'];
const BROKERS = ['Ashford Lane Advisors', 'Midwest Main Street Brokers', 'Granite Peak Partners', 'Coastal Transition Group', 'Heartland M&A', 'Sunridge Business Advisors'];

export const STATES = Array.from(new Set(CITIES.map((c) => c[1]))).sort();
export const INDUSTRY_NAMES = INDUSTRIES.map((i) => i.name);

export function generateCompanies(count = 96, seed = 42): Company[] {
  const r = rng(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const between = (lo: number, hi: number) => lo + r() * (hi - lo);
  const used = new Set<string>();
  const out: Company[] = [];

  for (let i = 0; i < count; i++) {
    const ind = INDUSTRIES[i % INDUSTRIES.length];
    const sub = pick(ind.subs);
    let name = '';
    for (let tries = 0; tries < 20; tries++) {
      name = `${pick(PREFIXES)} ${pick(sub.suffixes)}`;
      if (!used.has(name)) break;
    }
    used.add(name);
    const [city, state] = pick(CITIES);
    const revenue = Math.round(Math.exp(between(Math.log(3.5e6), Math.log(32e6))) / 1e4) * 1e4;
    const m = between(ind.margin[0], ind.margin[1]);
    const ebitda = Math.round((revenue * m) / 1e4) * 1e4;
    const founded = Math.round(between(1968, 2017));
    const ownerAge = Math.round(between(48, 74));
    const recurringPct = Math.round(between(ind.recurring[0], ind.recurring[1]) * 100) / 100;
    const topCustomerPct = Math.round(between(0.03, 0.32) * 100) / 100;
    const intermediated = r() < 0.35;
    const yrs = new Date().getFullYear() - founded;
    const ownerLine =
      ownerAge >= 62
        ? `The founder (${ownerAge}) is thinking about succession and has no family member positioned to take over.`
        : `The owner (${ownerAge}) is open to a partner who can professionalize the business and fund growth.`;

    const highlights = [...ind.highlights].sort(() => r() - 0.5).slice(0, 3);
    if (ownerAge >= 65) highlights.push('Clear succession motivation');
    const risks = [...ind.risks].sort(() => r() - 0.5).slice(0, 2);
    if (topCustomerPct > 0.2) risks.push(`Top customer is ${(topCustomerPct * 100).toFixed(0)}% of revenue`);

    out.push({
      id: `co-${i + 1}`,
      name,
      industry: ind.name,
      subIndustry: sub.name,
      city,
      state,
      founded,
      employees: Math.max(8, Math.round(revenue / between(110_000, 260_000))),
      revenue,
      ebitda,
      revenueGrowth: Math.round(between(-0.03, 0.2) * 100) / 100,
      recurringPct,
      topCustomerPct,
      ownerAge,
      listing: intermediated ? 'intermediated' : 'off-market',
      source: intermediated ? `Broker: ${pick(BROKERS)}` : pick(OFF_MARKET_SOURCES),
      askingPrice: intermediated ? Math.round((ebitda * between(4.5, 7.5)) / 1e5) * 1e5 : undefined,
      description: `${name} is a ${yrs}-year-old ${sub.name.toLowerCase()} business based in ${city}, ${state}, serving ${sub.customers}. Roughly ${Math.round(recurringPct * 100)}% of revenue comes from ${sub.recurringNoun}. ${ownerLine}`,
      highlights,
      risks,
      website: `www.${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.example`,
      addedAt: addDays(new Date(), -Math.floor(r() * 45)).toISOString(),
    });
  }
  return out;
}

export const DEFAULT_BUY_BOX: BuyBox = {
  minRevenue: 5e6,
  maxRevenue: 30e6,
  minEbitda: 1e6,
  maxEbitda: 5e6,
  minMargin: 0.15,
  minRecurring: 0.4,
  maxTopCustomer: 0.2,
  minYears: 10,
  focusIndustries: ['Skilled Trades', 'IT Managed Services', 'Healthcare Services', 'Business Services', 'Vertical SaaS', 'Insurance Services', 'Testing & Inspection', 'Fire & Life Safety', 'Financial Services'],
};

export const DEFAULT_SETTINGS: Settings = {
  userName: 'Jordan Lee',
  userTitle: 'Operator-in-Residence, Kingsway Search Xcelerator',
  userEmail: 'jordan.lee@example.com',
  userPhone: '(555) 010-2030',
  signature: 'Jordan Lee\nOperator-in-Residence | Kingsway Search Xcelerator\n(555) 010-2030',
  emailClient: 'gmail',
  buyBox: DEFAULT_BUY_BOX,
};

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-intro',
    name: 'Owner intro (proprietary)',
    category: 'Owner outreach',
    subject: 'A long-term home for {{company}}',
    body: `Hi {{first_name}},

I lead acquisitions for the Kingsway Search Xcelerator, part of Kingsway, a publicly traded holding company that buys and operates great small businesses for the long run.

I came across {{company}} while researching {{industry}} businesses around {{city}}. Building something that has lasted {{years}} years is rare, and I'd love to learn how you did it.

We aren't a private equity fund with a 3-year flip. When we partner with an owner, we keep the name, keep the team, and I'd step in to run the business day to day with Kingsway's support behind us.

Would you be open to a 20-minute call in the next couple of weeks? No preparation needed.

Best,
{{signature}}`,
  },
  {
    id: 'tpl-bump',
    name: 'Follow-up 1 (bump)',
    category: 'Owner outreach',
    subject: 'Re: A long-term home for {{company}}',
    body: `Hi {{first_name}},

Following up on my note from last week. I know running {{company}} keeps you busy, so I'll keep this short.

If a quick call isn't a fit right now, I'm also happy to simply send over a one-page overview of who we are and how we work with founders.

Best,
{{my_name}}`,
  },
  {
    id: 'tpl-value',
    name: 'Follow-up 2 (why Kingsway)',
    category: 'Owner outreach',
    subject: 'How we partner with owners like you',
    body: `Hi {{first_name}},

A few things owners tell us matter most when they think about the future of their company:

• Their employees and customers are taken care of
• The business keeps its name and culture
• They choose how involved they stay after a transition

That's how Kingsway works. We've partnered with founders in skilled trades, IT services, and business services, and in each case an operator like me moved to the company full time.

If any of that resonates, I'd welcome a conversation on your schedule.

Best,
{{signature}}`,
  },
  {
    id: 'tpl-breakup',
    name: 'Follow-up 3 (close the loop)',
    category: 'Owner outreach',
    subject: 'Closing the loop',
    body: `Hi {{first_name}},

I haven't heard back, so I'll assume the timing isn't right, and that's completely fine.

If anything changes down the road, whether in six months or five years, my door is open. I'd be glad to be a resource for {{company}} whenever it's helpful.

All the best,
{{my_name}}`,
  },
  {
    id: 'tpl-broker',
    name: 'Broker: request CIM',
    category: 'Intermediated',
    subject: 'Interest in {{company}} – Kingsway Search Xcelerator',
    body: `Hi {{first_name}},

I'm an Operator-in-Residence with the Kingsway Search Xcelerator. We acquire services businesses with $1–5M of EBITDA and close with committed capital from Kingsway's balance sheet, without needing to raise a fund.

{{company}} looks like a strong fit. Could you send over the NDA so we can review the CIM? Happy to jump on a call this week as well.

Thanks,
{{signature}}`,
  },
  {
    id: 'tpl-thanks',
    name: 'Post-call thank you + data request',
    category: 'Process',
    subject: 'Great speaking today – next steps for {{company}}',
    body: `Hi {{first_name}},

Thank you for the time today. I really enjoyed hearing the story of {{company}}.

To help us put together a thoughtful view of value, could you share the following when convenient?

1. Profit & loss statements for the last 3 years plus year-to-date
2. A rough breakdown of revenue by customer or service line
3. A current employee roster (titles and tenure only)

Everything stays confidential under our NDA. I'll follow up later this week.

Best,
{{signature}}`,
  },
];

export const DEFAULT_SEQUENCES: Sequence[] = [
  {
    id: 'seq-owner',
    name: 'Proprietary owner outreach (4-touch)',
    description: 'Intro, bump, value story, and a close-the-loop note over 2 weeks. Stops automatically when the owner replies.',
    steps: [
      { templateId: 'tpl-intro', delayDays: 0 },
      { templateId: 'tpl-bump', delayDays: 4 },
      { templateId: 'tpl-value', delayDays: 5 },
      { templateId: 'tpl-breakup', delayDays: 6 },
    ],
  },
  {
    id: 'seq-broker',
    name: 'Broker follow-up (2-touch)',
    description: 'Request the NDA and CIM, then nudge after 3 days.',
    steps: [
      { templateId: 'tpl-broker', delayDays: 0 },
      { templateId: 'tpl-bump', delayDays: 3 },
    ],
  },
];

export interface SeedData {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  templates: EmailTemplate[];
  sequences: Sequence[];
  emails: EmailMessage[];
  enrollments: Enrollment[];
  tasks: Task[];
  activities: Activity[];
}

export function buildSeed(): SeedData {
  const companies = generateCompanies();
  const now = new Date();
  const iso = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

  // Pick strong-fit companies across industries for the demo pipeline.
  const byFit = [...companies]
    .filter((c) => c.ebitda >= 1e6 && c.ebitda <= 5e6 && c.ebitda / c.revenue >= 0.15)
    .sort((a, b) => b.recurringPct - a.recurringPct);
  const plan: { stage: Stage; priority: Deal['priority']; nextStep: string; thesis: string }[] = [
    { stage: 'diligence', priority: 'high', nextStep: 'QoE kickoff call with Ledgerline', thesis: 'Platform for a regional roll-up; recurring base supports leverage and add-ons are plentiful.' },
    { stage: 'loi', priority: 'high', nextStep: 'Negotiate working capital peg', thesis: 'Non-discretionary demand, founder ready to retire, clear operating improvements via KBS.' },
    { stage: 'ioi', priority: 'high', nextStep: 'Submit IOI by Friday', thesis: 'High recurring revenue and pricing power; underpenetrated adjacent services.' },
    { stage: 'cim', priority: 'medium', nextStep: 'Build model from CIM financials', thesis: 'Fragmented niche with route density benefits.' },
    { stage: 'nda', priority: 'medium', nextStep: 'Request 3 years of P&Ls', thesis: 'Attractive margin profile; need to validate customer concentration.' },
    { stage: 'contacted', priority: 'medium', nextStep: 'Intro call with owner', thesis: 'Succession-driven seller, sticky customer base.' },
    { stage: 'contacted', priority: 'low', nextStep: 'Wait for reply to sequence', thesis: 'Good fit on paper; owner may be early in thinking.' },
    { stage: 'sourced', priority: 'medium', nextStep: 'Enroll owner in outreach sequence', thesis: 'Strong review profile and long tenure.' },
    { stage: 'sourced', priority: 'low', nextStep: 'Research owner contact info', thesis: 'Possible add-on for an existing platform.' },
    { stage: 'passed', priority: 'low', nextStep: '', thesis: 'Interesting niche but too much construction exposure.' },
  ];
  const chosen: Company[] = [];
  const seenInd = new Set<string>();
  for (const c of byFit) {
    if (chosen.length >= plan.length) break;
    if (seenInd.has(c.industry) && seenInd.size < 8) continue;
    seenInd.add(c.industry);
    chosen.push(c);
  }

  const firstNames = ['Dale', 'Linda', 'Gary', 'Patricia', 'Ron', 'Karen', 'Mike', 'Susan', 'Tom', 'Debra'];
  const lastNames = ['Whitfield', 'Okafor', 'Brennan', 'Castillo', 'Hughes', 'Lindqvist', 'Pruitt', 'Nakamura', 'Delgado', 'Ferris'];

  const deals: Deal[] = [];
  const contacts: Contact[] = [];
  chosen.forEach((c, i) => {
    const p = plan[i];
    const dealId = `deal-${i + 1}`;
    const created = iso(-60 + i * 5);
    deals.push({
      id: dealId,
      companyId: c.id,
      stage: p.stage,
      priority: p.priority,
      thesis: p.thesis,
      nextStep: p.nextStep,
      passedReason: p.stage === 'passed' ? 'Construction-cycle exposure above our comfort level' : undefined,
      valuation: { ...defaultValuation(c.ebitda), entryMultiple: 4.5 + (i % 4) * 0.5 },
      notes: [{ id: `n-${i}`, at: iso(-10 + i), text: `Initial screen: ${c.highlights[0] ?? 'solid fundamentals'}.` }],
      createdAt: created,
      updatedAt: iso(-i),
    });
    const isBroker = c.listing === 'intermediated';
    contacts.push({
      id: `ct-${i + 1}`,
      firstName: firstNames[i],
      lastName: lastNames[i],
      title: 'Founder & CEO',
      organization: c.name,
      type: 'owner',
      email: `${firstNames[i].toLowerCase()}@${c.website?.replace('www.', '') ?? 'example.com'}`,
      phone: `(555) 01${i}-44${10 + i}`,
      city: `${c.city}, ${c.state}`,
      dealIds: [dealId],
      notes: c.ownerAge >= 62 ? 'Thinking about retirement; wants employees protected.' : '',
      lastContactedAt: p.stage === 'sourced' ? undefined : iso(-(i + 1)),
      createdAt: created,
    });
    if (isBroker && i < 5) {
      contacts.push({
        id: `ct-b${i + 1}`,
        firstName: ['Megan', 'Chris', 'Priya', 'Evan', 'Rachel'][i],
        lastName: ['Hale', 'Moreno', 'Shah', 'Becker', 'Quinn'][i],
        title: 'Managing Director',
        organization: c.source.replace('Broker: ', ''),
        type: 'broker',
        email: `md${i + 1}@broker.example`,
        phone: `(555) 020-55${10 + i}`,
        city: `${c.city}, ${c.state}`,
        dealIds: [dealId],
        notes: 'Responsive; prefers phone.',
        lastContactedAt: iso(-3),
        createdAt: created,
      });
    }
  });

  contacts.push(
    { id: 'ct-l1', firstName: 'Nora', lastName: 'Albright', title: 'SVP, Acquisition Finance', organization: 'Riverstone Bank (SBA & Cash Flow)', type: 'lender', email: 'nalbright@lender.example', phone: '(555) 030-1100', city: 'Chicago, IL', dealIds: deals.slice(0, 2).map((d) => d.id), notes: 'Comfortable to 3.0x senior on recurring services.', lastContactedAt: iso(-6), createdAt: iso(-90) },
    { id: 'ct-a1', firstName: 'Marcus', lastName: 'Webb', title: 'Partner, M&A', organization: 'Webb Carter LLP', type: 'attorney', email: 'mwebb@law.example', phone: '(555) 030-2200', city: 'Chicago, IL', dealIds: [deals[0].id], notes: 'Drafting APA for deal in diligence.', lastContactedAt: iso(-2), createdAt: iso(-90) },
    { id: 'ct-q1', firstName: 'Helen', lastName: 'Park', title: 'Director, Transaction Advisory', organization: 'Ledgerline QoE', type: 'accountant', email: 'hpark@qoe.example', phone: '(555) 030-3300', city: 'Indianapolis, IN', dealIds: [deals[0].id], notes: 'QoE scope: 3 yrs + TTM, proof of cash.', lastContactedAt: iso(-1), createdAt: iso(-90) },
  );

  const ownerOf = (dealId: string) => contacts.find((c) => c.type === 'owner' && c.dealIds.includes(dealId))!;

  const emails: EmailMessage[] = [];
  const enrollments: Enrollment[] = [];
  // Active outreach sequence on the two "contacted" deals.
  const seq = DEFAULT_SEQUENCES[0];
  deals
    .filter((d) => d.stage === 'contacted')
    .forEach((d, idx) => {
      const ct = ownerOf(d.id);
      const co = companies.find((c) => c.id === d.companyId)!;
      // Offsets chosen so one step per enrollment lands on today in the demo.
      const start = idx === 0 ? -4 : -9;
      const enr: Enrollment = { id: `enr-${idx}`, sequenceId: seq.id, contactId: ct.id, dealId: d.id, status: 'active', startedAt: iso(start) };
      enrollments.push(enr);
      let offset = start;
      seq.steps.forEach((step, si) => {
        offset += step.delayDays;
        const tpl = DEFAULT_TEMPLATES.find((t) => t.id === step.templateId)!;
        const sent = offset < 0;
        const fill = (s: string) => fillTemplate(s, { contact: ct, company: co, settings: DEFAULT_SETTINGS });
        emails.push({
          id: `em-${idx}-${si}`,
          contactId: ct.id,
          dealId: d.id,
          subject: fill(tpl.subject),
          body: fill(tpl.body),
          status: sent ? 'sent' : 'scheduled',
          scheduledFor: iso(offset),
          sentAt: sent ? iso(offset) : undefined,
          sequenceId: seq.id,
          stepIndex: si,
          createdAt: enr.startedAt,
        });
      });
    });

  const d = (i: number) => deals[Math.min(i, deals.length - 1)];
  const tasks: Task[] = [
    { id: 't1', title: 'Send QoE engagement letter back to Ledgerline', type: 'diligence', dueDate: toDateInput(iso(0)), done: false, dealId: d(0).id, contactId: 'ct-q1', createdAt: iso(-3) },
    { id: 't2', title: 'Review draft APA redlines from counsel', type: 'diligence', dueDate: toDateInput(iso(1)), done: false, dealId: d(0).id, contactId: 'ct-a1', createdAt: iso(-2) },
    { id: 't3', title: 'Call owner re: working capital peg', type: 'call', dueDate: toDateInput(iso(-1)), done: false, dealId: d(1).id, createdAt: iso(-4) },
    { id: 't4', title: 'Finalize IOI range with Kingsway BD', type: 'meeting', dueDate: toDateInput(iso(2)), done: false, dealId: d(2).id, createdAt: iso(-2) },
    { id: 't5', title: 'Follow up with broker for monthly P&Ls', type: 'follow-up', dueDate: toDateInput(iso(0)), done: false, dealId: d(3).id, createdAt: iso(-5) },
    { id: 't6', title: 'Send data request list after NDA', type: 'follow-up', dueDate: toDateInput(iso(3)), done: false, dealId: d(4).id, createdAt: iso(-1) },
    { id: 't7', title: 'Prep questions for intro call', type: 'call', dueDate: toDateInput(iso(5)), done: false, dealId: d(5).id, createdAt: iso(-1) },
    { id: 't8', title: 'Lender intro call – Riverstone', type: 'meeting', dueDate: toDateInput(iso(-3)), done: true, dealId: d(1).id, contactId: 'ct-l1', createdAt: iso(-8), completedAt: iso(-3) },
    { id: 't9', title: 'Weekly KSX OIR check-in deck', type: 'general', dueDate: toDateInput(iso(4)), done: false, createdAt: iso(-1) },
  ];

  const nameOf = (dealId: string) => companies.find((c) => c.id === deals.find((x) => x.id === dealId)!.companyId)!.name;
  const activities: Activity[] = [
    { id: 'a1', at: iso(-0.1), type: 'task', text: `Completed lender intro call for ${nameOf(d(1).id)}`, dealId: d(1).id },
    { id: 'a2', at: iso(-0.5), type: 'stage', text: `${nameOf(d(0).id)} moved to Diligence`, dealId: d(0).id },
    { id: 'a3', at: iso(-1), type: 'stage', text: `${nameOf(d(1).id)} moved to LOI signed`, dealId: d(1).id },
    { id: 'a4', at: iso(-2), type: 'email', text: `Sequence email sent to ${ownerOf(d(5).id).firstName} ${ownerOf(d(5).id).lastName}`, dealId: d(5).id },
    { id: 'a5', at: iso(-3), type: 'note', text: `Added CIM notes to ${nameOf(d(3).id)}`, dealId: d(3).id },
    { id: 'a6', at: iso(-4), type: 'deal', text: `${nameOf(d(7).id)} added to pipeline from sourcing`, dealId: d(7).id },
  ];

  return { companies, deals, contacts, templates: DEFAULT_TEMPLATES, sequences: DEFAULT_SEQUENCES, emails, enrollments, tasks, activities };
}