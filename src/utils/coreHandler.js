import corePrefixes from '@/data/corePrefixes.json'
import coreSuffixes from '@/data/coreSuffixes.json'
import equipmentData from '@/data/equipmentData.json'
import { Core } from '@/models/Core'

export function createCore(prefixId, suffixId) {
  const prefix = corePrefixes.find((p) => p.id === prefixId)
  const suffix = coreSuffixes.find((s) => s.id === suffixId)

  if (!prefix || !suffix) return null

  // Validate Family
  if (!suffix.families.includes(prefix.family)) {
    console.warn(`Mismatch: ${prefix.name} cannot match with ${suffix.name}`)
    return null
  }

  // Calculate Stats
  const baseVal = suffix.base_value
  const conversion = equipmentData.stat_conversion
  const calculatedStats = {}

  const addStat = (statName) => {
    if (!statName) return
    const multiplier = conversion[statName] || 1
    calculatedStats[statName] = baseVal * multiplier
  }

  addStat(prefix.stats.primary)
  addStat(prefix.stats.secondary)
  addStat(prefix.stats.tertiary)

  // Return new Model Instance
  return new Core({
    uid: crypto.randomUUID(),
    name: `${prefix.name} ${suffix.name}`,
    prefixId: prefix.id,
    suffixId: suffix.id,
    familyId: prefix.family,
    baseValue: baseVal,
    stats: calculatedStats,
  })
}
