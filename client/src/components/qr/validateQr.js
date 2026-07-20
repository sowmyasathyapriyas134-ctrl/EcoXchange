export function validateQrPayload(payload, expectedPrefix) {
  if (!payload || typeof payload !== "string") return { valid: false, error: "Invalid payload" };
  if (expectedPrefix && !payload.startsWith(expectedPrefix)) {
    return { valid: false, error: `Expected prefix: ${expectedPrefix}` };
  }
  return { valid: true, data: payload };
}
