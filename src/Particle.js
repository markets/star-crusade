import { Game } from './gameState.js'
import { clamp } from './utils.js'

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