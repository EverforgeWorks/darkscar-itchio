import archetypesData from '@/data/archetypes.json'

/**
 * Calculates final stats by layering bonuses in the correct order.
 * Order of Operations:
 * 1. Base Attributes (from Class & Level)
 * 2. Add Primary Stat Bonuses (from Gear/Passives)
 * 3. Calculate Derived Stats (e.g. STR -> PAtk)
 * 4. Add Flat Derived Stat Bonuses (from Gear/Passives)
 */
export function calculateCharacterStats(archetypeId, level, totalBonuses = {}) {
  const archetype = archetypesData.archetypes[archetypeId]

  if (!archetype) {
    console.error(`Archetype ID '${archetypeId}' not found!`)
    return null
  }

  // --- STEP 1: CALCULATE FINAL PRIMARY ATTRIBUTES ---
  const attributes = {
    str: 0,
    dex: 0,
    int: 0,
    wis: 0,
    end: 0,
  }

  for (const stat of Object.keys(attributes)) {
    const base = archetype.base_attributes[stat]
    const growth = archetype.attribute_growth[stat]
    const bonus = totalBonuses[stat] || 0 // Explicitly grab primary stat bonus

    // Base + (Growth * Level) + Bonus
    attributes[stat] = Math.floor(base + growth * level + bonus)
  }

  // --- STEP 2: CALCULATE DERIVED STATS ---
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

  // 2a. Apply Attribute Relations (The "Ripple" Effect)
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

  // 2b. Add Flat Derived Bonuses
  // This handles things like a sword that gives "+10 Damage" (PAtk) directly,
  // without needing Strength.
  for (const [stat, value] of Object.entries(totalBonuses)) {
    // If this bonus is for a derived stat (like 'patk'), add it now.
    // We explicitly skip primary stats here because we added them in Step 1.
    if (combatStats.hasOwnProperty(stat)) {
      combatStats[stat] += value
    }
  }

  // --- STEP 3: FINAL FORMATTING ---
  // Round to 1 decimal place for cleanliness
  for (const key of Object.keys(combatStats)) {
    combatStats[key] = Math.round(combatStats[key] * 10) / 10
  }

  return {
    archetype: archetype.name,
    level: level,
    threatPerHit: archetype.threat,
    attributes: attributes, // Final STR/DEX/etc (including bonuses)
    combatStats: combatStats, // Final PAtk/HP/etc
  }
}
