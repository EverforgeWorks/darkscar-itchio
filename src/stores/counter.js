import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', () => {
  // GAME STATE
  const gold = ref(0)
  const playerHp = ref(100)
  
  // ACTIONS (Game Logic)
  function mineGold() {
    gold.value++
  }

  function takeDamage(amount) {
    playerHp.value -= amount
  }

  return { gold, playerHp, mineGold, takeDamage }
})