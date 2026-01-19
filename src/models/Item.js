/* src/models/Item.js */
import equipmentData from '@/data/equipmentData.json'

/**
 * @typedef {Object} ItemState
 * @property {string} uid
 * @property {string} name
 * @property {string} slot
 * @property {string} type
 * @property {string} rarity
 * @property {number} netValue
 * @property {number} cost
 * @property {Object.<string, number>} baseStats
 * @property {number} [damage]
 * @property {number} [attackSpeed]
 * @property {Array<Object>} cores
 */

// --- PURE LOGIC ---

/**
 * Calculates total stats for an item including all socketed cores.
 * @param {ItemState} item
 * @returns {Object.<string, number>}
 */
export function getItemStats(item) {
  const total = { ...item.baseStats }

  // Aggregate stats from cores
  if (item.cores && item.cores.length) {
    for (const core of item.cores) {
      if (!core.stats) continue
      for (const [stat, val] of Object.entries(core.stats)) {
        total[stat] = (total[stat] || 0) + val
      }
    }
  }

  return total
}

/**
 * Validates and sockets a core into an item.
 * @param {ItemState} item
 * @param {Object} core
 * @returns {boolean} Success
 */
export function socketCore(item, core) {
  if (!item.cores) item.cores = []

  // Rule: Max 6 Sockets
  if (item.cores.length >= 6) return false

  // Rule: No Duplicate Types (Prefix+Suffix combo)
  const isDuplicate = item.cores.some(
    (c) => c.prefixId === core.prefixId && c.suffixId === core.suffixId,
  )
  if (isDuplicate) return false

  item.cores.push(core)
  return true
}

/**
 * Formats item description for UI.
 * @param {ItemState} item
 * @returns {string[]}
 */
export function getItemDescription(item) {
  const lines = [`[${item.rarity.toUpperCase()}] ${item.name}`]

  if (item.slot === 'weapon') {
    lines.push(`Damage: ${item.damage}`)
    lines.push(`Speed: ${item.attackSpeed}`)
    const dps = (item.damage / item.attackSpeed).toFixed(1)
    lines.push(`DPS: ${dps}`)
  } else {
    lines.push(`Slot: ${item.slot.toUpperCase()}`)
    lines.push(`Type: ${item.type}`)
  }

  lines.push('--- STATS ---')
  const currentStats = getItemStats(item)
  if (Object.keys(currentStats).length > 0) {
    for (const [stat, val] of Object.entries(currentStats)) {
      lines.push(`+${val} ${stat.toUpperCase()}`)
    }
  } else {
    lines.push('(No Stats)')
  }

  if (item.cores && item.cores.length > 0) {
    lines.push('--- CORES ---')
    item.cores.forEach((core) => lines.push(`[O] ${core.name}`))
  }

  lines.push('---')
  lines.push(`Value: ${item.cost}g`)
  lines.push(`Sockets: ${item.cores ? item.cores.length : 0} / 6`)

  return lines
}
