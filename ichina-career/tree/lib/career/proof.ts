import { links } from "@/lib/site";
import type { ProductProof } from "./types";

/** Live surfaces as the part of the CV that cannot be told. */
export const proofs: ProductProof[] = [
  {
    id: "ichina",
    title: "ichina.co",
    href: "https://ichina.co",
    path: "ichina.co",
    tacit: "A garden that holds what can be written — and points at the rest.",
    tacitZh: "能写下的放在园地。其余的要走。",
  },
  {
    id: "gghere",
    title: "gghere.com",
    href: links.gghereHk,
    path: "gghere.com/hk",
    tacit: "Walk a city. No account. Product as place.",
    tacitZh: "走进一座城。不用账号。产品即地方。",
  },
  {
    id: "planet",
    title: "jubuddy.com/planet",
    href: links.jubuddyPlanet,
    path: "jubuddy.com/planet",
    tacit: "A planet surface that actually runs.",
    tacitZh: "行星表面，真的能跑。",
  },
  {
    id: "jubit",
    title: "jubit.ai",
    href: links.jubitHome,
    path: "jubit.ai",
    tacit: "AI that actually runs — not a slide.",
    tacitZh: "能跑的 AI，不是幻灯片。",
  },
  {
    id: "jubuddy",
    title: "jubuddy.com",
    href: links.jubuddyHome,
    path: "jubuddy.com",
    tacit: "Theme factory in the same universe. Ships.",
    tacitZh: "同一宇宙里的主题工厂。已经上线。",
  },
  {
    id: "dseek",
    title: "dseek.ai",
    href: links.dseekHome,
    path: "dseek.ai",
    tacit: "Scattered feeds, held together. Research and terminals as a habit.",
    tacitZh: "散落的源，收在一处。研究与终端是习惯。",
  },
  {
    id: "gozayden",
    title: "gozayden.com",
    href: links.gozayden,
    path: "gozayden.com",
    tacit: "Another live surface. The bias is to ship.",
    tacitZh: "又一处现场。偏向把东西做出来。",
  },
  {
    id: "poker",
    title: "jubuddy.com/poker",
    href: "https://jubuddy.com/poker",
    path: "jubuddy.com/poker",
    tacit: "A house engine with tables, bots, and a lobby that stays up.",
    tacitZh: "自家引擎：牌桌、机器人、大厅还在跑。",
  },
];
