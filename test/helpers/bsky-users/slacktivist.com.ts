import type { BskyUserFixture } from './types.js';

/** @see https://bsky.app/profile/slacktivist.com — author of the welcome skeet. */
export const slacktivistCom = {
  handle: 'slacktivist.com',
  actor: {
    did: 'did:plc:oo5ar6gz52vqqgqhabc7jdqu',
    handle: 'slacktivist.com',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:oo5ar6gz52vqqgqhabc7jdqu/bafkreihpxfurphvwqv6qfhgbpvt3vbn3covhpow6v3dankmkqutrb3xbym',
    profileUrl: 'https://bsky.app/profile/slacktivist.com',
  },
  profileView: {
    did: 'did:plc:oo5ar6gz52vqqgqhabc7jdqu',
    handle: 'slacktivist.com',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:oo5ar6gz52vqqgqhabc7jdqu/bafkreihpxfurphvwqv6qfhgbpvt3vbn3covhpow6v3dankmkqutrb3xbym',
    createdAt: '2026-06-08T04:10:25.562Z',
  },
  welcomePost: {
    likedAt: '2026-06-26T03:37:22.046Z',
  },
} satisfies BskyUserFixture;
