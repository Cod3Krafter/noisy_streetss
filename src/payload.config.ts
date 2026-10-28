import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, type Config } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isStaffUser } from './access'
import { hideContentFromShopStaff } from './access/hideContent'
import { withStaffOnlyInternals } from './access/internalCollections'
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
import { Orders } from './collections/Orders'
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
import { withScheduledPublishAlerts } from './jobs/scheduledPublishAlerts'
import { productionSettingProblems } from './rules/productionSettings'
import { REFUSAL } from './refusal'
import { shopEndpoints } from './shop/endpoints'
import { expireOrderTask, sendShopEmailTask } from './shop/jobs'
import { seo } from './seo'
import { isLocalDatabase, schemaPushOffWarning } from './seed/guard'
import { hideStorageFieldsFromLists, storagePlugins } from './storage'

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
  // The order here is the order of the admin menu: Payload lists the groups by their first list, in
  // this order, then the groups that only hold page records and settings (globals) after them.
  // It follows spec 7.3. Nothing relies on it for deleting: the test helper and the seed's wipe use
  // src/seed/deleteOrder.ts, which works out what points at what from the fields.
  collections: guardDeletes(hideContentFromShopStaff([Books, Writers, SubmissionCalls, Awards, Articles, Categories, Tags, PodcastShows, PodcastEpisodes, Events, BookClubSessions, Careers, Announcements, PopupCampaigns, Orders, Merch, StudioServices, MembershipPlans, PressMentions, Partners, Pages, Manuscripts, ContactMessages, PartnershipEnquiries, BookstoreApplications, AdvisoryEnquiries, ManuscriptSubmissions, Media, Users])),
  globals: hideContentFromShopStaff([...pageRecords, SiteSettings, ShopSettings]),
  endpoints: shopEndpoints,
  jobs: {
    tasks: [sendShopEmailTask, expireOrderTask],
    access: {
      run: hasCronSecret,
      // No REST route reaches these today; this covers future server code that calls with overrideAccess: false.
      queue: ({ req }) => isStaffUser(req.user),
      cancel: ({ req }) => isStaffUser(req.user),
    },
    // In development the app runs due jobs itself every minute. In production
    // Vercel Cron calls /api/payload-jobs/run instead (see vercel.json). Under the
    // tests (Vitest sets VITEST) nothing runs in the background: tests that need a
    // job run it themselves with payload.jobs.run() or runByID.
    autoRun:
      process.env.NODE_ENV === 'production' || process.env.VITEST
        ? []
        : [{ cron: '* * * * *', queue: 'default', limit: 10 }],
  },
  onInit: (payload) => {
    const pushWarning = schemaPushOffWarning(process.env)
    if (pushWarning) payload.logger.warn(pushWarning)
    if (process.env.NODE_ENV !== 'production') return
    for (const problem of productionSettingProblems(process.env)) {
      // A bare name means the setting is blank; anything longer says what is wrong with it.
      payload.logger.error(/^[A-Z0-9_]+$/.test(problem) ? `Production setting ${problem} is not set.` : `Production setting problem: ${problem}.`)
    }
  },
  editor: lexicalEditor({ features: ({ defaultFeatures }) => publicDefaultFeatures(defaultFeatures) }),
  email: emailAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || undefined,
  graphQL: {
    disable: true,
  },
  // The project's own refusals are logged as a one-line note; every other error keeps Payload's defaults.
  // Payload's type lists only its own error names, so the cast is needed for this key.
  loggingLevels: { [REFUSAL]: 'info' } as unknown as Config['loggingLevels'],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Outside production the adapter would otherwise push the code's schema straight into whatever
    // DATABASE_URI names, and record a "dev" row that makes `payload migrate` refuse to run later.
    // So the push only happens on a local database; any other database (Supabase) changes only
    // through migrations.
    push: isLocalDatabase(process.env.DATABASE_URI),
  }),
  sharp,
  plugins: [...storagePlugins(), hideStorageFieldsFromLists, seo],
}).then((config) => withStaffOnlyInternals(withScheduledPublishAlerts(config)))
