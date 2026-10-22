export type Feature =
  | "multi.extraVoices"
  | "sweep.loop"
  | "sweep.pingpong"
  | "presets.custom"
  | "sharing.advanced";
export class MembershipUnavailable extends Error {}
// Capabilities are presentation hints only. Every Pro action is checked again
// against the server's current ChordLink session; this cache is not authority.
// This separate beta build is deliberately open. Never deploy it to /tools/.
export class Access {
  useFree() {}
  showsPro(_feature: Feature) {
    return true;
  }
  async refresh() {}
  async authorize(_feature: Feature): Promise<boolean> {
    return true;
  }
}
