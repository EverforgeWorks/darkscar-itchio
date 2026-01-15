import archetypesData from '@/data/archetypes.json'

/**
 * Calculates final stats AND the effective bonus breakdown.
 */
export function calculateCharacterStats(archetypeId, level, totalBonuses = {}) {
  const archetype = archetypesData.archetypes[archetypeId]

  if (!archetype) {
    console.error(`Archetype ID '${archetypeId}' not found!`)
    return null
  }

  // --- STEP 1: PRIMARY ATTRIBUTES ---
  const attributes = {
    str: 0,
    dex: 0,
    int: 0,
    wis: 0,
    end: 0,
  }

  // Level 1 = 0 growth applied
  const effectiveGrowthLevel = Math.max(0, level - 1)

  for (const stat of Object.keys(attributes)) {
    const base = archetype.base_attributes[stat]
    const growth = archetype.attribute_growth[stat]
    const bonus = totalBonuses[stat] || 0

    attributes[stat] = Math.floor(base + growth * effectiveGrowthLevel + bonus)
  }

  // --- STEP 2: DERIVED STATS ---
  const combatStats = {
    patk: 0,
    pdef: 0,
    matk: 0,
    mdef: 0,
    max_hp: 0,
    max_mp: 0,
    hp_regen: 0,
    mp_regen: 0,
    acc: 0,
    eva: 0,
    crit_hit: 0,
    crit_dmg: 0,
  }

  // 2a. Attribute Relations (Base + Growth + Bonus)
  for (const [primStat, value] of Object.entries(attributes)) {
    const relations = archetype.attribute_relations[primStat]
    if (relations) {
      for (const [secStat, multiplier] of Object.entries(relations)) {
        if (combatStats.hasOwnProperty(secStat)) {
          combatStats[secStat] += value * multiplier
        }
      }
    }
  }

  // 2b. Flat Bonuses
  for (const [stat, value] of Object.entries(totalBonuses)) {
    if (combatStats.hasOwnProperty(stat)) {
      combatStats[stat] += value
    }
  }

  // --- STEP 3: CALCULATE EFFECTIVE BONUSES (The Breakdown) ---
  // This separates "What comes from Gear" vs "What is Base/Growth"
  const effectiveBonuses = {}

  // 3a. Start with direct flat bonuses (e.g. +5 Str, +10 PDef)
  for (const [key, val] of Object.entries(totalBonuses)) {
    effectiveBonuses[key] = val
  }

  // 3b. Add derived bonuses from the Primary Stats on Gear
  // Example: Gear gives +5 End. We find End relations and add (5 * Multiplier) to PDef bonus.
  for (const [primStat, bonusValue] of Object.entries(totalBonuses)) {
    const relations = archetype.attribute_relations[primStat]
    if (relations) {
      for (const [secStat, multiplier] of Object.entries(relations)) {
        // Initialize if it doesn't exist yet
        if (effectiveBonuses[secStat] === undefined) effectiveBonuses[secStat] = 0

        effectiveBonuses[secStat] += bonusValue * multiplier
      }
    }
  }

  // --- STEP 4: FINAL FORMATTING & ROUNDING ---
  // Round Combat Stats
  for (const key of Object.keys(combatStats)) {
    combatStats[key] = Math.round(combatStats[key] * 10) / 10
  }

  // Round Effective Bonuses
  for (const key of Object.keys(effectiveBonuses)) {
    effectiveBonuses[key] = Math.round(effectiveBonuses[key] * 10) / 10
  }

  return {
    archetype: archetype.name,
    level: level,
    threatPerHit: archetype.threat,
    attributes: attributes, // Final Totals
    combatStats: combatStats, // Final Totals
    bonuses: effectiveBonuses, // <--- NEW: The isolated impact of equipment
  }
}
