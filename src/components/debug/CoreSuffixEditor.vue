<script setup>
import { ref, reactive, computed } from 'vue'
import coreSuffixesRaw from '@/data/coreSuffixes.json'
import corePrefixesRaw from '@/data/corePrefixes.json'
import equipmentData from '@/data/equipmentData.json'

// --- CONSTANTS & CONFIG ---
const STAT_NAMES = {
  str: 'Strength',
  dex: 'Dexterity',
  int: 'Intellect',
  wis: 'Wisdom',
  end: 'Endurance',
  patk: 'Physical Attack',
  pdef: 'Physical Defense',
  matk: 'Magical Attack',
  mdef: 'Magical Defense',
  max_hp: 'Maximum HP',
  max_mp: 'Maximum MP',
  acc: 'Accuracy',
  eva: 'Evasion',
}

// --- STATE ---
const suffixData = reactive(JSON.parse(JSON.stringify(coreSuffixesRaw)))
const selectedIndex = ref(0)
const activeSuffix = computed(() => suffixData[selectedIndex.value])

// --- DYNAMIC DATA ---
// Scan the prefixes to find which families actually exist
const availableFamilies = computed(() => {
  const uniqueFamilies = new Set(corePrefixesRaw.map((p) => p.family))
  // Sort numerically
  return Array.from(uniqueFamilies).sort((a, b) => a - b)
})

// --- ACTIONS ---
function addSuffix() {
  suffixData.push({
    id: 'new_suffix',
    name: 'of Newness',
    base_value: 1,
    families: [],
  })
  selectedIndex.value = suffixData.length - 1
}

function removeSuffix(index) {
  if (confirm('Delete this Suffix?')) {
    suffixData.splice(index, 1)
    selectedIndex.value = Math.max(0, index - 1)
  }
}

function toggleFamily(famId) {
  if (!activeSuffix.value) return
  const arr = activeSuffix.value.families
  const idx = arr.indexOf(famId)
  if (idx > -1) arr.splice(idx, 1)
  else {
    arr.push(famId)
    arr.sort((a, b) => a - b) // Keep them sorted for tidiness
  }
}

function saveJson() {
  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(suffixData, null, 2))
  const link = document.createElement('a')
  link.href = dataStr
  link.download = 'coreSuffixes.json'
  link.click()
}

// --- PREVIEW HELPERS ---
function getPrefixesForFamily(famId) {
  return corePrefixesRaw.filter((p) => p.family === famId)
}

function getPreviewText(prefix, suffix) {
  const base = suffix.base_value
  const parts = []

  const add = (statKey) => {
    if (!statKey) return
    const mult = equipmentData.stat_conversion[statKey] || 1
    const val = base * mult
    const name = STAT_NAMES[statKey] || statKey.toUpperCase()
    parts.push(`+${val} ${name}`)
  }

  add(prefix.stats.primary)
  add(prefix.stats.secondary)
  add(prefix.stats.tertiary)

  // Format: "Maul of the Marshes +2 Strength // +4 Physical Defense"
  return `${prefix.name} ${suffix.name} ${parts.join(' // ')}`
}
</script>

<template>
  <div class="editor-layout">
    <aside class="editor-sidebar">
      <h3>Core Suffixes</h3>
      <div class="list-container">
        <div
          v-for="(s, idx) in suffixData"
          :key="idx"
          class="list-item"
          :class="{ active: idx === selectedIndex }"
          @click="selectedIndex = idx"
        >
          {{ s.name }} <span class="id-tag">({{ s.id }})</span>
        </div>
      </div>
      <button class="add-btn" @click="addSuffix">+ Add Suffix</button>
      <button class="save-btn" @click="saveJson">Download JSON</button>
    </aside>

    <main class="editor-form" v-if="activeSuffix">
      <header class="form-header">
        <div class="field"><label>ID</label><input v-model="activeSuffix.id" /></div>
        <div class="field"><label>Name</label><input v-model="activeSuffix.name" /></div>
        <div class="field small">
          <label>Base Val</label><input type="number" v-model.number="activeSuffix.base_value" />
        </div>
        <button class="delete-btn" @click="removeSuffix(selectedIndex)">Delete</button>
      </header>

      <div class="section-block">
        <h3>Allowed Families</h3>
        <p class="help-text">Select which item families this suffix can generate on.</p>

        <div class="family-grid">
          <button
            v-for="id in availableFamilies"
            :key="id"
            class="toggle-btn"
            :class="{ active: activeSuffix.families.includes(id) }"
            @click="toggleFamily(id)"
          >
            {{ id }}
          </button>
        </div>

        <div class="preview-row">
          <span class="label">Current Selection:</span>
          <span class="val">[{{ activeSuffix.families.join(', ') }}]</span>
        </div>
      </div>

      <div class="section-block" v-if="activeSuffix.families.length > 0">
        <h3>Core Previews</h3>
        <p class="help-text">Expand families to see valid Prefix combinations.</p>

        <div class="preview-container">
          <details v-for="famId in activeSuffix.families" :key="famId" class="family-details" open>
            <summary>
              Family {{ famId }}
              <span class="count">({{ getPrefixesForFamily(famId).length }} Prefixes)</span>
            </summary>
            <div class="prefix-list">
              <div
                v-for="prefix in getPrefixesForFamily(famId)"
                :key="prefix.id"
                class="preview-item"
              >
                {{ getPreviewText(prefix, activeSuffix) }}
              </div>
            </div>
          </details>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  height: 100%;
  gap: 20px;
}
.editor-sidebar {
  width: 250px;
  background: #1a1a1a;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-right: 1px solid #333;
}
.list-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.list-item {
  padding: 10px;
  cursor: pointer;
  background: #222;
  border: 1px solid transparent;
}
.list-item:hover {
  background: #2a2a2a;
}
.list-item.active {
  background: #333;
  border-color: #ffcc00;
  color: #ffcc00;
}
.id-tag {
  font-size: 0.8em;
  color: #777;
}
.add-btn {
  background: #333;
  color: white;
  border: 1px solid #555;
  padding: 10px;
  cursor: pointer;
}

.editor-form {
  flex: 1;
  padding: 20px;
  background: #111;
  overflow-y: auto;
}
.form-header {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.field.small {
  flex: 0.3;
}
.field label {
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 5px;
}
.field input {
  background: #222;
  border: 1px solid #444;
  color: white;
  padding: 8px;
}

.section-block {
  margin-top: 20px;
  border: 1px solid #333;
  padding: 15px;
}
.help-text {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
  margin-top: 0;
}
.family-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}
.toggle-btn {
  background: #222;
  border: 1px solid #444;
  color: #666;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
}
.toggle-btn:hover {
  background: #333;
  color: #aaa;
}
.toggle-btn.active {
  background: #005500;
  color: #bfb;
  border-color: #00aa00;
}

.preview-row {
  font-family: monospace;
  color: #888;
  background: #000;
  padding: 10px;
  border: 1px solid #333;
}
.preview-row .label {
  color: #555;
  margin-right: 10px;
}
.preview-row .val {
  color: #afa;
}

/* NEW STYLES */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.family-details {
  background: #1a1a1a;
  border: 1px solid #333;
}
.family-details summary {
  padding: 10px;
  cursor: pointer;
  background: #222;
  font-weight: bold;
  color: #ccc;
  user-select: none;
}
.family-details summary:hover {
  background: #2a2a2a;
  color: #fff;
}
.family-details .count {
  font-weight: normal;
  color: #777;
  font-size: 0.9em;
  margin-left: 10px;
}
.prefix-list {
  padding: 10px;
  border-top: 1px solid #333;
  background: #111;
  max-height: 200px;
  overflow-y: auto;
}
.preview-item {
  font-family: 'Courier New', monospace;
  color: #aaa;
  font-size: 0.9em;
  padding: 4px 0;
  border-bottom: 1px dashed #222;
}
.preview-item:last-child {
  border-bottom: none;
}

.save-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  margin-top: auto;
}
.delete-btn {
  background: #552222;
  color: #ffaaaa;
  border: none;
  padding: 8px 15px;
  height: 35px;
  cursor: pointer;
}
</style>
