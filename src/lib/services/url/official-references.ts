/** Curated references, not registry approvals or message authentication. Sources checked 2026-11-24. */
export const officialReferences = [
  { domain: "u.ae", name: "UAE Government", ar: "حكومة الإمارات", aliases: ["uaegov"], source: "https://u.ae/en/" },
  { domain: "tamm.abudhabi", name: "TAMM", ar: "تم", aliases: ["tamm"], source: "https://u.ae/en/about-the-uae/digital-uae/digital-cities/smart-abu-dhabi" },
  { domain: "uaepass.ae", name: "UAE PASS", ar: "الهوية الرقمية", aliases: ["uaepass"], source: "https://u.ae/en/about-the-uae/digital-uae/digital-transformation/platforms-and-apps/the-uae-pass-app" },
  { domain: "moi.gov.ae", name: "Ministry of Interior", ar: "وزارة الداخلية", aliases: ["moi"], source: "https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety" },
  { domain: "adpolice.gov.ae", name: "Abu Dhabi Police", ar: "شرطة أبوظبي", aliases: ["adpolice", "abudhabipolice"], source: "https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety" },
  { domain: "dubaipolice.gov.ae", name: "Dubai Police", ar: "شرطة دبي", aliases: ["dubaipolice"], source: "https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety" },
  { domain: "rta.ae", name: "Dubai RTA", ar: "هيئة الطرق والمواصلات", aliases: ["rta"], source: "https://u.ae/en/information-and-services/justice-safety-and-the-law/safety/road-safety" },
  { domain: "adcb.com", name: "ADCB", ar: "بنك أبوظبي التجاري", aliases: ["adcb"], source: "https://www.adcb.com/en/get-in-touch/call-us/" },
  { domain: "emiratesnbd.com", name: "Emirates NBD", ar: "الإمارات دبي الوطني", aliases: ["emiratesnbd", "enbd"], source: "https://www.emiratesnbd.com/en/help-and-support/contact-us" },
  { domain: "bankfab.com", name: "First Abu Dhabi Bank", ar: "بنك أبوظبي الأول", aliases: ["bankfab"], source: "https://www.bankfab.com/en-ae/personal/help-and-support/fraud-and-security" },
  { domain: "dib.ae", name: "Dubai Islamic Bank", ar: "بنك دبي الإسلامي", aliases: ["dib"], source: "https://www.dib.ae/support" },
] as const;
export const isDomainBoundary = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);
