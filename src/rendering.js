import { Game } from './gameState.js'
import { play } from './utils.js'

export function render() {
  const ctx = Game.ctx
  ctx.clearRect(0, 0, Game.width, Game.height)
  renderBackground()

  Game.player.render()
  Game.enemies.forEach((e) => e.render())
  Game.bullets.forEach((b) => b.render())
  Game.particles.forEach((p) => p.render())

  // HUD
  const maxScore = parseInt(localStorage.getItem('gameScore')) || 0
  ctx.fillStyle = 'white'
  ctx.font = `20px '${Game.font}'`
  ctx.fillText(`Score ${Game.score} Record ${maxScore}`, 20, 40)

  // Lives
  ctx.font = `15px '${Game.font}'`
  ctx.fillText(`Lives ${Game.player.lives}`, 20, 70)

  // Notify new record achieved
  if (Game.score > maxScore && !Game.newMaxScore) {
    play('achievement')
    Game.newMaxScore = true
  }

  // GAME OVER
  if (Game.gameOver) {
    if (!Game.gameOverSfxPlayed) {
      play('explosion')
      Game.gameOverSfxPlayed = true
      if (Game.score > maxScore) localStorage.setItem('gameScore', String(Game.score))
      if (Game.spawnIntervalId) { clearInterval(Game.spawnIntervalId); Game.spawnIntervalId = 0 }
    }

    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, Game.width, Game.height)

    ctx.fillStyle = 'white'
    ctx.font = `40px '${Game.font}'`
    const gameOverText = 'GAME OVER'
    const g1 = ctx.measureText(gameOverText)
    ctx.fillText(gameOverText, (Game.width - g1.width) / 2, Game.height / 2 - 30)

    ctx.font = `20px '${Game.font}'`
    const restartText = 'Press R to restart'
    const g2 = ctx.measureText(restartText)
    ctx.fillText(restartText, (Game.width - g2.width) / 2, Game.height / 2 + 40)
  }

  if (Game.paused && !Game.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, Game.width, Game.height)
    ctx.fillStyle = 'white'
    ctx.font = `40px '${Game.font}'`
    const txt = 'PAUSED'
    const m = ctx.measureText(txt)
    ctx.fillText(txt, (Game.width - m.width) / 2, Game.height / 2)
  }
}

export function renderBackground() {
  const y = Math.floor(Game.backgroundY)
  Game.ctx.drawImage(Game.backgroundImage, 0, y, Game.width, Game.height + 1)
  Game.ctx.drawImage(Game.backgroundImage, 0, y - Game.height, Game.width, Game.height + 1)
}