import { Game } from './gameState.js'
import { clamp, play } from './utils.js'
import { Bullet } from './Bullet.js'

export class Player {
  constructor() {
    this.width = 30
    this.height = 30
    this.x = Game.width / 2 - this.width / 2
    this.y = Game.height - this.height - 10
    this.baseSpeed = 360 // px/s
    this.speed = this.baseSpeed
    this.isMovingLeft = false
    this.isMovingRight = false
    this.isShooting = false

    // Continuous fire
    this.fireRate = 7.0 // bullets per second
    this.fireCooldown = 0 // seconds

    // Survivability
    this.lives = 3
    this.invuln = 0 // seconds of invulnerability (blink)
  }

  update(dt) {
    // Movement
    let vx = 0
    if (this.isMovingLeft) vx -= 1
    if (this.isMovingRight) vx += 1
    this.x += vx * this.speed * dt

    // Keep inside playfield
    this.x = clamp(this.x, 0, Game.width - this.width)

    // Timers
    this.fireCooldown = Math.max(0, this.fireCooldown - dt)
    this.invuln = Math.max(0, this.invuln - dt)

    // Shooting
    if (this.isShooting && this.fireCooldown === 0) {
      this.fireCooldown = 1 / this.fireRate
      Game.bullets.push(new Bullet(this.x + this.width / 2, this.y))
      play('shoot')
    }
  }

  render() {
    // Blink when invulnerable
    if (this.invuln > 0 && Math.floor(performance.now() / 100) % 2 === 0) return
    Game.ctx.drawImage(Game.playerImage, this.x, this.y, this.width, this.height)
  }

  hit() {
    if (this.invuln > 0 || Game.gameOver) return
    this.lives -= 1
    this.invuln = 1.2
    if (this.lives <= 0) {
      Game.gameOver = true
    }
  }
}