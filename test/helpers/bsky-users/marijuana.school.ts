import type { BskyUserFixture } from './types.js';

/** @see https://bsky.app/profile/marijuana.school */
export const marijuanaSchool = {
  handle: 'marijuana.school',
  actor: {
    did: 'did:plc:44jb7krhue245zzc4lo55m64',
    handle: 'marijuana.school',
    displayName: 'Marijuana.School',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:44jb7krhue245zzc4lo55m64/bafkreic5pk3et3j2vrpkhr7evw4cwwlrqrsmwzubcbxupxjxugqdnu6qzy',
    profileUrl: 'https://bsky.app/profile/marijuana.school',
  },
  profileView: {
    did: 'did:plc:44jb7krhue245zzc4lo55m64',
    handle: 'marijuana.school',
    displayName: 'Marijuana.School',
    avatar:
      'https://cdn.bsky.app/img/avatar/plain/did:plc:44jb7krhue245zzc4lo55m64/bafkreic5pk3et3j2vrpkhr7evw4cwwlrqrsmwzubcbxupxjxugqdnu6qzy',
    createdAt: '2026-02-07T14:16:13.044Z',
  },
  welcomePost: {
    reply: {
      uri: 'at://did:plc:44jb7krhue245zzc4lo55m64/app.bsky.feed.post/3mp7323ppbc2v',
      cid: 'bafyreifukpxf364pxvrju3bngflf3p6mxsuym44icnhlepvqktcoae3ajq',
      text: 'What is this slackiness?',
      createdAt: '2026-06-26T13:40:22.818Z',
    },
  },
} satisfies BskyUserFixture;
