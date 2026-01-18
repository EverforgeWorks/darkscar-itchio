<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import corePrefixesRaw from '@/data/corePrefixes.json'

// --- STATE ---
const prefixData = reactive(JSON.parse(JSON.stringify(corePrefixesRaw)))
const draggedItemId = ref(null)

// We maintain a list of "Active" families.
const activeFamilyIds = ref([])

// --- INITIALIZATION ---
onMounted(() => {
  // 1. Find all unique IDs currently in the data
  const existingIds = new Set(prefixData.map((p) => p.family))

  // 2. Ensure at least Family 1 exists if data is empty
  if (existingIds.size === 0) existingIds.add(1)

  // 3. Convert to array and sort
  activeFamilyIds.value = Array.from(existingIds).sort((a, b) => a - b)
})

// --- COMPUTED ---
const groupedPrefixes = computed(() => {
  const groups = {}
  // Initialize groups for all active IDs
  activeFamilyIds.value.forEach((id) => {
    groups[id] = []
  })

  // Sort items into groups
  prefixData.forEach((p) => {
    // Safety: If an item has a family not in our active list, add it dynamically
    if (!groups[p.family]) {
      activeFamilyIds.value.push(p.family)
      activeFamilyIds.value.sort((a, b) => a - b)
      groups[p.family] = []
    }
    groups[p.family].push(p)
  })

  return groups
})

// --- ACTIONS ---
function addFamily() {
  const maxId = activeFamilyIds.value.length > 0 ? Math.max(...activeFamilyIds.value) : 0
  activeFamilyIds.value.push(maxId + 1)
}

function removeFamily(idToRemove) {
  // 1. Safety Check: Must be empty
  const count = groupedPrefixes.value[idToRemove]?.length || 0
  if (count > 0) {
    alert(
      `Cannot remove Family ${idToRemove}: It still contains ${count} prefixes.\nPlease move them to another family first.`,
    )
    return
  }

  // 2. Confirmation
  if (!confirm(`Delete Family ${idToRemove}? Higher families will shift down to fill the gap.`))
    return

  // 3. Remove from Active IDs list
  const idx = activeFamilyIds.value.indexOf(idToRemove)
  if (idx > -1) {
    activeFamilyIds.value.splice(idx, 1)
  }

  // 4. THE SHIFT: Decrement any Family ID > idToRemove

  // A. Update the Active Rows
  for (let i = 0; i < activeFamilyIds.value.length; i++) {
    if (activeFamilyIds.value[i] > idToRemove) {
      activeFamilyIds.value[i]--
    }
  }

  // B. Update the actual Data
  prefixData.forEach((p) => {
    if (p.family > idToRemove) {
      p.family--
    }
  })
}

// --- DRAG & DROP ---
function onDragStart(evt, item) {
  draggedItemId.value = item.id
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.dropEffect = 'move'
}

function onDrop(evt, targetFamilyId) {
  evt.preventDefault()
  const item = prefixData.find((p) => p.id === draggedItemId.value)
  if (item && item.family !== targetFamilyId) {
    item.family = targetFamilyId
  }
  draggedItemId.value = null
}

function saveJson() {
  // Sort by ID to keep the file deterministic
  const cleanData = [...prefixData].sort((a, b) => a.id - b.id)
  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cleanData, null, 2))
  const link = document.createElement('a')
  link.href = dataStr
  link.download = 'corePrefixes.json'
  link.click()
}

// --- HELPER ---
function formatStats(stats) {
  return [stats.primary, stats.secondary, stats.tertiary]
    .filter(Boolean)
    .map((s) => s.toUpperCase())
    .join('/')
}
</script>

<template>
  <div class="editor-layout">
    <header class="top-bar">
      <div class="title-block">
        <h3>Core Prefix Balancer</h3>
        <span class="hint"
          >Rows = Families. Drag items to rebalance. Deleting empty rows shifts families down.</span
        >
      </div>
      <div class="controls">
        <button class="action-btn" @click="addFamily">+ Add Family Row</button>
        <button class="save-btn" @click="saveJson">Download Updated JSON</button>
      </div>
    </header>

    <div class="swimlane-container">
      <div
        v-for="famId in activeFamilyIds"
        :key="famId"
        class="family-row"
        @dragover.prevent
        @dragenter.prevent
        @drop="onDrop($event, famId)"
      >
        <div class="row-header">
          <div class="row-title">Family {{ famId }}</div>
          <div class="row-meta">{{ groupedPrefixes[famId].length }} items</div>
          <button class="delete-fam-btn" @click="removeFamily(famId)" title="Remove Family">
            &times;
          </button>
        </div>

        <div class="row-content">
          <div
            v-for="prefix in groupedPrefixes[famId]"
            :key="prefix.id"
            class="prefix-card"
            draggable="true"
            @dragstart="onDragStart($event, prefix)"
          >
            <div class="card-top">
              <span class="name" :title="prefix.name">{{ prefix.name }}</span>
              <span class="id">#{{ prefix.id }}</span>
            </div>
            <div class="card-btm">
              {{ formatStats(prefix.stats) }}
            </div>
          </div>

          <div v-if="groupedPrefixes[famId].length === 0" class="empty-placeholder">
            Drop items here
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #111;
  color: #eee;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #222;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}
.title-block h3 {
  margin: 0;
  color: #eee;
  font-size: 1.1em;
}
.hint {
  color: #888;
  font-size: 0.85em;
  margin-top: 2px;
  display: block;
}

.controls {
  display: flex;
  gap: 10px;
}
.action-btn {
  background: #444;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9em;
}
.action-btn:hover {
  background: #555;
}
.save-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9em;
}
.save-btn:hover {
  background: #32c554;
}

/* SWIMLANE CONTAINER */
.swimlane-container {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ROW STYLES */
.family-row {
  display: flex;
  background: #181818;
  border: 1px solid #333;
  border-radius: 4px;
  min-height: 90px;
}

/* ROW HEADER (Left) */
.row-header {
  width: 100px;
  background: #222;
  border-right: 1px solid #333;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
  position: relative;
}
.row-title {
  font-weight: bold;
  color: #ffcc00;
  margin-bottom: 4px;
  font-size: 0.95em;
}
.row-meta {
  font-size: 0.75em;
  color: #666;
}
.delete-fam-btn {
  position: absolute;
  top: 4px;
  left: 4px;
  background: transparent;
  border: none;
  color: #552;
  font-size: 1em;
  cursor: pointer;
  line-height: 1;
  padding: 2px;
}
.delete-fam-btn:hover {
  color: #f44;
}

/* ROW CONTENT (Right) */
.row-content {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-content: flex-start;
  align-items: flex-start;
  justify-content: flex-start;
}
.row-content.drag-over {
  background: #222;
}

/* CARD STYLES */
.prefix-card {
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 3px;
  padding: 6px;

  /* STRICT SIZING */
  flex: 0 0 120px;
  width: 120px;
  max-width: 120px;

  cursor: grab;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  transition:
    transform 0.1s,
    border-color 0.2s;
}

.prefix-card:hover {
  background: #333;
  border-color: #777;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  z-index: 2;
}
.prefix-card:active {
  cursor: grabbing;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8em;
  font-weight: bold;
  color: #ddd;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
}
.card-top .name {
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-top .id {
  font-weight: normal;
  color: #666;
  font-size: 0.9em;
  margin-left: 4px;
  flex-shrink: 0;
}
.card-btm {
  font-size: 0.65em;
  color: #aaa;
  font-family: monospace;
  background: #111;
  padding: 3px;
  border-radius: 2px;
  text-align: center;
  border: 1px solid #333;
}

.empty-placeholder {
  color: #444;
  font-style: italic;
  font-size: 0.85em;
  width: 100%;
  text-align: center;
  padding: 10px;
  pointer-events: none;
}
</style>
