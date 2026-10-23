import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isStaffUser } from './access'
import { hasCronSecret } from './access/jobs'
import { Announcements } from './collections/Announcements'
import { Articles } from './collections/Articles'
import { Awards } from './collections/Awards'
import { BookClubSessions } from './collections/BookClubSessions'
import { Books } from './collections/Books'
import { Careers } from './collections/Careers'
import { Categories } from './collections/Categories'
import { Events } from './collections/Events'
import { Merch } from './collections/Merch'
import { MembershipPlans } from './collections/MembershipPlans'
import { StudioServices } from './collections/StudioServices'
import { Manuscripts } from './collections/Manuscripts'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Partners } from './collections/Partners'
import { AdvisoryEnquiries } from './collections/forms/AdvisoryEnquiries'
import { BookstoreApplications } from './collections/forms/BookstoreApplications'
import { ContactMessages } from './collections/forms/ContactMessages'
import { ManuscriptSubmissions } from './collections/forms/ManuscriptSubmissions'
import { PartnershipEnquiries } from './collections/forms/PartnershipEnquiries'
import { emailAdapter } from './email'
import { PodcastEpisodes } from './collections/PodcastEpisodes'
import { PodcastShows } from './collections/PodcastShows'
import { PopupCampaigns } from './collections/PopupCampaigns'
import { PressMentions } from './collections/PressMentions'
import { SubmissionCalls } from './collections/SubmissionCalls'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Writers } from './collections/Writers'
import { publicDefaultFeatures } from './fields/richText'
import { pageRecords } from './globals/pageRecords'
import { ShopSettings } from './globals/ShopSettings'
import { SiteSettings } from './globals/SiteSettings'
import { guardDeletes } from './hooks/deleteGuard'
import { missingProductionSettings } from './rules/productionSettings'
import { seo } from './seo'
import { storagePlugins } from './storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Noisy Streetss admin',
    },
  },
  collections: guardDeletes([Users, Categories, Tags, Media, Manuscripts, Writers, Books, Articles, PodcastShows, PodcastEpisodes, SubmissionCalls, Awards, Events, Careers, BookClubSessions, Merch, StudioServices, MembershipPlans, Pages, Announcements, PopupCampaigns, PressMentions, Partners, ContactMessages, PartnershipEnquiries, BookstoreApplications, AdvisoryEnquiries, ManuscriptSubmissions]),
  globals: [...pageRecords, SiteSettings, ShopSettings],
  jobs: {
    access: {
      run: hasCronSecret,
      // No REST route reaches these today; this covers future server code that calls with overrideAccess: false.
      queue: ({ req }) => isStaffUser(req.user),
      cancel: ({ req }) => isStaffUser(req.user),
    },
    // In development the app runs due jobs itself every minute. In production
    // Vercel Cron calls /api/payload-jobs/run instead (see vercel.json).
    autoRun: process.env.NODE_ENV === 'production' ? [] : [{ cron: '* * * * *', queue: 'default', limit: 10 }],
  },
  onInit: (payload) => {
    if (process.env.NODE_ENV !== 'production') return
    for (const name of missingProductionSettings(process.env)) {
      payload.logger.error(`Production setting ${name} is not set.`)
    }
  },
  editor: lexicalEditor({ features: ({ defaultFeatures }) => publicDefaultFeatures(defaultFeatures) }),
  email: emailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || undefined,
  graphQL: {
    disable: true,
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [...storagePlugins(), seo],
})
