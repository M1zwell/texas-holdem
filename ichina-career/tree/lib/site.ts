export type Product = {
  title: string;
  href: string;
  path: string;
  live: boolean;
  note?: string;
  group?: string;
};

export type Group = {
  id: string;
  label: string;
  items: Product[];
};

export type Tool = {
  id: string;
  title: string;
  href: string;
  path: string;
  note?: string;
  present?: string;
  embeddable: boolean;
  embedSrc: string;
  group: string;
};

export type JoinDestination = {
  id: string;
  label: string;
  path: string;
  href: string;
  note: string;
  needsAccount: boolean;
  shareTitle: string;
};

/**
 * Intended production host (apex) for this garden.
 * Current Vercel deploy is yok-zhang.vercel.app — keep it working.
 * Parent attaches ichina.co in Vercel. Do not mint fake DNS here.
 * OG siteName uses "ichina.co"; metadataBase stays on the Vercel host.
 */
export const canonicalHost = "ichina.co";
export const deployHost = "yok-zhang.vercel.app";

export const links = {
  jubitSignup: "https://www.jubit.ai/signup",
  jubitLogin: "https://www.jubit.ai/login",
  jubitSso: "https://www.jubit.ai/auth/sso",
  jubitHome: "https://jubit.ai",
  dseekHome: "https://dseek.ai",
  dseekSignup: "https://dseek.ai/signup",
  dseekLogin: "https://dseek.ai/login",
  dseekTerminal: "https://dseek.ai/terminal",
  dseekPredict: "https://dseek.ai/terminal?tab=predict",
  dseekResearch: "https://dseek.ai/terminal?tab=research",
  dseekResearchPage: "https://dseek.ai/terminal?tab=research",
  dseekResearchSymbol: "https://dseek.ai/terminal?tab=research&symbol=00700",
  dseekHk: "https://dseek.ai/hk",
  jubuddyHome: "https://jubuddy.com",
  jubuddyPlanet: "https://jubuddy.com/planet",
  jubuddySignup: "https://jubuddy.com/signup",
  gghere: "https://gghere.com",
  gghereWorlds: "https://gghere.com/worlds",
  gghereHk: "https://gghere.com/hk?district=central-belt",
  ggherePlanet: "https://gghere.com/hk?district=central-belt",
  gozayden: "https://gozayden.com",
  github: "https://github.com/M1zwell",
  jubitTerminal: "https://www.jubit.ai/terminal",
  featuredResearch: "https://dseek.ai/research/featured.json",
  emailPrimary: "mailto:yok@dseek.ai",
  emailGmail: "mailto:yying2010@gmail.com",
} as const;

export const nav = [
  { href: "/", label: "Garden" },
  { href: "/writing", label: "Writing" },
  { href: "/tools", label: "Tools" },
  { href: "/products", label: "Products" },
  { href: "/game", label: "Game" },
  { href: "/share", label: "Share" },
] as const;

export const heroLine = "Hong Kong. Builds AI. Lives the rest.";

export const tacitLine =
  "What can be told is here. The rest you walk — planets, the map, the terminal.";

export const writingTacitLine =
  "These notes are what can be told. Research is a source in the same stream. The tools are the remainder — you have to walk them.";

export const quotes = [
  "Hong Kong. Builds AI. Lives the rest.",
  "What can be told is here. The rest you walk.",
  "Scattered feeds, APIs, datasets and maps — held together and made seekable.",
  "Football and philosophy sit in the same life. They are not the work. The work is to ship.",
  "A game id kept as a name: m1zwell.",
  "We know more than we can tell. The products are the rest.",
  "No account. Open the tab. The city is already there.",
];

export const tools: Tool[] = [
  {
    id: "terminal",
    title: "dseek terminal",
    href: "https://dseek.ai/terminal?tab=predict",
    path: "dseek.ai/terminal?tab=predict",
    group: "dseek",
    present: "Polymarket",
    note: "This frame presents the Predict / Polymarket workspace.",
    embeddable: true,
    embedSrc: "https://dseek.ai/terminal?tab=predict",
  },
  {
    id: "research",
    title: "dseek research",
    href: "https://dseek.ai/terminal?tab=research",
    path: "dseek.ai/terminal?tab=research",
    group: "dseek",
    present: "Research desk",
    note: "Research lives on the terminal tab. Example: 00700.",
    embeddable: true,
    embedSrc: "https://dseek.ai/terminal?tab=research",
  },
  {
    id: "hk",
    title: "Yok-Iso HK",
    href: "https://dseek.ai/hk",
    path: "dseek.ai/hk",
    group: "dseek",
    note: "Isometric/pixel Hong Kong map. Building data © HKSAR Lands Dept via DATA.GOV.HK. Rendered by Jubit.",
    embeddable: true,
    embedSrc: "https://dseek.ai/data/life/isometric/",
  },
  {
    id: "jubit",
    title: "jubit.ai",
    href: "https://jubit.ai",
    path: "jubit.ai",
    group: "jubit",
    embeddable: true,
    embedSrc: "https://www.jubit.ai/",
  },
  {
    id: "jubuddy",
    title: "jubuddy.com",
    href: "https://jubuddy.com",
    path: "jubuddy.com",
    group: "jubit",
    note: "theme factory; chatlab buddy in jubit universe.",
    embeddable: true,
    embedSrc: "https://jubuddy.com",
  },
  {
    id: "minigames",
    title: "Mini-games",
    href: "/game",
    path: "ichina.co/game",
    group: "games",
    present: "牛来 · 猪飞",
    note: "Playable demos on this garden. Waiting tree, hand-cast oracle, Handcrafted Post Office, 手绘邮筒, Fun AI / dseek Life, night-shift kiosk.",
    embeddable: false,
    embedSrc: "/game",
  },
  {
    id: "kiosk",
    title: "Hostel PMS",
    href: "/PMS",
    path: "ichina.co/PMS",
    group: "jubit",
    present: "PMS",
    note: "Night-shift kiosk sim. Cloudbeds + QFPay + ProUSB, hardware mocked in the browser. The interlocks are the game.",
    embeddable: false,
    embedSrc: "/PMS",
  },
  {
    id: "worlds",
    title: "gghere.com/worlds",
    href: links.gghereWorlds,
    path: "gghere.com/worlds",
    group: "worlds",
    present: "City catalog",
    note: "Walkable city catalog. HD planet stays Central Belt.",
    embeddable: true,
    embedSrc: links.gghereWorlds,
  },
  {
    id: "gghere",
    title: "gghere HK",
    href: links.gghereHk,
    path: "gghere.com/hk",
    group: "worlds",
    present: "Central Belt · HD",
    note: "Default HD Hong Kong planet for marketing. Catalog remains /worlds.",
    embeddable: true,
    embedSrc: links.gghereHk,
  },
  {
    id: "gozayden",
    title: "gozayden.com",
    href: "https://gozayden.com",
    path: "gozayden.com",
    group: "also",
    embeddable: true,
    embedSrc: "https://gozayden.com/",
  },
];

export const stageIds = ["gghere", "worlds", "jubit", "jubuddy", "terminal", "hk", "gozayden"] as const;

export const stageTools: Tool[] = stageIds
  .map((id) => tools.find((t) => t.id === id))
  .filter((t): t is Tool => Boolean(t));

export const research = {
  title: "Research",
  href: "https://dseek.ai/terminal?tab=research",
  path: "dseek.ai/terminal?tab=research",
  present: "Research desk",
  embeddable: true,
  embedSrc: "https://dseek.ai/terminal?tab=research",
};

export const joinDestinations: JoinDestination[] = [
  {
    id: "gghere",
    label: "Worlds",
    path: "gghere.com/hk",
    href: links.gghereHk,
    note: "Hong Kong Central Belt. HD walkable planet. No account. Catalog of 24 cities at /worlds.",
    needsAccount: false,
    shareTitle: "Walk Hong Kong Central Belt on gghere.com/hk",
  },
  {
    id: "planet",
    label: "Planet",
    path: "jubuddy.com/planet",
    href: "https://jubuddy.com/planet",
    note: "The planet surface — city-planet sibling to the walkable worlds catalog.",
    needsAccount: false,
    shareTitle: "Open the planet at jubuddy.com/planet",
  },
  {
    id: "jubit",
    label: "Jubit",
    path: "jubit.ai",
    href: "https://www.jubit.ai/signup",
    note: "AI that actually runs. Create an account.",
    needsAccount: true,
    shareTitle: "Jubit — AI that actually runs",
  },
  {
    id: "dseek",
    label: "dseek",
    path: "dseek.ai",
    href: "https://dseek.ai/signup",
    note: "Scattered feeds, made seekable.",
    needsAccount: true,
    shareTitle: "dseek — data, held together",
  },
  {
    id: "jubuddy",
    label: "jubuddy",
    path: "jubuddy.com",
    href: "https://jubuddy.com/signup",
    note: "Theme factory in the Jubit universe.",
    needsAccount: true,
    shareTitle: "jubuddy — theme factory",
  },
];

export const productGroups: Group[] = [
  {
    id: "worlds",
    label: "Worlds",
    items: [
      {
        title: "gghere.com/hk",
        href: links.gghereHk,
        path: "gghere.com/hk",
        live: true,
        note: "Default HD Hong Kong planet. Central Belt. Walk it. Catalog of 24 cities remains at /worlds.",
      },
      {
        title: "gghere.com/worlds",
        href: links.gghereWorlds,
        path: "gghere.com/worlds",
        live: true,
        note: "Walkable-worlds catalog. 24 real cities as tiny planets. 393 planets, 4.5M building footprints. No account. Runs in a browser tab.",
      },
      {
        title: "jubuddy.com/planet",
        href: "https://jubuddy.com/planet",
        path: "jubuddy.com/planet",
        live: true,
        note: "Planet product surface. City-planet sibling to the worlds catalog — not a buried jubit link.",
      },
      {
        title: "gghere.com",
        href: "https://gghere.com",
        path: "gghere.com",
        live: true,
        note: "Peer world. We did not edit gghere from this garden — we point to it.",
      },
    ],
  },
  {
    id: "games",
    label: "Games",
    items: [
      {
        title: "ichina.co/game",
        href: "/game",
        path: "ichina.co/game",
        live: true,
        note: "Playable demos: waiting tree, hand-cast oracle, Handcrafted Post Office, 手绘邮筒, Fun AI / dseek Life. Not the live Three.js planet.",
      },
    ],
  },
  {
    id: "jubit",
    label: "Jubit",
    items: [
      {
        title: "jubit.ai",
        href: "https://jubit.ai",
        path: "jubit.ai",
        live: true,
      },
      {
        title: "jubuddy.com",
        href: "https://jubuddy.com",
        path: "jubuddy.com",
        live: true,
        note: "theme factory; chatlab buddy in jubit universe.",
      },
      {
        title: "Hostel PMS",
        href: "/PMS",
        path: "ichina.co/PMS",
        live: true,
        note: "Night-shift kiosk sim. Cloudbeds PMS, QFPay POS, ProUSB lock encode, Creator card dispenser — playable.",
      },
      {
        title: "JubitMind",
        href: "https://github.com/M1zwell/jubitmind",
        path: "github.com/M1zwell/jubitmind",
        live: false,
        note: "AI Interaction Audit & Governance Platform. Human judgement meets AI mind. Every interaction, valued.",
      },
    ],
  },
  {
    id: "dseek",
    label: "dseek.ai",
    items: [
      {
        title: "dseek",
        href: "https://dseek.ai",
        path: "dseek.ai",
        live: true,
        note: "Data Intelligence Platform. Scattered feeds, APIs, datasets and maps, held together and made seekable.",
      },
      {
        title: "dseek terminal",
        href: "https://dseek.ai/terminal",
        path: "dseek.ai/terminal",
        live: true,
      },
      {
        title: "Yok-Iso HK",
        href: "https://dseek.ai/hk",
        path: "dseek.ai/hk",
        live: true,
        note: "Isometric/pixel Hong Kong map. Building data © HKSAR Lands Dept via DATA.GOV.HK. Rendered by Jubit.",
      },
      {
        title: "dseek.ai/data/life",
        href: "https://dseek.ai/data/life?mode=fun&tool=compare&from=planet&landmark=ichina-game&lang=en",
        path: "dseek.ai/data/life",
        live: true,
        note: "Fun AI — lie detector, face reading, compare. Entertainment only. Not a flagship.",
      },
    ],
  },
  {
    id: "other",
    label: "Also live",
    items: [
      {
        title: "gozayden.com",
        href: "https://gozayden.com",
        path: "gozayden.com",
        live: true,
      },
    ],
  },
];

export const products: Product[] = productGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.id })),
);

export const liveProducts = products.filter((p) => p.live);

/** Marketing strip — the live apps that walk the home marquee. */
export const marqueeItems: Product[] = [
  { title: "gghere.com", href: links.gghere, path: "gghere.com", live: true },
  { title: "jubit.ai", href: links.jubitHome, path: "jubit.ai", live: true },
  { title: "jubuddy.com", href: links.jubuddyHome, path: "jubuddy.com", live: true },
  { title: "dseek.ai", href: links.dseekHome, path: "dseek.ai", live: true },
  { title: "dseek.ai/terminal", href: links.dseekTerminal, path: "dseek.ai/terminal", live: true },
  { title: "dseek.ai/hk", href: links.dseekHk, path: "dseek.ai/hk", live: true },
  { title: "gozayden.com", href: links.gozayden, path: "gozayden.com", live: true },
  { title: "gghere.com/hk", href: links.gghereHk, path: "gghere.com/hk", live: true },
  { title: "gghere.com/worlds", href: links.gghereWorlds, path: "gghere.com/worlds", live: true },
];


export const worldCities = [
  { name: "Hong Kong", slug: "hk" },
  { name: "Tokyo", slug: "tokyo" },
  { name: "New York", slug: "nyc" },
  { name: "Paris", slug: "paris" },
  { name: "Amsterdam", slug: "amsterdam" },
  { name: "Rotterdam", slug: "rotterdam" },
  { name: "Seoul", slug: "seoul" },
  { name: "Bangkok", slug: "bangkok" },
  { name: "Taipei", slug: "taipei" },
  { name: "Berlin", slug: "berlin" },
  { name: "Shenzhen", slug: "shenzhen" },
] as const;

export function cityHref(slug: string): string {
  if (slug === "hk") return links.gghereHk;
  return `https://gghere.com/${slug}`;
}

export type District = {
  name: string;
  region: "Hong Kong Island" | "Kowloon" | "New Territories" | "Outlying";
  href: string;
};

function hkPlace(name: string): string {
  return `https://dseek.ai/hk?place=${encodeURIComponent(name)}`;
}

export const districts: District[] = [
  { name: "Central", region: "Hong Kong Island", href: hkPlace("Central") },
  { name: "The Peak", region: "Hong Kong Island", href: hkPlace("The Peak") },
  { name: "Wan Chai", region: "Hong Kong Island", href: hkPlace("Wan Chai") },
  { name: "Causeway Bay", region: "Hong Kong Island", href: hkPlace("Causeway Bay") },
  { name: "North Point", region: "Hong Kong Island", href: hkPlace("North Point") },
  { name: "HKU / Kennedy Town", region: "Hong Kong Island", href: hkPlace("HKU / Kennedy Town") },
  { name: "Aberdeen", region: "Hong Kong Island", href: hkPlace("Aberdeen") },
  { name: "Repulse Bay", region: "Hong Kong Island", href: hkPlace("Repulse Bay") },
  { name: "Stanley", region: "Hong Kong Island", href: hkPlace("Stanley") },
  { name: "Ocean Park", region: "Hong Kong Island", href: hkPlace("Ocean Park") },
  { name: "Tsim Sha Tsui", region: "Kowloon", href: hkPlace("Tsim Sha Tsui") },
  { name: "Mong Kok", region: "Kowloon", href: hkPlace("Mong Kok") },
  { name: "Sham Shui Po", region: "Kowloon", href: hkPlace("Sham Shui Po") },
  { name: "Wong Tai Sin", region: "Kowloon", href: hkPlace("Wong Tai Sin") },
  { name: "Kai Tak", region: "Kowloon", href: hkPlace("Kai Tak") },
  { name: "Kowloon Tong", region: "Kowloon", href: hkPlace("Kowloon Tong (CityU/HKBU)") },
  { name: "Sha Tin", region: "New Territories", href: hkPlace("Sha Tin") },
  { name: "Tsuen Wan", region: "New Territories", href: hkPlace("Tsuen Wan") },
  { name: "Tuen Mun", region: "New Territories", href: hkPlace("Tuen Mun") },
  { name: "Tai Po", region: "New Territories", href: hkPlace("Tai Po") },
  { name: "Yuen Long", region: "New Territories", href: hkPlace("Yuen Long") },
  { name: "Tin Shui Wai", region: "New Territories", href: hkPlace("Tin Shui Wai") },
  { name: "Tseung Kwan O", region: "New Territories", href: hkPlace("Tseung Kwan O") },
  { name: "Tung Chung", region: "New Territories", href: hkPlace("Tung Chung") },
  { name: "Sai Kung", region: "New Territories", href: hkPlace("Sai Kung") },
  { name: "Fanling / Sheung Shui", region: "New Territories", href: hkPlace("Fanling / Sheung Shui") },
  { name: "CUHK", region: "New Territories", href: hkPlace("CUHK") },
  { name: "HKUST", region: "New Territories", href: hkPlace("HKUST") },
  { name: "Cheung Chau", region: "Outlying", href: hkPlace("Cheung Chau") },
  { name: "HK Airport", region: "Outlying", href: hkPlace("HK Airport") },
  { name: "Disneyland", region: "Outlying", href: hkPlace("Disneyland") },
  { name: "Tian Tan Buddha", region: "Outlying", href: hkPlace("Tian Tan Buddha") },
];
