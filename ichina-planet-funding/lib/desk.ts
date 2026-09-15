/** Product-funding desk only. Not the career hunt. */

export const fundingDesk = {
  id: "planet-funding",
  product: "https://jubuddy.com/planet",
  productTitle: "Walk a real city as a tiny planet — jubuddy",
  ownerEmail: "yying2010@gmail.com",
  /**
   * Extreme case: career hunt + product funding + part-time coding at once.
   * Allowed. Still two desks.
   */
  dualTrack: {
    en:
      "Career hunt and product funding are two desks. Doing both — including part-time coding on Planet — is allowed. Do not merge applications, inboxes, drafts, or calendars. A Cyberport job cover is not a CIP form. A CityU CDTO application is not a HK Tech 300 Seed form. A Meitu CVC job is not a raise email.",
    zh:
      "求职与产品融资是两张台面。两边同时做、包括兼职写 Planet，可以。不要合并申请、邮箱、草稿或日历。数码港职位求职信不是 CIP 表。城大 CDTO 申请不是 HK Tech 300 种子表。美图 CVC 职位不是融资邮件。",
  },
  never: [
    "Do not put a job cover letter and a Seed/CIP letter in the same email.",
    "Do not use hr@cyberport.hk (career A36) for CCMF/CIP.",
    "Do not use hrojob@cityu.edu.hk (career A31) for HK Tech 300.",
    "Do not use a HashKey job Apply as a Capital raise.",
    "Do not name the current China-background quantitative fund.",
    "Do not send any programme email until APPROVE names the funding draft.",
  ],
};
