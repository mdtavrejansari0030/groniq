export type Placement = {
  id: string;
  name: string;
  source: string;
};

export type Preset = {
  id: string;
  name: string;
  icon: string;
  source: string;
  medium: string;
  requiresPlacement: boolean;
  placements?: Placement[];
};

export const UTM_PRESETS: Preset[] = [
  {
    id: 'google_search',
    name: 'Google Ads',
    icon: 'search',
    source: 'google',
    medium: 'cpc',
    requiresPlacement: false
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    icon: 'instagram',
    source: 'facebook',
    medium: 'paid_social',
    requiresPlacement: true,
    placements: [
      { id: 'meta_fb', name: 'Facebook', source: 'facebook' },
      { id: 'meta_ig', name: 'Instagram', source: 'instagram' },
      { id: 'meta_msg', name: 'Messenger', source: 'messenger' }
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Paid',
    icon: 'linkedin',
    source: 'linkedin',
    medium: 'paid_social',
    requiresPlacement: false
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: 'video',
    source: 'tiktok',
    medium: 'paid_video',
    requiresPlacement: false
  },
  {
    id: 'email',
    name: 'Newsletter / Email',
    icon: 'mail',
    source: 'newsletter',
    medium: 'email',
    requiresPlacement: false
  },
  {
    id: 'affiliate',
    name: 'Affiliate',
    icon: 'link-2',
    source: 'affiliate_network',
    medium: 'affiliate',
    requiresPlacement: false
  },
  {
    id: 'organic_social',
    name: 'Organic Social',
    icon: 'share-2',
    source: 'instagram',
    medium: 'organic_social',
    requiresPlacement: true,
    placements: [
      { id: 'org_ig', name: 'Instagram', source: 'instagram' },
      { id: 'org_fb', name: 'Facebook', source: 'facebook' },
      { id: 'org_li', name: 'LinkedIn', source: 'linkedin' },
      { id: 'org_tt', name: 'TikTok', source: 'tiktok' },
      { id: 'org_yt', name: 'YouTube', source: 'youtube' }
    ]
  },
  {
    id: 'qr',
    name: 'Offline / QR',
    icon: 'qr-code',
    source: 'qr_code',
    medium: 'offline',
    requiresPlacement: false
  }
];
