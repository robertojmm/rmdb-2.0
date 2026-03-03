import { db } from '@db'
import { apiSources } from '@db/schema'

await db.insert(apiSources).values([
  {
    name: 'Free Movie API',
    url: 'https://imdb.iamidiotareyoutoo.com',
    needsConfiguration: false,
    configuration: null,
  },
  {
    name: 'The Movie Database (TMDB)',
    url: 'https://api.themoviedb.org/3',
    needsConfiguration: true,
    configuration: null,
  },
  {
    name: 'Open Movie Database (OMDb)',
    url: 'https://www.omdbapi.com',
    needsConfiguration: true,
    configuration: null,
  },
]).onConflictDoNothing()

console.log('Seed completed.')
