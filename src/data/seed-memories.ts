import type { Memory } from '@/lib/photos'

/**
 * The memories that shipped with the site, before uploads existed. These seed
 * the manifest on first read; after that the manifest is the source of truth
 * and editing this file has no effect.
 *
 * Each one holds a single photo because that is how they were originally
 * written. Newly imported memories usually hold a whole day's worth.
 * Coordinates come from each photo's original EXIF where it survived.
 */
function one(
  id: string,
  src: string,
  takenAt: string,
  coords?: { lat: number; lng: number },
): Pick<Memory, 'photos' | 'takenAt' | 'lat' | 'lng'> {
  return {
    takenAt,
    photos: [{ id: `${id}-1`, src, takenAt, ...coords }],
    ...coords,
  }
}

export const SEED_MEMORIES: Memory[] = [
  {
    id: 'featured',
    title: 'Our first moment together',
    location: 'Scottsdale, AZ',
    date: 'July 21, 2024',
    description: `This was our first official photo taken of us.
      It was a very fun and awful experience at the same time wink wink lol.
      I threw up, you ruined your shirt.
      But all in all we enjoyed our time together and we had a good night after that.`,
    category: 'special-days',
    ...one('featured', '/MainPic.png', '2024-07-21'),
  },
  {
    id: 'papago',
    title: 'Thanksgiving with the Goods',
    location: 'Papago Park, Phoenix, AZ',
    date: 'November 26, 2024',
    description: `First time meeting the Good Family during Thanksgiving.
      It was so much fun except for when you made fun of me when I slipped
      on the way down from the hike. `,
    category: 'special-days',
    ...one('papago', '/Papago.png', '2024-11-26'),
  },
  {
    id: 'dazzle',
    title: 'Razzle Dazzle at Scottsdazzle',
    location: 'Scottsdale, AZ',
    date: 'December 12, 2024',
    description: `Our first time going to Scottsdazzle together.
      We had a great time and it was a lot of fun.
      Out of all the bright shining lights,
      I think the one that stood out the most was you and your beautiful smile.`,
    category: 'special-days',
    ...one('dazzle', '/Dazzle.JPG', '2024-12-12'),
  },
  {
    id: 'lights',
    title: 'New Years with the Goods',
    location: 'Scottsdale, AZ',
    date: 'December 31, 2024',
    description: `This was such a fun night. We got to see such beautiful lights.
      Your family saw for the first time how weird and funny we are as a couple.
      Protein! Protein! Protein!`,
    category: 'special-days',
    ...one('lights', '/Lights.png', '2024-12-31'),
  },
  {
    id: 'brunch-snob',
    title: 'Brunch Snob',
    location: 'Brunch Snob, Scottsdale, AZ',
    date: 'January 12, 2025',
    description: `We went to brunch to this wonderful vibey place called Brunch Snob.
      We always wanted to eat Onion Rings and we finally we were finally able to.
      It was our last day together before I go back home :(`,
    category: 'special-days',
    ...one('brunch-snob', '/BrunchSnob.png', '2025-01-12'),
  },
  {
    id: 'chinese-new-year',
    title: 'Chinese New Year',
    location: 'San Francisco, CA',
    date: 'February 15, 2025',
    description: `Chinese New Year at San Francisco!
      Although we were not able to go to Chinatown,
      we were able to enjoy each other's company and have a good time.`,
    category: 'special-days',
    ...one('chinese-new-year', '/SFNight.png', '2025-02-15'),
  },
  {
    id: 'palace-fine-arts',
    title: 'Palace of Fine Arts',
    location: 'Palace of Fine Arts, San Francisco, CA',
    date: 'February 15, 2025',
    description: `Our magical day at the Palace of Fine Arts in San Francisco.
      The way the golden light illuminated the classical architecture,
      creating perfect silhouettes against the lagoon.
      We spent hours promenading through the colonnade and taking pictures.
      Such a romantic spot in the city.`,
    category: 'travels',
    ...one('palace-fine-arts', '/PalaceFineArts.JPG', '2025-02-15'),
  },
  {
    id: 'tea-garden',
    title: 'Japanese Tea Garden',
    location: 'Japanese Tea Garden, San Francisco, CA',
    date: 'February 17, 2025',
    description: `Our first time going to the Japanese Tea Garden together.
      We had a great time and it was a lot of fun.
      We got to see your favorite which is the Koi fish pond lol.
      There were also a lot of beautiful flowers and trees.
      It felt so peaceful and relaxing.`,
    category: 'travels',
    ...one('tea-garden', '/TeaGarden.JPG', '2025-02-17'),
  },
  {
    id: 'windmill',
    title: 'Dutch Windmill',
    location: 'Golden Gate Park, San Francisco, CA',
    date: 'March 21, 2025',
    description: `It felt so nice seeing the beautiful
      flowers blooming for the first time in Spring.
      We also got to see the Dutch Windmill and the beautiful view of the ocean.
      You were so beautiful and I fell inlove even more with you.`,
    category: 'travels',
    ...one('windmill', '/Windmill.JPG', '2025-03-21', {
      lat: 37.770295,
      lng: -122.509238,
    }),
  },
  {
    id: 'lake-beryessa',
    title: 'Lake Beryessa',
    location: 'Lake Berryessa, Napa County, CA',
    date: 'March 28, 2025',
    description: `Spontaneous walk along Lake Beryessa.
      The way the light hit your face against the calm waters
      is something I'll never forget.
      Let us not forget when we picked wildflowers and made bouqet off of them.`,
    category: 'travels',
    ...one('lake-beryessa', '/LakeBeryessa.JPG', '2025-03-28', {
      lat: 38.503617,
      lng: -122.119064,
    }),
  },
  {
    id: 'trin-bday',
    title: "Trinity's Birthday",
    location: 'Scottsdale, AZ',
    date: 'June 25, 2025',
    description: `Trinity's Birthday!
      My princess's most important day. She deserved all the love and attention.
      We spent time both with your friends and your family all throughout the day.`,
    category: 'special-days',
    ...one('trin-bday', '/TrinBday.png', '2025-06-25', {
      lat: 33.635278,
      lng: -112.234313,
    }),
  },
]

/** The memory pinned to the top of the album. */
export const FEATURED_ID = 'featured'
