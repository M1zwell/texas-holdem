export type FundingKind = "grant" | "incubation" | "angel" | "cvc" | "platform";
export type FundingStatus = "live" | "watch" | "skip";
export type Felt = 1 | 2 | 3 | 4 | 5;

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
  leverage: Felt;
  halo: Felt;
  fit: Felt;
  closeAt?: string;
  closeNote: string;
  apply: string;
  officialMail?: string;
  draft?: string;
  caution: string;
  skipWhy?: string;
};

export type FundingSnapshot = {
  updatedAt: string;
  thesis: string;
  thesisZh: string;
};
