<script setup>
import { ref, watch } from 'vue'
import { createNewCharacter } from '@/utils/characterFactory'
import archetypesData from '@/data/archetypes.json'

// --- STATE ---
const selectedArchetype = ref('martyr') // Default selection
const character = ref(null)
const tooltipItem = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

// Get list of archetypes for the dropdown
const archetypeList = Object.keys(archetypesData.archetypes)

// --- ACTIONS ---
function generateCharacter() {
  // Uses your factory to build a Lv.1 Character with Starting Kit
  character.value = createNewCharacter('Preview', selectedArchetype.value)
}

// Re-generate whenever dropdown changes
watch(
  selectedArchetype,
  () => {
    generateCharacter()
  },
  { immediate: true },
)

// --- TOOLTIP LOGIC ---
function showTooltip(item, event) {
  if (!item) return
  tooltipItem.value = item
  tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 }
}

function hideTooltip() {
  tooltipItem.value = null
}

function updateTooltip(event) {
  if (tooltipItem.value) {
    tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 }
  }
}
</script>

<template>
  <div class="container" @mousemove="updateTooltip">
    <header>
      <h1>Darkscar Previewer</h1>
      <div class="controls">
        <label>Select Class: </label>
        <select v-model="selectedArchetype">
          <option v-for="key in archetypeList" :key="key" :value="key">
            {{ archetypesData.archetypes[key].name }}
          </option>
        </select>
        <button @click="generateCharacter">Reroll Gear</button>
      </div>
    </header>

    <div v-if="character" class="character-sheet">
      <div class="panel attributes">
        <h2>Primary Stats</h2>
        <div class="stat-row" v-for="(val, stat) in character.currentStats.attributes" :key="stat">
          <span class="label">{{ stat.toUpperCase() }}</span>
          <span class="value">{{ val }}</span>
        </div>

        <div class="separator"></div>

        <h2>Combat Stats</h2>
        <div class="stat-row" v-for="(val, stat) in character.currentStats.combatStats" :key="stat">
          <template v-if="val > 0 || stat.includes('hp')">
            <span class="label">{{ stat.replace('_', ' ').toUpperCase() }}</span>
            <span class="value">{{ val }}</span>
          </template>
        </div>
      </div>

      <div class="panel equipment">
        <h2>Equipment</h2>
        <div class="paper-doll">
          <div
            v-for="slot in [
              'head',
              'shoulders',
              'chest',
              'arms',
              'hands',
              'waist',
              'legs',
              'feet',
              'weapon',
            ]"
            :key="slot"
            class="slot"
            :class="{ empty: !character.equipment[slot] }"
            @mouseenter="showTooltip(character.equipment[slot], $event)"
            @mouseleave="hideTooltip"
          >
            <div class="slot-name">{{ slot }}</div>
            <div v-if="character.equipment[slot]" class="item-icon">
              {{ character.equipment[slot].name }}
            </div>
            <div v-else class="placeholder">Empty</div>
          </div>
        </div>
      </div>

      <div class="panel details">
        <h2>Details</h2>
        <p><strong>Name:</strong> {{ character.name }}</p>
        <p><strong>Level:</strong> {{ character.level }}</p>
        <p><strong>Threat:</strong> {{ character.currentStats.threatPerHit }}</p>
        <hr />
        <p class="description">{{ archetypesData.archetypes[selectedArchetype].description }}</p>
      </div>
    </div>

    <div
      v-if="tooltipItem"
      class="tooltip"
      :style="{ top: tooltipPos.y + 'px', left: tooltipPos.x + 'px' }"
    >
      <div
        v-for="(line, i) in tooltipItem.description"
        :key="i"
        :class="{ 'tooltip-header': i === 0 }"
      >
        {{ line }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Courier New', Courier, monospace;
  color: #e0e0e0;
  background-color: #1a1a1a;
  min-height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #444;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.character-sheet {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
}

.panel {
  background: #252525;
  padding: 20px;
  border: 1px solid #444;
  border-radius: 8px;
}

h2 {
  margin-top: 0;
  border-bottom: 1px solid #555;
  padding-bottom: 10px;
  color: #ffcc00;
}

/* Attributes Styles */
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
}
.stat-row:hover {
  background: #333;
}
.separator {
  margin: 15px 0;
  border-top: 1px dashed #555;
}

/* Equipment Styles */
.paper-doll {
  display: grid;
  gap: 10px;
}
.slot {
  background: #111;
  border: 1px solid #555;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: help;
  transition: border-color 0.2s;
}
.slot:hover {
  border-color: #ffcc00;
}
.slot.empty {
  opacity: 0.5;
  border-style: dashed;
}
.slot-name {
  font-size: 0.8em;
  color: #888;
  text-transform: uppercase;
}
.item-icon {
  color: #aaffaa; /* Green for items */
  font-weight: bold;
}

/* Tooltip Styles */
.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #777;
  padding: 15px;
  pointer-events: none;
  z-index: 1000;
  white-space: pre-wrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  font-size: 0.9em;
}
.tooltip-header {
  font-weight: bold;
  color: #ffcc00;
  margin-bottom: 5px;
  border-bottom: 1px solid #555;
  padding-bottom: 5px;
}
</style>
