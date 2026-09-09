export type CareerTier = "ideal" | "A" | "B" | "cvc";
export type CareerBand = "today" | "institutions" | "capital" | "cvc" | "stretch";
export type CareerStatus = "live" | "watch" | "skip";

export type Felt = 1 | 2 | 3 | 4 | 5;

export type ProductProof = {
  id: string;
  title: string;
  href: string;
  path: string;
  tacit: string;
  tacitZh: string;
};

export type CareerRole = {
  id: string;
  rank: number;
  title: string;
  titleZh?: string;
  org: string;
  location: string;
  href: string;
  closeAt?: string;
  closeNote?: string;
  tier: CareerTier;
  bands: CareerBand[];
  status: CareerStatus;
  pay: Felt;
  security: Felt;
  reputation: Felt;
  balance: Felt;
  fit: Felt;
  rhyme: string;
  rhymeZh: string;
  stretch?: boolean;
  confirmSeat?: boolean;
  portalOnly?: boolean;
  skipWhy?: string;
  desk?: {
    apply: string;
    draft?: string;
    addendum?: string;
    caution?: string;
  };
};

export type CareerSnapshot = {
  updatedAt: string;
  thesis: string;
  thesisZh: string;
};
