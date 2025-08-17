import { Game } from './gameState.js'
import { preventDefaults } from './utils.js'

// Store gameLoop reference
let gameLoop = null

export function setupOptionsMenu(gameLoopFn) {
  gameLoop = gameLoopFn
  
  const soundBtn = document.getElementById('sound-btn')
  const restartBtn = document.getElementById('restart-btn')
  const pauseBtn = document.getElementById('pause-btn')

  // Sound button
  soundBtn.addEventListener('touchstart', (e) => { preventDefaults(e); toggleSound() })
  soundBtn.addEventListener('click', (e) => { preventDefaults(e); toggleSound() })

  // Restart button
  restartBtn.addEventListener('touchstart', (e) => { preventDefaults(e); restart() })
  restartBtn.addEventListener('click', (e) => { preventDefaults(e); restart() })

  // Pause button
  pauseBtn.addEventListener('touchstart', (e) => { preventDefaults(e); togglePause() })
  pauseBtn.addEventListener('click', (e) => { preventDefaults(e); togglePause() })
}

export function setupMobileControls() {
  const leftBtn = document.getElementById('left-btn')
  const rightBtn = document.getElementById('right-btn')
  const shootBtn = document.getElementById('shoot-btn')

  // Left
  leftBtn.addEventListener('touchstart', (e) => { preventDefaults(e); Game.player.isMovingLeft = true })
  leftBtn.addEventListener('touchend',   (e) => { preventDefaults(e); Game.player.isMovingLeft = false })
  leftBtn.addEventListener('mousedown',  (e) => { preventDefaults(e); Game.player.isMovingLeft = true })
  leftBtn.addEventListener('mouseup',    (e) => { preventDefaults(e); Game.player.isMovingLeft = false })
  leftBtn.addEventListener('mouseleave', (e) => { Game.player.isMovingLeft = false })

  // Right
  rightBtn.addEventListener('touchstart', (e) => { preventDefaults(e); Game.player.isMovingRight = true })
  rightBtn.addEventListener('touchend',   (e) => { preventDefaults(e); Game.player.isMovingRight = false })
  rightBtn.addEventListener('mousedown',  (e) => { preventDefaults(e); Game.player.isMovingRight = true })
  rightBtn.addEventListener('mouseup',    (e) => { preventDefaults(e); Game.player.isMovingRight = false })
  rightBtn.addEventListener('mouseleave', (e) => { Game.player.isMovingRight = false })

  // Shoot (hold to autofire)
  shootBtn.addEventListener('touchstart', (e) => { preventDefaults(e); Game.player.isShooting = true })
  shootBtn.addEventListener('touchend',   (e) => { preventDefaults(e); Game.player.isShooting = false })
  shootBtn.addEventListener('mousedown',  (e) => { preventDefaults(e); Game.player.isShooting = true })
  shootBtn.addEventListener('mouseup',    (e) => { preventDefaults(e); Game.player.isShooting = false })
  shootBtn.addEventListener('mouseleave', () => { Game.player.isShooting = false })
}

export function restart() {
  location.reload()
}

export function togglePause() {
  Game.paused = !Game.paused
  if (!Game.paused && !Game.gameOver) {
    // Resume loop
    Game.lastFrameTime = performance.now()
    Game.frameId = requestAnimationFrame(gameLoop)
  }
}

export function toggleSound() {
  Game.sound = !Game.sound
}