import type { BskyUserFixture } from './types.js';

/** @see https://bsky.app/profile/scottnath.com */
export const scottnathCom = {
  handle: 'scottnath.com',
  actor: {
    did: 'did:plc:2rnr75zuhlsjetaaktzxvuw5',
    handle: 'scottnath.com',
    displayName: 'Scott Nath 🚫🧊',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:2rnr75zuhlsjetaaktzxvuw5/bafkreidg65ft2n5cyk7dj3nxzhrq2j7hni3kl5f63n7lkemq7dskubvdyi',
    profileUrl: 'https://bsky.app/profile/scottnath.com',
  },
  profileView: {
    did: 'did:plc:2rnr75zuhlsjetaaktzxvuw5',
    handle: 'scottnath.com',
    displayName: 'Scott Nath 🚫🧊',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:2rnr75zuhlsjetaaktzxvuw5/bafkreidg65ft2n5cyk7dj3nxzhrq2j7hni3kl5f63n7lkemq7dskubvdyi',
    createdAt: '2024-11-14T15:41:30.724Z',
  },
  welcomePost: {
    likedAt: '2026-06-26T04:58:06.336Z',
    reply: {
      uri: 'at://did:plc:2rnr75zuhlsjetaaktzxvuw5/app.bsky.feed.post/3mp62vhjcs22m',
      cid: 'bafyreienysrwudjkbm3ve6utw52ywgnjvsucz6uizmptfcdglzirgmxviq',
      text: 'do better',
      createdAt: '2026-06-26T04:05:07.681Z',
    },
  },
} satisfies BskyUserFixture;
