// ============================================
// STAR CRUSADE - Refactored with better organization
// ============================================

// ============================================
// GAME STATE
// ============================================
const Game = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  dpr: 1,
  sound: false,
  player: null,
  enemies: [],
  bullets: [],
  particles: [],
  score: 0,
  newMaxScore: false,
  gameOver: false,
  gameOverSfxPlayed: false,
  paused: false,
  backgroundImage: new Image(),
  backgroundY: 0,
  backgroundSpeed: 140,
  interval: 0,
  lastFrameTime: 0,
  frameId: 0,
  spawnIntervalId: 0,
  font: 'Press Start 2P',
  playerImage: new Image()
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function randomInt(min, max) {
  const diff = Math.max(0, max - min)
  return Math.floor(Math.random() * diff) + min
}

function randomColor() {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`
}

function collision(a, b) {
  return (a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y)
}

function play(sound, volume = 0.2) {
  const audio = document.getElementById(sound)
  audio.volume = Game.sound ? volume : 0
  if (!audio.loop) audio.currentTime = 0
  audio.play()
}

function preventDefaults(e) {
  e.preventDefault()
  e.stopPropagation()
}

function preventSpaceScroll(e) {
  if (e.target === document.body) e.preventDefault()
}

// ============================================
// GAME CLASSES
// ============================================
class Player {
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

class Enemy {
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

class Bullet {
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

class Particle {
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

// ============================================
// CONTROLS AND UI
// ============================================
function setupOptionsMenu() {
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

function setupMobileControls() {
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

function restart() {
  location.reload()
}

function togglePause() {
  Game.paused = !Game.paused
  if (!Game.paused && !Game.gameOver) {
    // Resume loop
    Game.lastFrameTime = performance.now()
    Game.frameId = requestAnimationFrame(gameLoop)
  }
}

function toggleSound() {
  Game.sound = !Game.sound
}

// ============================================
// GAME LOGIC
// ============================================
function spawnEnemies() {
  if (Game.paused || Game.gameOver) return
  Game.interval++

  // Difficulty scaling by elapsed "intervals"
  let maxEnemies = Math.round(clamp(Game.interval / 10, 1, 40))
  let maxSpeed = clamp(120 + Game.interval * 10, 120, 600) // px/s
  let maxSize = clamp(40 + Game.interval * 10, 50, 200)

  for (let i = 0; i < maxEnemies; i++) {
    const speed = randomInt(80, maxSpeed)
    const size = randomInt(30, maxSize)
    Game.enemies.push(new Enemy(speed, size))
  }
}

function update(dt) {
  Game.player.update(dt)
  Game.enemies.forEach((e) => e.update(dt))
  Game.bullets.forEach((b) => b.update(dt))
  Game.particles.forEach((p) => p.update(dt))

  // Bullet–Enemy collisions
  for (let bi = 0; bi < Game.bullets.length; bi++) {
    const b = Game.bullets[bi]
    if (!b.active) continue
    for (let ei = 0; ei < Game.enemies.length; ei++) {
      const e = Game.enemies[ei]
      if (!e.active) continue
      if (collision(b, e)) {
        b.active = false
        e.active = false
        Game.score += 10
        // Spawn small burst of particles
        spawnHitParticles(e.x + e.width / 2, e.y + e.height / 2, 10)
        break
      }
    }
  }

  // Player–Enemy collisions
  for (const e of Game.enemies) {
    if (!e.active) continue

    if (collision({ x: Game.player.x, y: Game.player.y, width: Game.player.width, height: Game.player.height }, e)) {
      e.active = false
      spawnHitParticles(Game.player.x + Game.player.width / 2, Game.player.y + Game.player.height / 2, 14)
      Game.player.hit()
      if (Game.player.lives <= 0) {
        Game.gameOver = true
      }
    }
  }

  // Cleanup inactive objects
  Game.bullets = Game.bullets.filter(b => b.active)
  Game.enemies = Game.enemies.filter(e => e.active)
  Game.particles = Game.particles.filter(p => p.active)

  // Background scroll with dt
  Game.backgroundY += Game.backgroundSpeed * dt
  if (Game.backgroundY >= Game.height)
    Game.backgroundY -= Game.height
}

function spawnHitParticles(cx, cy, count) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2
    const spd = randomInt(80, 220)
    const vx = Math.cos(ang) * spd
    const vy = Math.sin(ang) * spd
    Game.particles.push(new Particle(cx, cy, vx, vy, 0.45, 'rgba(255,220,120,1)'))
  }
}

// ============================================
// RENDERING
// ============================================
function render() {
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

function renderBackground() {
  const y = Math.floor(Game.backgroundY)
  Game.ctx.drawImage(Game.backgroundImage, 0, y, Game.width, Game.height + 1)
  Game.ctx.drawImage(Game.backgroundImage, 0, y - Game.height, Game.width, Game.height + 1)
}

// ============================================
// GAME INITIALIZATION AND MAIN LOOP
// ============================================
function start() {
  Game.canvas = document.getElementById('game')
  Game.ctx = Game.canvas.getContext('2d')

  // Make canvas responsive
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Load images
  Game.backgroundImage.src = 'assets/background.jpeg'
  Game.playerImage.src = 'assets/ship.png'

  // Create player
  Game.player = new Player()

  // Spawn enemies loop
  if (Game.spawnIntervalId) clearInterval(Game.spawnIntervalId)
  Game.spawnIntervalId = setInterval(spawnEnemies, 1000)

  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') Game.player.isMovingLeft = true
    if (event.key === 'ArrowRight') Game.player.isMovingRight = true
    if (event.key === ' ') { Game.player.isShooting = true; preventSpaceScroll(event) }
    if (event.key === 's') toggleSound()
    if (event.key === 'r') restart()
    if (event.key === 'p') togglePause()

    play("soundtrack", 0.25)
  })

  document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') Game.player.isMovingLeft = false
    if (event.key === 'ArrowRight') Game.player.isMovingRight = false
    if (event.key === ' ') Game.player.isShooting = false
  })

  // Configure controls for mobile devices
  setupMobileControls()

  // Setup options menu
  setupOptionsMenu()

  // Start game loop (delta time)
  Game.lastFrameTime = performance.now()
  Game.frameId = requestAnimationFrame(gameLoop)
}

function resizeCanvas() {
  // Maintain original aspect; scale to window; then fit backing store for HiDPI
  const aspectRatio = 1400 / 900
  const isMobile = window.innerWidth <= 768
  const maxW = isMobile ? window.innerWidth * 0.95 : Math.min(window.innerWidth * 0.95, 1400)
  const maxH = isMobile ? window.innerHeight * 0.75 : Math.min(window.innerHeight * 0.7, 900)

  const widthFromHeight = maxH * aspectRatio
  const heightFromWidth = maxW / aspectRatio
  const cssW = Math.floor(widthFromHeight <= maxW ? widthFromHeight : maxW)
  const cssH = Math.floor(heightFromWidth <= maxH ? heightFromWidth : maxH)

  // Update CSS size
  const canvas = Game.canvas
  canvas.style.width = cssW + 'px'
  canvas.style.height = cssH + 'px'

  // Update logical game size (CSS pixels)
  Game.width = cssW
  Game.height = cssH

  // Reposition player to match new canvas size
  if (Game.player) {
    Game.player.x = clamp(Game.player.x, 0, Game.width - Game.player.width)
    Game.player.y = Game.height - Game.player.height - 10
  }

  // HiDPI backing store
  Game.dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(cssW * Game.dpr)
  canvas.height = Math.floor(cssH * Game.dpr)
  Game.ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0)
}

function gameLoop(now) {
  const dtMs = now - Game.lastFrameTime
  Game.lastFrameTime = now

  // Clamp dt to avoid huge jumps on tab‑switch
  const dt = Math.min(dtMs / 1000, 1 / 30)

  if (!Game.paused && !Game.gameOver) {
    update(dt)
    render()
    Game.frameId = requestAnimationFrame(gameLoop)
  } else {
    render() // still render overlays
  }
}

// Start the game
start()