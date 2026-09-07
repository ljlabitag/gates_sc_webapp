// Constant-time string comparison. The old Express code used `===`, which
// short-circuits on the first differing byte — an attacker measuring response
// timing can recover the password one character at a time. Hashing both
// inputs first normalizes them to fixed-length digests, so the XOR-accumulate
// comparison below never leaks length or content through timing, unlike a
// naive byte-by-byte compare on the raw strings.
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const aBytes = new Uint8Array(aHash);
  const bBytes = new Uint8Array(bHash);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}
