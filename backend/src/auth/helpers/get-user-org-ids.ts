type JwtRole = {
  organizationId?: unknown;
  role?: string;
};

type JwtUser = {
  roles?: JwtRole[];
};

export function getUserOrgIds(user: JwtUser | undefined): string[] {
  if (!user?.roles?.length) return [];

  const orgIds = user.roles
    .map((role) => role.organizationId)
    .filter((organizationId): organizationId is unknown => !!organizationId)
    .map((organizationId) => String(organizationId));

  return [...new Set(orgIds)];
}
