import type { BskyUserFixture } from './types.js';

/** @see https://bsky.app/profile/howspotdoing.com */
export const howspotdoingCom = {
  handle: 'howspotdoing.com',
  actor: {
    did: 'did:plc:3hlstnlnfz5ejjzpgdcinptg',
    handle: 'howspotdoing.com',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:3hlstnlnfz5ejjzpgdcinptg/bafkreibijifznkeaxhgfoi2avvqceleckw4atiyooiww23fuoaeqgtmihu',
    profileUrl: 'https://bsky.app/profile/howspotdoing.com',
  },
  profileView: {
    did: 'did:plc:3hlstnlnfz5ejjzpgdcinptg',
    handle: 'howspotdoing.com',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:3hlstnlnfz5ejjzpgdcinptg/bafkreibijifznkeaxhgfoi2avvqceleckw4atiyooiww23fuoaeqgtmihu',
    createdAt: '2026-02-07T20:12:49.444Z',
  },
  welcomePost: {
    likedAt: '2026-06-26T03:42:44.102Z',
    quote: {
      uri: 'at://did:plc:3hlstnlnfz5ejjzpgdcinptg/app.bsky.feed.post/3mp6y5gvfq22m',
      cid: 'bafyreign4vm775ix3ableytjfpzq3wapfynfkcfj2vhdzdkm6fefveeci4',
      text: '@marijuana.school see?',
      createdAt: '2026-06-26T12:48:33.975Z',
    },
  },
} satisfies BskyUserFixture;
