// Works out where a lead came from, using UTM labels, ad click ids and the
// referrer captured on the visitor's first page view.

export type Attribution = {
  utm_source?: string | null;
  utm_medium?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
};

const SEARCH = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|brave)\./i;
const SOCIAL = /(^|\.)(facebook|instagram|t\.co|twitter|x\.com|linkedin|youtube|tiktok|snapchat|pinterest|reddit|whatsapp|telegram|t\.me|lnkd\.in|l\.facebook|lm\.facebook)(\.|$)/i;

function host(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function channelOf(a: Attribution): string {
  const src = (a.utm_source ?? "").toLowerCase();
  const med = (a.utm_medium ?? "").toLowerCase();

  if (a.gclid || a.gbraid || a.wbraid) return "Google Ads";
  if (a.fbclid || /facebook|instagram|meta|fb|ig/.test(src)) return /instagram|ig/.test(src) ? "Instagram" : "Meta Ads";
  if (/tiktok/.test(src)) return "TikTok";
  if (/snap/.test(src)) return "Snapchat";
  if (/google/.test(src) && /cpc|ppc|paid/.test(med)) return "Google Ads";
  if (/mail|newsletter/.test(med) || /mail|newsletter/.test(src)) return "Email";
  if (/cpc|ppc|paid|display|banner/.test(med)) return src ? `Paid: ${src}` : "Paid";
  if (src) return `Campaign: ${src}`;

  const refHost = host(a.referrer);
  const ownHost = host(a.landing_page);
  if (!refHost || refHost === ownHost) return "Direct";
  if (SEARCH.test(refHost)) return "Organic search";
  if (SOCIAL.test(refHost)) return "Social";
  return `Referral: ${refHost}`;
}
