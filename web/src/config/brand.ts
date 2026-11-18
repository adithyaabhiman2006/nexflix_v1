/**
 * Everything that changes when the brand is decided lives here.
 * Proposal v2.0: the name "Nexflix", the palette and the logo are placeholders.
 * Values in [BRACKETS] are placeholders shown exactly as on the approved UI canvas.
 */
export const BRAND = {
  name: 'Nexflix',
  wordmark: 'NEXFLIX',
  legalName: '[Legal company name]',
  registeredAddress: '[Registered address]',
  supportEmail: '[support email]',
  whatsapp: '[number]',
  /** Social links. A missing URL hides that icon in the footer. */
  social: {
    facebook: '',
    instagram: '',
    tiktok: '',
    youtube: '',
  },
} as const;
