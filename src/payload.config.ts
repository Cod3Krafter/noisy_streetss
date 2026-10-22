import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { isStaffUser } from './access'
import { hasCronSecret } from './access/jobs'
import { Articles } from './collections/Articles'
import { Books } from './collections/Books'
import { Categories } from './collections/Categories'
import { Manuscripts } from './collections/Manuscripts'
import { Media } from './collections/Media'
import { PodcastEpisodes } from './collections/PodcastEpisodes'
import { PodcastShows } from './collections/PodcastShows'
import { Tags } from './collections/Tags'
import { Users } from './collections/Users'
import { Writers } from './collections/Writers'
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
  collections: [Users, Categories, Tags, Media, Manuscripts, Writers, Books, Articles, PodcastShows, PodcastEpisodes],
  globals: [],
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
  editor: lexicalEditor(),
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
  plugins: [...storagePlugins()],
})
