/**
 * Music playlist registry.
 *
 * Single source of truth for the tracks listed in the Music app. Kept
 * colocated with the app (mirroring Safari's `projects.ts` and Notes'
 * `notes-list.ts`) because the shape is Music-specific chrome — none of
 * this is real audio and none of it needs to be shared with other apps.
 *
 * The playlist is a nod to the "slightly chaotic mix of metal, techno,
 * rap, and hyperpop" line in the About Me note; edit freely.
 */

export interface Track {
  title: string;
  artist: string;
  /** Display-only duration (`m:ss`). Nothing actually plays. */
  duration: string;
}

export const PLAYLIST: Track[] = [
  { title: 'Nemesis',            artist: 'David Guetta',     duration: '3:24' },
  { title: 'Hold On',            artist: 'Extra Terra',      duration: '3:24' },
  { title: 'Bezier',             artist: 'Omtil',            duration: '6:32' },
  { title: 'Prismatic Heart',    artist: 'Camellia',         duration: '6:05' },
  { title: 'Don\u2019t Ask',     artist: '2hollis',          duration: '2:22' },
  { title: 'Lunar Disco',        artist: 'Omtil',            duration: '3:53' },
  { title: 'Supa Dupa Skr',      artist: 'Luciano',          duration: '1:58' },
  { title: 'Wyrmhole',           artist: 'Periphery',        duration: '7:17' },
];
