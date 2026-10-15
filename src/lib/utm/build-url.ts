export type UtmState = {
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
};

export function standardize(val: string): string {
  if (!val) return '';
  // For now, hardcode lowercase and replace spaces with underscores
  return val.toLowerCase().replace(/\s+/g, '_');
}

export function buildUtmUrl(state: UtmState): string {
  if (!state.destination) return '';

  let rawDest = state.destination;
  if (!/^https?:\/\//i.test(rawDest)) {
    rawDest = 'https://' + rawDest;
  }

  let urlObj: URL;
  try {
    urlObj = new URL(rawDest);
  } catch (e) {
    return 'Invalid URL format';
  }

  const src = standardize(state.source);
  const med = standardize(state.medium);
  const cmp = standardize(state.campaign);
  const cnt = standardize(state.content);
  const trm = standardize(state.term);

  if (src) urlObj.searchParams.set('utm_source', src);
  if (med) urlObj.searchParams.set('utm_medium', med);
  if (cmp) urlObj.searchParams.set('utm_campaign', cmp);
  if (cnt) urlObj.searchParams.set('utm_content', cnt);
  if (trm) urlObj.searchParams.set('utm_term', trm);

  return urlObj.toString();
}
