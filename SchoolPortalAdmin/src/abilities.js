// abilities.ts
import { createMongoAbility } from '@casl/ability';

export function defineAbilitiesFor(rolePermissions) {
  return createMongoAbility(rolePermissions)
}
