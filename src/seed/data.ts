// Dummy content for local development. Adapted from the prototype's copy in src/data/.
// Nothing here comes from the live site.

export const PHOTOS = {
  orchestra: { file: 'unsplash-1465847899084-d164df4dedc6.jpg', alt: 'Violinists performing on stage' },
  portraitGlasses: { file: 'unsplash-1472099645785-5658abf4ff4e.jpg', alt: 'Portrait of a man in glasses and a green shirt' },
  studioMic: { file: 'unsplash-1478737270239-2f02b77fc618.jpg', alt: 'A studio microphone in a dark recording room' },
  portraitJumper: { file: 'unsplash-1500648767791-00dcc994a43e.jpg', alt: 'Portrait of a man in a grey jumper' },
  portraitSmiling: { file: 'unsplash-1507003211169-0a1dd7228f2d.jpg', alt: 'Portrait of a smiling man in a white T-shirt' },
  bookStack: { file: 'unsplash-1512820790803-83ca734da794.jpg', alt: 'A stack of books on a desk' },
  concert: { file: 'unsplash-1516450360452-9312f5e86fc7.jpg', alt: 'A crowd at a concert under coloured stage lights' },
  eventHall: { file: 'unsplash-1519167758481-83f550bb49b3.jpg', alt: 'An event hall set with round tables' },
  bookTunnel: { file: 'unsplash-1532012197267-da84d127e765.jpg', alt: 'An open book framed by a tunnel of bookshelves' },
  portraitBlueLight: { file: 'unsplash-1534528741775-53994a69daeb.jpg', alt: 'Portrait of a woman in blue light' },
  openBook: { file: 'unsplash-1543002588-bfa74002ed7e.jpg', alt: 'An open book with fanned pages' },
  portraitStriped: { file: 'unsplash-1544005313-94ddf0286df2.jpg', alt: 'Portrait of a woman in a striped shirt at sunset' },
  tote: { file: 'unsplash-1544816155-12df9643f363.jpg', alt: 'A plain canvas tote bag' },
  bookOnTable: { file: 'unsplash-1544947950-fa07a98d237f.jpg', alt: 'A black poetry book on a wooden side table' },
  portraitBlazer: { file: 'unsplash-1573496359142-b8d87734a5a2.jpg', alt: 'Portrait of a smiling woman in a grey blazer' },
  podcastMic: { file: 'unsplash-1590602847861-f357a9332bbc.jpg', alt: 'A podcast microphone on a boom arm' },
  studioRoom: { file: 'unsplash-1598488035139-bdbb2231ce04.jpg', alt: 'A recording studio with guitars on the wall' },
  openBooks: { file: 'unsplash-1610116306796-6fea9f4fae38.jpg', alt: 'Open books scattered across a table' },
} as const

export type PhotoKey = keyof typeof PHOTOS

export const STAFF = [
  { email: 'admin@noisystreetss.test', password: 'admin-dev-password', name: 'Dev Admin', role: 'admin' as const },
  { email: 'editor@noisystreetss.test', password: 'editor-dev-password', name: 'Dev Editor', role: 'editor' as const },
]

export const CATEGORIES = [
  { key: 'publishing', name: 'Publishing', description: 'Behind the scenes of making books in Lagos.' },
  { key: 'culture', name: 'Culture', description: 'Essays on the city, its spaces and its people.' },
  { key: 'design', name: 'Design', description: 'Type, covers and the look of African books.' },
  { key: 'excerpts', name: 'Excerpts', description: 'Chapters from Noisy Streetss books.' },
]

export const TAGS = [
  { key: 'lagos', name: 'Lagos' },
  { key: 'printing', name: 'Printing' },
  { key: 'poetry', name: 'Poetry' },
  { key: 'interviews', name: 'Interviews' },
]

export const WRITERS: Array<{ key: string; name: string; photo?: PhotoKey; shortBio: string; showOnWritersPage?: boolean }> = [
  { key: 'modupe', name: 'Modupe Daramola', photo: 'portraitBlazer', shortBio: 'Novelist and mapmaker, writing about the shifting coastline of Lagos.' },
  { key: 'chika', name: 'Chika Alabi', photo: 'portraitBlueLight', shortBio: 'Essayist documenting the creeks and resilience of the Niger Delta.' },
  { key: 'adeoluwa', name: 'Adeoluwa Saro-Wewa', photo: 'portraitSmiling', shortBio: 'Poet of wharves, warehouses and the long roads out of Apapa.' },
  { key: 'funmilayo', name: 'Funmilayo Benson', photo: 'portraitStriped', shortBio: 'Editor of speculative anthologies from across Nigeria.' },
  { key: 'benedict', name: 'Benedict Onwudinjo', photo: 'portraitGlasses', shortBio: 'Writes on logistics, ports and the architecture of the city.' },
  { key: 'silas', name: 'Silas Oribhabor', photo: 'portraitJumper', shortBio: 'Master printer with forty years on the presses in Shomolu.' },
  { key: 'funmi', name: 'Funmi Dada', shortBio: 'Designer and editor, writing about type and African graphic language.' },
  { key: 'tomiwa', name: 'Tomiwa Ogunleye', shortBio: 'A new voice with a first novel in progress.', showOnWritersPage: false },
]

type Format = { formatName: string; priceNGN: number; inStock: boolean; weightGrams: number }

export const BOOKS: Array<{
  key: string
  title: string
  writers: string[]
  category: 'fiction' | 'poetry' | 'anthology' | 'non-fiction'
  cover: PhotoKey
  summary: string
  synopsis: string
  publishDate: string
  pageCount: number
  formats: Format[]
  sellInShop: boolean
  newRelease: boolean
  editorsChoice: boolean
}> = [
  {
    key: 'sandbars',
    title: 'The Cartographer of Sandbars',
    writers: ['modupe'],
    category: 'fiction',
    cover: 'openBook',
    summary: 'A mapmaker races dredging crews to chart the memories of a vanishing lagoon.',
    synopsis: 'Amid the shifting sandbars of the Lagos Lagoon, an eccentric mapmaker races against dredging crews to plot the memories of communities disappearing beneath new concrete.',
    publishDate: '2026-01-15',
    pageCount: 310,
    formats: [
      { formatName: 'Paperback', priceNGN: 12500, inStock: true, weightGrams: 420 },
      { formatName: 'Hardback', priceNGN: 15000, inStock: true, weightGrams: 610 },
    ],
    sellInShop: true,
    newRelease: true,
    editorsChoice: true,
  },
  {
    key: 'postOil',
    title: 'Post-Oil Ecologies',
    writers: ['chika'],
    category: 'non-fiction',
    cover: 'openBooks',
    summary: 'The creeks, furniture and design dialects of the Niger Delta after oil.',
    synopsis: 'A hybrid exploration of Niger Delta creeks, documenting the resilience of plant life, oil-drum furniture and the young people taking back their rivers.',
    publishDate: '2025-11-10',
    pageCount: 245,
    formats: [{ formatName: 'Paperback', priceNGN: 14000, inStock: false, weightGrams: 380 }],
    sellInShop: true,
    newRelease: false,
    editorsChoice: true,
  },
  {
    key: 'cocoaPort',
    title: 'Syllables of the Cocoa Port',
    writers: ['adeoluwa'],
    category: 'poetry',
    cover: 'bookOnTable',
    summary: 'Poems from the industrial rhythms of Apapa Wharf.',
    synopsis: 'A collection documenting the rhythms of Apapa Wharf, the damp of cocoa stores and the voices of lorry drivers at the customs checkpoints.',
    publishDate: '2026-03-02',
    pageCount: 96,
    formats: [{ formatName: 'Paperback', priceNGN: 8000, inStock: true, weightGrams: 180 }],
    sellInShop: true,
    newRelease: true,
    editorsChoice: false,
  },
  {
    key: 'avantGarde',
    title: 'Echoes of the Yoruba Avant-Garde',
    writers: ['funmilayo'],
    category: 'anthology',
    cover: 'bookTunnel',
    summary: 'Speculative writing that meets old spiritual systems with future Lagos.',
    synopsis: 'An anthology of speculative and multi-genre work by Nigerian writers, merging ancient spiritual systems with a cybernetic future Lagos.',
    publishDate: '2025-09-20',
    pageCount: 288,
    formats: [{ formatName: 'Paperback', priceNGN: 16000, inStock: true, weightGrams: 450 }],
    sellInShop: true,
    newRelease: false,
    editorsChoice: false,
  },
  {
    key: 'harmattan',
    title: 'Harmattan Ledger',
    writers: ['tomiwa'],
    category: 'fiction',
    cover: 'bookStack',
    summary: 'A first novel, coming soon: a clerk keeps the accounts of a dusty season.',
    synopsis: 'A junior clerk in a Kano trading house keeps a secret second ledger through one long harmattan.',
    publishDate: '2026-12-01',
    pageCount: 240,
    formats: [],
    sellInShop: false,
    newRelease: false,
    editorsChoice: false,
  },
  {
    key: 'shomoluLetters',
    title: 'Letters from Shomolu',
    writers: ['silas', 'funmi'],
    category: 'non-fiction',
    cover: 'openBooks',
    summary: 'A printer and a designer trade letters about making books by hand.',
    synopsis: 'Forty years of presswork and a young designer’s questions, in letters exchanged across one year in the Shomolu print district.',
    publishDate: '2026-10-01',
    pageCount: 180,
    formats: [{ formatName: 'Paperback', priceNGN: 9500, inStock: true, weightGrams: 300 }],
    sellInShop: true,
    newRelease: true,
    editorsChoice: false,
  },
]

export const ARTICLES: Array<{
  title: string
  summary: string
  paragraphs: string[]
  writers: string[]
  categories: string[]
  tags: string[]
  cover: PhotoKey
  featured: boolean
  /** Negative for the past. The scheduled article uses a future date. */
  publishInDays: number
  state: 'published' | 'draft' | 'scheduled'
}> = [
  { title: 'How Books Get Printed in the Storm', summary: 'The material realities of presswork in Lagos.', paragraphs: ['To publish a book in Nigeria is to negotiate with diesel engines, humidity and the price of ink rollers.', 'This friction is exactly why the books hold their weight.'], writers: ['modupe'], categories: ['publishing'], tags: ['printing', 'lagos'], cover: 'bookStack', featured: true, publishInDays: -40, state: 'published' },
  { title: 'The Architecture of the Lagos Verandah', summary: 'A study in social space and editorial solitude.', paragraphs: ['The verandah is where the street and the house negotiate.', 'Writers have always needed a place that is half in and half out.'], writers: ['benedict'], categories: ['culture'], tags: ['lagos'], cover: 'eventHall', featured: true, publishInDays: -35, state: 'published' },
  { title: 'Beyond the Cheetah Print Cliche', summary: 'Forging a modern African graphic language.', paragraphs: ['Book covers from the continent are too often dressed in borrowed patterns.', 'A new graphic language starts with the letters themselves.'], writers: ['funmi'], categories: ['design'], tags: [], cover: 'bookTunnel', featured: true, publishInDays: -30, state: 'published' },
  { title: 'Excerpt: The Cartographer of Sandbars', summary: 'The first chapter of Modupe Daramola’s novel.', paragraphs: ['The lagoon had moved again in the night.', 'By morning the map was already wrong.'], writers: ['modupe'], categories: ['excerpts'], tags: [], cover: 'openBook', featured: false, publishInDays: -28, state: 'published' },
  { title: 'Excerpt: Post-Oil Ecologies', summary: 'A chapter on the furniture of the creeks.', paragraphs: ['Every oil drum in the delta has had three lives.', 'The third is usually a chair.'], writers: ['chika'], categories: ['excerpts'], tags: [], cover: 'openBooks', featured: false, publishInDays: -25, state: 'published' },
  { title: 'Excerpt: Syllables of the Cocoa Port', summary: 'Three poems from the collection.', paragraphs: ['Wharf light, then the slow arithmetic of cranes.'], writers: ['adeoluwa'], categories: ['excerpts'], tags: ['poetry'], cover: 'bookOnTable', featured: false, publishInDays: -21, state: 'published' },
  { title: 'Excerpt: Echoes of the Yoruba Avant-Garde', summary: 'The anthology’s opening story.', paragraphs: ['The oracle answered in binary, which surprised no one.'], writers: ['funmilayo'], categories: ['excerpts'], tags: [], cover: 'bookTunnel', featured: false, publishInDays: -18, state: 'published' },
  { title: 'Mapping Memories of Coastal Lagos', summary: 'How sandbars and tides reshape community history.', paragraphs: ['Coastal communities keep their history in landmarks that move.'], writers: ['modupe'], categories: ['culture'], tags: ['lagos'], cover: 'openBook', featured: false, publishInDays: -14, state: 'published' },
  { title: 'The Heidelberg Press and Industrial Resilience', summary: 'Silas Oribhabor on keeping offset presses running.', paragraphs: ['A press that is fifty years old has outlived three currencies.'], writers: ['silas'], categories: ['publishing'], tags: ['printing', 'interviews'], cover: 'bookStack', featured: false, publishInDays: -10, state: 'published' },
  { title: 'Recording in the Dynamic City', summary: 'Building quiet audio booths in a loud city.', paragraphs: ['Silence in Lagos has to be built, layer by layer.'], writers: ['benedict'], categories: ['culture'], tags: ['interviews'], cover: 'studioMic', featured: false, publishInDays: -6, state: 'published' },
  { title: 'Notes from a Book Fair', summary: 'An unfinished report from the stalls.', paragraphs: ['Draft: notes still to be written up.'], writers: ['funmi'], categories: ['publishing'], tags: [], cover: 'eventHall', featured: false, publishInDays: -1, state: 'draft' },
  { title: 'Designing a Book Jacket in Yaba', summary: 'From first sketch to final proof.', paragraphs: ['Every jacket starts as a pencil line on the back of a proof.'], writers: ['funmi'], categories: ['design'], tags: [], cover: 'bookStack', featured: false, publishInDays: 7, state: 'scheduled' },
]

export const PODCAST_SHOWS = [
  { key: 'conversations', name: 'Noisy Conversations', description: 'Writers in conversation about the work.', cover: 'podcastMic' as PhotoKey, spotifyUrl: 'https://open.spotify.com/show/dummy-conversations' },
  { key: 'sessions', name: 'Shomolu Sessions', description: 'Readings recorded in the studio.', cover: 'studioMic' as PhotoKey, youtubeUrl: 'https://www.youtube.com/@dummy-shomolu-sessions' },
]

export const PODCAST_EPISODES: Array<{
  show: string
  title: string
  episodeNumber: number
  daysAgo: number
  summary: string
  spotifyUrl?: string
  youtubeUrl?: string
  guests: string[]
  lengthMinutes: number
}> = [
  { show: 'conversations', title: 'Mapping a Moving City', episodeNumber: 1, daysAgo: 60, summary: 'Modupe Daramola on maps, memory and the lagoon.', spotifyUrl: 'https://open.spotify.com/episode/dummy-1', youtubeUrl: 'https://www.youtube.com/watch?v=dummy1', guests: ['modupe'], lengthMinutes: 48 },
  { show: 'conversations', title: 'Poems from the Wharf', episodeNumber: 2, daysAgo: 45, summary: 'Adeoluwa Saro-Wewa reads and talks about Apapa.', spotifyUrl: 'https://open.spotify.com/episode/dummy-2', guests: ['adeoluwa'], lengthMinutes: 37 },
  { show: 'conversations', title: 'Editing the Future', episodeNumber: 3, daysAgo: 30, summary: 'Funmilayo Benson on putting an anthology together.', spotifyUrl: 'https://open.spotify.com/episode/dummy-3', youtubeUrl: 'https://www.youtube.com/watch?v=dummy3', guests: ['funmilayo'], lengthMinutes: 52 },
  { show: 'sessions', title: 'Session One: The Lagoon', episodeNumber: 1, daysAgo: 50, summary: 'A reading from The Cartographer of Sandbars.', youtubeUrl: 'https://www.youtube.com/watch?v=dummy4', guests: ['modupe'], lengthMinutes: 22 },
  { show: 'sessions', title: 'Session Two: The Delta', episodeNumber: 2, daysAgo: 20, summary: 'A reading from Post-Oil Ecologies.', spotifyUrl: 'https://open.spotify.com/episode/dummy-5', youtubeUrl: 'https://www.youtube.com/watch?v=dummy5', guests: ['chika'], lengthMinutes: 25 },
  { show: 'sessions', title: 'Session Three: The Press', episodeNumber: 3, daysAgo: 5, summary: 'Silas Oribhabor at the Heidelberg.', spotifyUrl: 'https://open.spotify.com/episode/dummy-6', youtubeUrl: 'https://www.youtube.com/watch?v=dummy6', guests: ['silas'], lengthMinutes: 31 },
]

export const SUBMISSION_CALLS = [
  { key: 'open', title: 'Lagos After Dark', themeSummary: 'Stories and poems set in the city at night.', opensInDays: -10, closesInDays: 20, cover: 'concert' as PhotoKey },
  { key: 'upcoming', title: 'Water and Memory', themeSummary: 'Writing about rivers, lagoons and the sea.', opensInDays: 15, closesInDays: 45, cover: 'openBook' as PhotoKey },
  { key: 'closed', title: 'City of Noise', themeSummary: 'The sound of Nigerian cities on the page.', opensInDays: -60, closesInDays: -30, cover: 'concert' as PhotoKey },
]

export const EVENTS = [
  { title: 'Book launch: Letters from Shomolu', startsInDays: 7, hours: 3, venue: 'The Shomolu print room', image: 'eventHall' as PhotoKey, actionLabel: 'Reserve a seat' },
  { title: 'Writers’ workshop in the Surulere courtyard', startsInDays: 21, hours: 5, venue: 'Surulere courtyard', image: 'bookTunnel' as PhotoKey, actionLabel: 'Book a place' },
  { title: 'Poetry night', startsInDays: -14, hours: 3, venue: 'Yaba studio', image: 'concert' as PhotoKey, actionLabel: 'See photos' },
]

export const MERCH = [
  { title: 'Official Noisy Canvas Tote Bag', images: ['tote'] as PhotoKey[], description: 'Heavy cotton canvas, screen-printed in deep indigo.', priceNGN: 12000, inStock: true, weightGrams: 300, type: 'apparel' as const },
  { title: 'The Shomolu Hardbound Sketchbook', images: ['bookStack'] as PhotoKey[], description: 'Handbound in Lagos. 160 pages of heavy drawing paper with a lay-flat spine.', priceNGN: 10000, inStock: true, weightGrams: 450, type: 'stationery' as const },
  { title: 'Noisy Streetss Pocket Notebook', images: ['openBooks'] as PhotoKey[], description: 'A slim lined notebook for the commute.', priceNGN: 4000, inStock: true, weightGrams: 120, type: 'stationery' as const },
  { title: 'Reader’s Cap', images: ['tote'] as PhotoKey[], description: 'A soft cotton cap. Back soon.', priceNGN: 7000, inStock: false, weightGrams: 150, type: 'apparel' as const },
]

export const STUDIO_SERVICES = [
  { name: 'Vocal booth', description: 'A treated booth for voice-overs and vocals.', hourlyRateNGN: 15000, inclusions: ['Condenser microphone', 'Engineer for the first hour'], images: ['studioMic'] as PhotoKey[], sortOrder: 1 },
  { name: 'Podcast recording', description: 'Two-person podcast set-up with video.', halfDayRateNGN: 45000, fullDayRateNGN: 80000, inclusions: ['Two microphones', 'Two cameras', 'Basic edit'], images: ['podcastMic'] as PhotoKey[], sortOrder: 2 },
  { name: 'Mixing and mastering', description: 'Finishing for music and spoken word.', hourlyRateNGN: 20000, inclusions: ['Two rounds of changes'], images: ['studioRoom'] as PhotoKey[], sortOrder: 3 },
  { name: 'Full studio day', description: 'The whole studio, with an engineer, for a day.', fullDayRateNGN: 120000, inclusions: ['Live room', 'Control room', 'Engineer'], images: ['studioRoom'] as PhotoKey[], sortOrder: 4 },
]

export const MEMBERSHIP_PLANS = [
  { name: 'Reader', priceNGN: 5000, billing: 'monthly' as const, perks: ['20% off books', 'Book Club registration'], sortOrder: 1 },
  { name: 'Patron', priceNGN: 50000, billing: 'yearly' as const, perks: ['20% off books', 'Book Club registration', 'Studio booking history'], sortOrder: 2 },
  { name: 'Friend of the Press', priceNGN: 2500, billing: 'monthly' as const, perks: ['20% off books'], sortOrder: 3 },
]

export const LEGAL_PLACEHOLDER = "Placeholder: replace with the client's policy."

export const BASIC_PAGES = [
  { title: 'Privacy policy', slug: 'privacy-policy', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Terms of use', slug: 'terms', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Shop terms', slug: 'shop-terms', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Cookie policy', slug: 'cookies', paragraphs: [LEGAL_PLACEHOLDER] },
  { title: 'Values', slug: 'values', paragraphs: ['Dummy text: the values copy is still to come from the client.'] },
]

export const PRESS_MENTIONS = [
  { outlet: 'The Lagos Review', headline: 'A small press with a loud voice', daysAgo: 90 },
  { outlet: 'Culture Desk Weekly', headline: 'Inside the Shomolu print room', daysAgo: 60 },
  { outlet: 'Pages Africa', headline: 'Five presses to watch this year', daysAgo: 40 },
  { outlet: 'City Radio', headline: 'Noisy Streetss on publishing in Lagos', daysAgo: 15 },
]

export const PARTNERS = [
  { name: 'Lagos Book Fair', quote: 'A brilliant stall every year.', quoteBy: 'Dummy Organiser', quoteByTitle: 'Fair director' },
  { name: 'Surulere Arts Trust', quote: 'Reliable and imaginative partners.', quoteBy: 'Dummy Trustee', quoteByTitle: 'Programme lead' },
  { name: 'Yaba Design School' },
  { name: 'Ibadan Writers’ Workshop' },
]

/** Heading and intro for each page record. */
export const PAGE_COPY: Record<string, { heading: string; intro: string; heroImage?: PhotoKey }> = {
  'page-home': { heading: 'Literature from the streets of Lagos', intro: 'Dummy text: a journal, a press, a studio and a podcast.', heroImage: 'bookTunnel' },
  'page-publishing': { heading: 'Publishing', intro: 'Dummy text: books made in Lagos.', heroImage: 'openBooks' },
  'page-writers': { heading: 'Our Writers', intro: 'Dummy text: the writers behind the books.' },
  'page-submissions': { heading: 'Submissions', intro: 'Dummy text: how to send work.' },
  'page-awards': { heading: 'Awards', intro: 'Dummy text: prizes run by Noisy Streetss.' },
  'page-advisory': { heading: 'Advisory', intro: 'Dummy text: publishing advice for writers and organisations.' },
  'page-distribution': { heading: 'Distribution', intro: 'Dummy text: getting books into stores.' },
  'page-studio': { heading: 'Studio', intro: 'Dummy text: a recording studio in Lagos.', heroImage: 'studioRoom' },
  'page-blog': { heading: 'Blog', intro: 'Dummy text: essays, excerpts and notes.' },
  'page-podcast': { heading: 'Podcast', intro: 'Dummy text: conversations and readings.', heroImage: 'podcastMic' },
  'page-shop': { heading: 'Shop', intro: 'Dummy text: books and merch, delivered across Nigeria.' },
  'page-book-club': { heading: 'Book Club', intro: 'Dummy text: read along with other members.' },
  'page-membership': { heading: 'Membership', intro: 'Dummy text: support the press and save on books.' },
  'page-events': { heading: 'Events', intro: 'Dummy text: launches, readings and workshops.', heroImage: 'eventHall' },
  'page-careers': { heading: 'Careers', intro: 'Dummy text: work with Noisy Streetss.' },
  'page-who-we-are': { heading: 'Who We Are', intro: 'Dummy text: the story of the press.' },
  'page-press': { heading: 'Press', intro: 'Dummy text: what others have written.' },
  'page-contact': { heading: 'Contact', intro: 'Dummy text: get in touch.' },
  'page-partner': { heading: 'Partner with Noisy Streetss', intro: 'Dummy text: sponsorship, media and events.' },
  'page-support': { heading: 'Support', intro: 'Dummy text: ways to support the press.' },
}
