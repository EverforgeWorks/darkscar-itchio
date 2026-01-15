import equipmentData from '@/data/equipmentData.json'
import itemPrefixes from '@/data/itemPrefixes.json'
import { generateId } from '@/utils/uuid'

/**
 * Generates a specific piece of equipment.
 * @param {string} prefixId - ID from itemPrefixes
 * @param {number} contentIndex - Index in the prefix's 'contents' array
 * @param {string} rarity - 'mundane', 'artisan', 'rare', 'legendary'
 * @param {number|null} forcedStatCount - If set, overrides the random 0-4 roll
 */
export function generateItem(prefixId, contentIndex, rarity = 'mundane', forcedStatCount = null) {
  const prefix = itemPrefixes.find((p) => p.id === prefixId)
  if (!prefix) return null

  const template = prefix.contents[contentIndex]
  if (!template) return null

  const rules = equipmentData

  // 1. Base Values
  const rarityMult = rules.rarity_mults[rarity]
  const rarityBase = prefix.base_value * rarityMult

  // 2. Type Multipliers
  let typeMult = 1
  let isWeapon = false
  let subtypeStats = null

  if (rules.material_mults[template.type]) {
    typeMult = rules.material_mults[template.type]
  } else if (rules.subtype_data[template.type]) {
    isWeapon = true
    subtypeStats = rules.subtype_data[template.type]
    typeMult = subtypeStats.value_mult
  }

  const netValue = Math.ceil(rarityBase * typeMult)
  const cost = netValue * prefix.cost_mod

  // 3. Construct Object
  const item = {
    uid: generateId(),
    name: `${prefix.name} ${template.name}`,
    slot: template.slot,
    type: template.type,
    rarity: rarity,
    netValue: netValue,
    cost: cost,
    stats: {},
  }

  if (isWeapon) {
    item.damage = Math.round(netValue * subtypeStats.dmg_mult)
    item.attackSpeed = subtypeStats.speed
  }

  // 4. Generate Stats
  // Use forced count if provided, otherwise random 0-4
  let statCount = forcedStatCount !== null ? forcedStatCount : Math.floor(Math.random() * 5)

  if (statCount > 0) {
    const availableStats = Object.keys(rules.stat_conversion)
    const pickedStats = []

    // Simple no-duplicate logic
    while (pickedStats.length < statCount) {
      const randomStat = availableStats[Math.floor(Math.random() * availableStats.length)]
      if (!pickedStats.includes(randomStat)) {
        pickedStats.push(randomStat)
      }
    }

    pickedStats.forEach((statKey) => {
      const conversionMult = rules.stat_conversion[statKey]
      item.stats[statKey] = netValue * conversionMult
    })
  }

  return item
}
