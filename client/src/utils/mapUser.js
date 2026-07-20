import { resolveAppRole } from "@/utils/role";

export function mapApiUser(u) {
  const raw = {
    id: String(u._id ?? u.id ?? ""),
    name: String(u.name ?? u.fullName ?? "User"),
    email: u.email,
    phone: u.phone ?? "",
    role: u.role,
    avatar: u.avatar,
    ecoPoints: u.ecoPoints ?? 0,
    streak: u.streakCount ?? u.streak ?? 0,
    membershipStatus: u.membershipStatus,
    address: u.address,
    membershipPlan: u.membershipPlan,
    membershipStartDate: u.membershipStartDate,
    membershipEndDate: u.membershipEndDate,
  };
  return { ...raw, role: resolveAppRole(raw) ?? raw.role };
}

export function mapSession(data) {
  return {
    user: mapApiUser(data.user),
    modelName: data.modelName,
    wallet: data.wallet,
  };
}
