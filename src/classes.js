import { Game, clamp, randomInt, randomColor, collision, play } from './gameState.js'

export class Bullet {
  constructor(x, y) {
    this.width = 5
    this.height = 10
    this.x = x - this.width / 2
    this.y = y - this.height
    this.speed = 980 // px/s
    this.active = true
  }

  update(dt) {
    if (!this.active) return
    this.y -= this.speed * dt
    if (this.y < -this.height) this.active = false
  }

  render() {
    if (!this.active) return
    Game.ctx.fillStyle = 'white'
    Game.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}

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

export class Enemy {
  constructor(speed, size = 50) {
    this.width = size
    this.height = size
    this.x = Math.random() * (Game.width - this.width)
    this.y = -this.height
    this.speed = speed // px/s
    this.color = randomColor()
    this.active = true
  }

  update(dt) {
    if (!this.active) return
    this.y += this.speed * dt
    if (this.y > Game.height) {
      this.active = false
    }
  }

  render() {
    if (!this.active) return
    Game.ctx.fillStyle = this.color
    Game.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}

export class Particle {
  constructor(x, y, vx, vy, life, color) {
    this.x = x; this.y = y
    this.vx = vx; this.vy = vy
    this.life = life
    this.t = 0
    this.color = color
    this.active = true
  }

  update(dt) {
    if (!this.active) return
    this.t += dt
    if (this.t >= this.life) { this.active = false; return }
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.vy += 900 * dt // tiny gravity
  }

  render() {
    if (!this.active) return
    const a = clamp(1 - this.t / this.life, 0, 1)
    Game.ctx.fillStyle = `rgba(255,220,120,${a.toFixed(3)})`
    Game.ctx.fillRect(this.x, this.y, 2, 2)
  }
}