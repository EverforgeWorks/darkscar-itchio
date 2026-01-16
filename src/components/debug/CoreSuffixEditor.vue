<script setup>
import { ref, reactive, computed } from 'vue'
import coreSuffixesRaw from '@/data/coreSuffixes.json'

// --- CONSTANTS ---
// Generating an array [1, 2, ..., 17] for the family toggles
const FAMILY_IDS = Array.from({ length: 17 }, (_, i) => i + 1)

// --- STATE ---
const suffixData = reactive(JSON.parse(JSON.stringify(coreSuffixesRaw)))
const selectedIndex = ref(0)
const activeSuffix = computed(() => suffixData[selectedIndex.value])

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
            v-for="id in FAMILY_IDS"
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
