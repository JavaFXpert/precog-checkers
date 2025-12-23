import { GameState } from './game/GameState'
import { Renderer } from './ui/Renderer'
import { Player } from './game/Board'

// Initialize the game
const gameState = new GameState(Player.Black, 5)
const renderer = new Renderer(gameState)

// Set up callbacks
gameState.setUpdateCallback(() => {
  renderer.render()
})

gameState.setAIThinkingCallback((thinking: boolean) => {
  const statusElement = document.getElementById('game-status')
  if (statusElement) {
    if (thinking) {
      statusElement.textContent = 'AI THINKING...'
      statusElement.style.animation = 'flicker 0.5s infinite'
    } else {
      statusElement.style.animation = ''
    }
  }
})

// Initial render
renderer.render()

// Show start modal to let player choose who goes first
renderer.showStartModal()

console.log('Precog Checkers initialized - Pre-Crime Gaming Division')
