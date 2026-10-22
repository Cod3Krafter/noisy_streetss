import type { GlobalConfig } from 'payload'

import { anyone, isStaff, isStaffField } from '@/access'
import { urlValidator } from '@/rules/validators'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isStaff },
  fields: [
    { name: 'contactEmail', label: 'Contact email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
    {
      name: 'socialLinks',
      label: 'Social links',
      type: 'array',
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: ['Instagram', 'X', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn', 'Spotify', 'Other'].map((label) => ({
            label,
            value: label.toLowerCase(),
          })),
        },
        { name: 'url', label: 'Web address', type: 'text', required: true, validate: urlValidator(true) },
      ],
    },
    { name: 'footerText', label: 'Footer text', type: 'textarea' },
    { name: 'newsletterText', label: 'Newsletter sign-up text', type: 'textarea' },
    {
      name: 'defaultShareImage',
      label: 'Default sharing image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Used when a page is shared (on WhatsApp, for example) and has no image of its own.' },
    },
    {
      name: 'formAlertEmail',
      label: 'Send form alerts to',
      type: 'email',
      required: true,
      access: { read: isStaffField },
      admin: { description: 'Every new form entry sends an alert here. Never shown on the site.' },
    },
  ],
}
