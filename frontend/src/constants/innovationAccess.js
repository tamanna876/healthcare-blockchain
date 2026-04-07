const DEFAULT_ALLOWED_ROLES = ['Doctor', 'Hospital', 'Admin']

function normalizeRole(role) {
  if (!role || typeof role !== 'string') return null
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

export function getInnovationAllowedRoles() {
  const raw = import.meta.env.VITE_INNOVATION_ALLOWED_ROLES
  if (!raw) return DEFAULT_ALLOWED_ROLES

  const parsed = raw
    .split(',')
    .map((item) => normalizeRole(item.trim()))
    .filter(Boolean)

  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ROLES
}

export function canAccessInnovation(role) {
  const normalized = normalizeRole(role)
  if (!normalized) return false
  return getInnovationAllowedRoles().includes(normalized)
}
