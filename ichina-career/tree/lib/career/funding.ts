import type { Felt } from "./types";

/** Less-burden capital for jubuddy.com/planet. Not a job field. */
export type FundingKind = "grant" | "incubation" | "angel" | "cvc" | "platform";
export type FundingStatus = "live" | "watch" | "skip";

export type FundingProgram = {
  id: string;
  rank: number;
  title: string;
  titleZh: string;
  org: string;
  href: string;
  kind: FundingKind;
  status: FundingStatus;
  /** 5 = light grant / little control. 1 = equity + FTE + space. */
  burden: Felt;
  /** Distribution, operator help, matching, network. */
  leverage: Felt;
  halo: Felt;
  fit: Felt;
  closeNote: string;
  apply: string;
  officialMail?: string;
  draft?: string;
  caution: string;
  skipWhy?: string;
};

export const fundingSnapshot = {
  updatedAt: "2026-09-15T07:50:00Z",
  drafts: {
    shortlist: "r2636775933442941030",
    outreach: "r7336833261496187918",
    earlierMemo: "r3316109210262000420",
  },
  product: "https://jubuddy.com/planet",
  productNote: "Official title: Walk a real city as a tiny planet — jubuddy. Live surface. Do not invent MAU, revenue, or a raise number.",
  thesis:
    "Prefer less-burden halo capital that also brings distribution or operator help: CityU alumni seed, then Cyberport grant/incubate, then named HK angels/CVC portals. Do not spray guessed inboxes. Do not invent a PolyU / HKU / HKUST PIC. Keep the current China-background quant fund name confidential.",
  thesisZh:
    "先低负担光环资本，再要渠道或操盘手资源：城大校友种子，然后数码港资助/孵化，然后具名香港天使/CVC 门户。不乱发猜测邮箱。不编理大 / 港大 / 科大负责人。现职中国背景量化基金名称保密。",
  needFromOwner: [
    "Hong Kong company name and incorporation date",
    "Founder beneficial ownership %",
    "Whether PIC can show CityU alumni proof",
    "Seed-only vs Seed then CIP",
    "Ask / valuation = [TO FILL]",
    "Whether a CreateSmart project (industry-wide, not just the studio) exists",
  ],
};

export const funding: FundingProgram[] = [
  {
    id: "F1",
    rank: 1,
    title: "HK Tech 300 Seed Fund — 21st cohort",
    titleZh: "城大 HK Tech 300 种子基金 · 第二十一轮",
    org: "City University of Hong Kong",
    href: "https://www.cityu.edu.hk/hktech300/about-hk-tech-300/hk-tech-300-seed-fund",
    kind: "grant",
    status: "live",
    burden: 5,
    leverage: 4,
    halo: 5,
    fit: 5,
    closeNote:
      "Official 21st cohort opens 23 Sep 2026 · deadline 7 Oct 2026 12:00 noon · interviews mid-Nov 2026 · result Dec 2026 · HK$100,000 · 6–12 months then may compete for Angel up to HK$1M",
    apply:
      "Official Apply Now on the Seed Fund page after 23 Sep 2026. PIC proof of CityU association (alumni certificate). Enquiries hktech300.seed@cityu.edu.hk after APPROVE only.",
    officialMail: "hktech300.seed@cityu.edu.hk",
    draft: "r2636775933442941030 · outreach pack r7336833261496187918 · earlier memo r3316109210262000420",
    caution:
      "CityUHK students, alumni, research staff, or teams commercialising CityU IP. Do not invent CityU IP or a degree title. This desk first-fetch of the page is a short JS shell (HTTP 200 len ~212) — do not skip solely on that. Do not email until APPROVE.",
  },
  {
    id: "F2",
    rank: 2,
    title: "Cyberport Creative Micro Fund (CCMF) Hong Kong Programme",
    titleZh: "数码港创意微型基金（香港计划）",
    org: "Cyberport",
    href: "https://www.cyberport.hk/en/entrepreneurship/hong_kong_programme/",
    kind: "grant",
    status: "live",
    burden: 5,
    leverage: 4,
    halo: 5,
    fit: 4,
    closeNote:
      "Official next intake Feb 2027 · online deadline 1 Dec 2026 · Oct 2026 intake deadline 3 Aug 2026 already passed · grant HK$100,000 / about six months · idea or MVP stage",
    apply:
      "Official EMS https://ems.cyberport.hk/form/ (HTTP 200 this pass). Individual: HKID principal. Company: HK limited company on admission.",
    caution:
      "Official programme pages Cloudflare HTTP 403 from this desk — EMS HTTP 200. Do not skip solely on marketing-page 403. Ladder into CIP. Do not email guessed hr@cyberport.hk for this grant.",
  },
  {
    id: "F3",
    rank: 3,
    title: "Cyberport Incubation Programme",
    titleZh: "数码港孵化计划",
    org: "Cyberport",
    href: "https://www.cyberport.hk/en/entrepreneurship/cyberport_incubation_programme/",
    kind: "incubation",
    status: "live",
    burden: 4,
    leverage: 5,
    halo: 5,
    fit: 4,
    closeNote:
      "Official year-round in three batches · next listed deadline 1 Dec 2026 for Feb 2027 intake · up to HK$500,000 over 24 months · GTM + investor matching",
    apply:
      "Official EMS https://ems.cyberport.hk/form/. Enquiries cip_enquiry@cyberport.hk after APPROVE only.",
    officialMail: "cip_enquiry@cyberport.hk",
    caution:
      "HK digital-tech company limited by shares (or in progress) incorporated less than 7 years. Founders collectively at least 51%. Marketing page may say next intake will open soon — EMS is the apply path. Do not jump to Macro Fund without Cyberport identity + a lead term sheet.",
  },
  {
    id: "F4",
    rank: 4,
    title: "HK Tech 300 Angel Fund — 16th cohort",
    titleZh: "城大 HK Tech 300 天使基金 · 第十六轮",
    org: "City University of Hong Kong",
    href: "https://www.cityu.edu.hk/hktech300/about-hk-tech-300/hk-tech-300-angel-fund",
    kind: "angel",
    status: "watch",
    burden: 3,
    leverage: 4,
    halo: 5,
    fit: 4,
    closeNote:
      "Official 16th cohort opens 23 Sep 2026 · deadline 14 Oct 2026 12:00 noon · interviews mid-Nov 2026 · result Mar 2027 · investment up to HK$1M + Admiralty co-working",
    apply:
      "Official Angel page + supporting docs to hktech300.angel@cityu.edu.hk by the deadline after APPROVE. Needs CI, BR, CityU PIC proof, CVs, business proposal.",
    officialMail: "hktech300.angel@cityu.edu.hk",
    caution:
      "Equity, not a grant. After Seed unless an incorporated HK company and a proposal are already ready. Do not invent CityU IP. Do not email until APPROVE.",
  },
  {
    id: "F5",
    rank: 5,
    title: "CreateSmart Initiative — Digital Entertainment / Game",
    titleZh: "创意智优计划 · 数码娱乐 / 游戏",
    org: "Cultural and Creative Industries Development Agency",
    href: "https://csi.ccidahk.gov.hk/en/application/how_to_apply.html",
    kind: "grant",
    status: "watch",
    burden: 3,
    leverage: 3,
    halo: 4,
    fit: 3,
    closeNote:
      "Official four rounds · deadlines last calendar day of Mar / Jun / Sep / Dec · next 30 Sep 2026 · project start 6–12 months after that deadline (about Apr–Sep 2027) · grant for a project, not studio equity · HTTP 200 this pass",
    apply:
      "Official system http://cfais.ccidahk.gov.hk after organisation + coordinator register. Guide Jul 2026. Enquiries createsmart@ccidahk.gov.hk after APPROVE only.",
    officialMail: "createsmart@ccidahk.gov.hk",
    caution:
      "Applicant must be a HK-incorporated body/company. Vetting asks whether benefits serve the sector, not just one private company. Do not file a studio-only raise as CSI. Do not invent an industry showcase project. Need [TO FILL] project + budget before any form.",
  },
  {
    id: "F6",
    rank: 6,
    title: "Alibaba Entrepreneurs Fund — Hong Kong Investment Program",
    titleZh: "阿里巴巴创客基金 · 香港投资计划",
    org: "Alibaba Entrepreneurs Fund",
    href: "https://www.ent-fund.org/en/investment/hk",
    kind: "cvc",
    status: "watch",
    burden: 2,
    leverage: 5,
    halo: 5,
    fit: 3,
    closeNote:
      "Official HK$1b evergreen · seed / Series A or later · HK-founded or HK-operating · sector agnostic, Alibaba ecosystem preferred · form https://www.ent-fund.org/en/business-plan/personal?region=hk · this desk HTTP 502 — do not skip solely on 502",
    apply:
      "Official website register + profile + business plan. Shortlist meeting within one month. Do not email a guessed AEF inbox.",
    caution:
      "Equity and DD. Halo + Mainland/Alibaba distribution if they want it. After a written plan and [TO FILL] ask. Do not invent Alibaba-ecosystem fit. Gaming sits in AEF GBA portfolio via Animoca as an investee — that is not an inbound intro.",
  },
  {
    id: "F7",
    rank: 7,
    title: "AngelHub fundraise portal",
    titleZh: "AngelHub 融资门户",
    org: "AngelHub Limited",
    href: "https://www.angelhub.io/how-it-works/fundraise",
    kind: "platform",
    status: "watch",
    burden: 2,
    leverage: 4,
    halo: 4,
    fit: 2,
    closeNote:
      "Official growth-stage Asia tech · Pre-A to A+ USD 400k–1.5M on the platform · MVP required · SFC Type 1 and 4 · signup https://angelhub.io/auth/signup?role=Fundraiser · this desk HTTP 0 — do not skip solely on that",
    apply:
      "Official How to Fundraise form + deck. Official footer contact@angelhub.io after APPROVE only if the portal fails. Campaign live 90 days if selected.",
    officialMail: "contact@angelhub.io",
    caution:
      "Needs a real raise number and valuation [TO FILL]. Heavier than Seed/CCMF. Do not invent traction. Do not treat OpenVC/aggregator check sizes as official.",
  },
  {
    id: "F8",
    rank: 8,
    title: "HKSTP Incubation Programme",
    titleZh: "科学园孵化计划",
    org: "Hong Kong Science and Technology Parks Corporation",
    href: "https://www.hkstp.org/en/programmes/incubation/incubation-programme",
    kind: "incubation",
    status: "watch",
    burden: 1,
    leverage: 4,
    halo: 4,
    fit: 3,
    closeNote:
      "Official year-round · HTTP 200 · 3 years · workspace + funding + investor matching · official incubation@hkstp.org on page",
    apply:
      "Official online application + business proposal + three-year milestones. Enquiries incubation@hkstp.org after APPROVE only.",
    officialMail: "incubation@hkstp.org",
    caution:
      "HK company limited by shares, incorporated no more than five years, founders ≥51%, at least two legally employable full-time staff, core R&D in approved space. Higher burden than Cyberport CIP. Guide v13 dated 26 Mar 2026.",
  },
  {
    id: "F9",
    rank: 9,
    title: "Cyberport Macro Fund",
    titleZh: "数码港投资创业基金",
    org: "Cyberport",
    href: "https://www.cyberport.hk/en/entrepreneurship/cyberport_macro_fund/",
    kind: "cvc",
    status: "skip",
    burden: 1,
    leverage: 4,
    halo: 5,
    fit: 2,
    closeNote: "Official HK$1M–20M co-invest · needs Cyberport identity + lead-investor term sheet · skip this week",
    apply: "After CIP/CCMF identity. Official cmf_enquiry@cyberport.hk after APPROVE only. Do not jump the ladder.",
    officialMail: "cmf_enquiry@cyberport.hk",
    caution: "Equity, lead required, post-investment ownership cap about 20% on third-party notes — confirm in official CMF guide before any form.",
    skipWhy:
      "No Cyberport incubatee / Smart-Space / tenant identity isolated this pass. Do not file CMF as the first cheque.",
  },
  {
    id: "F10",
    rank: 99,
    title: "HKSTP Ideation Programme cohort 26-23",
    titleZh: "科学园 Ideation 第 26-23 轮",
    org: "Hong Kong Science and Technology Parks Corporation",
    href: "https://www.hkstp.org/en/programmes/ideation",
    kind: "grant",
    status: "skip",
    burden: 5,
    leverage: 3,
    halo: 4,
    fit: 3,
    closeNote:
      "Official Cohort 26-23 (January 2027 commences) · 31 Aug 2026 12:00 noon to 14 Sep 2026 12:00 noon · HTTP 200 this pass · CLOSED · do not file late",
    apply: "Watch the next Jan / May / Sep window on the same official page. Do not invent the next close date.",
    skipWhy:
      "Official ideation page lists Cohort 26-23 application 31 August 2026 12:00 (Noon) to 14 September 2026 12:00 (Noon). Wall clock Tue 15 Sep 2026 is after that noon close. Up to HKD 100,000 grant. Do not file late. Next cycles are January, May, and September — wait for the official next window.",
  },
  {
    id: "F11",
    rank: 99,
    title: "TSSSU@HKU / HKUST Dream Builder / PolyVentures Angel",
    titleZh: "港大 / 科大 / 理大大学基金",
    org: "HKU TEC / HKUST EC / PolyU KTEO",
    href: "https://tec.hku.hk/hkutsssu/",
    kind: "grant",
    status: "skip",
    burden: 3,
    leverage: 3,
    halo: 4,
    fit: 1,
    closeNote: "Official PIC must be that university's member · CityU alumnus does not unlock these · isolated 15 Sep 2026",
    apply: "Do not apply unless a real HKU / HKUST / PolyU PIC exists. Do not invent one.",
    skipWhy:
      "Official tec.hku.hk/hkutsssu/ HTTP 200: TSSSU@HKU 2027-28 deadline 12:00 noon 20 Oct 2026 but PIC must be an HKU member and HKU members ≥20% — do not invent. Official okt.hkust.edu.hk/tsssu HTTP 200 still shows 2026/27 deadline 17:00 2 Oct 2025 — do not file late; Dream Builder Cohort 2 deadline 5 Jul 2026 passed and main applicant must be a current full-time HKUST student (dreambuilder@ust.hk). Official PolyVentures Angel Fund 2026-27 deadline 1:00pm 27 Oct 2025 passed and PIC must be a PolyU member (tsssu.o@polyu.edu.hk). CityU TSSSU 2026-27 page still shows noon 28 Oct 2025 — do not file late; watch HKTech300.tsssu@cityu.edu.hk for a later cycle after APPROVE only.",
  },
  {
    id: "F12",
    rank: 99,
    title: "HashKey Capital / Animoca inbound (no official deck portal isolated)",
    titleZh: "HashKey Capital / Animoca 进件",
    org: "HashKey Capital / Animoca Brands",
    href: "https://hashkey.capital/",
    kind: "cvc",
    status: "skip",
    burden: 2,
    leverage: 4,
    halo: 4,
    fit: 2,
    closeNote: "Official hashkey.capital/contact HTTP 404 · animocabrands.com Cloudflare 403 · no official inbound form isolated",
    apply: "Do not email aggregator inboxes. Keep career B71 / HashKey 611 or RWA B191 as job track, not a guessed raise email.",
    skipWhy:
      "Official hashkey.capital/ HTTP 200. Official hashkey.capital/contact HTTP 404. Third-party pages list enquiries@hashkey.com — do not treat that as an official inbound path. Official animocabrands.com HTTP 403 Cloudflare this desk — do not invent partnerships@ or IR mail. Mills Fabrica official contact@themillsfabrica.com is on the site (HTTP 200) but the house thesis is fashion / climate / materials, not a city-walker game — do not spray. After halo grants, revisit only if an official CVC form appears or the owner names a warm intro.",
  },
];
