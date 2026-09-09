/** Owner-desk identity. Never import from the public lock. Do not name the current fund. */

export type CareerSeat = {
  id: string;
  title: string;
  titleZh: string;
  org: string;
  orgZh: string;
  since?: string;
  confidential?: boolean;
};

export const careerOwner = {
  name: "Yok Zhang",
  handle: "m1zwell",
  email: "yying2010@gmail.com",
  linkedin: "https://www.linkedin.com/in/yok-zhang-8793a611",
  cityu: "City University of Hong Kong alumnus. Degree title unclaimed until filled.",
  cityuZh: "香港城市大学校友。学位名称未填之前，不写。",
  licences: "RO / OMO. Do not claim Type 4/9, CFA, or Cantonese unless filled.",
  licencesZh: "负责人员 / 整体管理监督。未填之前不声称第 4/9 类、CFA、粤语。",
  languages: "English + Putonghua.",
  languagesZh: "英语 + 普通话。",
};

export const seats: CareerSeat[] = [
  {
    id: "quant",
    title: "IM / Director / OMO / RO",
    titleZh: "投资经理 / 董事 / 整体管理监督（OMO）/ 负责人员",
    org: "China top-15 quantitative fund",
    orgZh: "中国头部十五量化基金",
    confidential: true,
  },
  {
    id: "founder",
    title: "Founder & Executive Director",
    titleZh: "创始人兼执行董事",
    org: "Live AI products — ichina.co, jubuddy.com, gozayden.com, gghere.com, jubit.ai, dseek.ai",
    orgZh: "已上线的 AI 产品 — ichina.co, jubuddy.com, gozayden.com, gghere.com, jubit.ai, dseek.ai",
  },
  {
    id: "hedge",
    title: "Offshore hedge trading fund",
    titleZh: "离岸对冲交易基金",
    org: "Hedge / offshore trading book",
    orgZh: "对冲 / 离岸交易账簿",
    since: "2025-09",
  },
];

export const priorSeats: CareerSeat[] = [
  {
    id: "tongfang",
    title: "VP / RO",
    titleZh: "副总裁 / 负责人员",
    org: "Tongfang Securities",
    orgZh: "同方证券",
  },
  {
    id: "huatai",
    title: "Distribution Management Lead, VP Wealth / RO",
    titleZh: "分销管理负责人、财富副总裁 / 负责人员",
    org: "Huatai Financial Holdings (Hong Kong)",
    orgZh: "华泰金融控股（香港）",
  },
];

export const huntThesis = {
  en: "Licensed Hong Kong IM / Director / OMO / RO at a China top-15 quantitative fund, founder-executive of live AI products, and operator of an offshore hedge trading book since Sep 2025. Not a classic PE modeller. The edge is indwelling: ships, then holds the desk.",
  zh: "香港持牌投资经理 / 董事 / 整体管理监督 / 负责人员，任职中国头部十五量化基金；同时是已上线 AI 产品的创始人兼执行董事，并自 2025 年 9 月起运营离岸对冲交易账簿。不是典型 PE 建模手。长处是默会：先做出来，再守住台面。",
};
