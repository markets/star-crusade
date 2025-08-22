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
  enemyBullets: [],
  particles: [],
  powerUps: [],
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
  powerUpTimer: 0,
  font: 'Press Start 2P',
  playerImage: new Image(),
  enemyTemplates: ['assets/enemy1.svg', 'assets/enemy2.svg', 'assets/enemy3.svg', 'assets/enemy4.svg', 'assets/enemy5.svg'],
  enemySvgCache: {}
}

// ============================================
// POWER-UP CONFIGURATION
// ============================================
const PowerUpConfig = {
  types: {
    shield: {
      icon: '🛡️',
      effect: (player) => { player.shieldTimer += 10.0 }
    },
    double_shoot: {
      icon: '🔫🔫',
      effect: (player) => { player.doubleShootTimer += 10.0 }
    },
    bomb: {
      icon: '💣',
      effect: (player) => { player.bombs += 1 }
    },
    live: {
      icon: '♥️',
      effect: (player) => { player.lives += 1 }
    },
    score: {
      icon: '🎖️',
      effect: () => { Game.score += 50 }
    },
    triple_shoot: {
      icon: '🔱',
      effect: (player) => { player.tripleShootTimer += 10.0 }
    },
    bonus_score: {
      icon: '🏆',
      effect: () => { Game.score += 100 }
    }
  },
  
  // Simple frequency arrays
  normal: ['shield', 'double_shoot', 'live', 'score'],
  low: ['bomb', 'triple_shoot', 'bonus_score']
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
  // Generate bright colors, avoid black/dark colors
  const r = Math.floor(Math.random() * 156) + 100
  const g = Math.floor(Math.random() * 156) + 100
  const b = Math.floor(Math.random() * 156) + 100
  return `rgb(${r},${g},${b})`
}

// Collision detection with optional offset
// Negative offset = larger hit areas
// Positive offset = smaller hit areas
function collision(a, b, offset = 0) {
  return (a.x < b.x + b.width - offset &&
          a.x + a.width > b.x + offset &&
          a.y < b.y + b.height - offset &&
          a.y + a.height > b.y + offset)
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
    this.invuln = 0 // seconds of invulnerability (blink) from collision
    this.shieldTimer = 0 // seconds of shield protection from power-up
    
    // Double shooting power-up
    this.doubleShootTimer = 0 // seconds of double shooting
    
    // Triple shoot shooting power-up  
    this.tripleShootTimer = 0 // seconds of triple shoot shooting
    
    // Bomb power-up inventory
    this.bombs = 0 // number of bombs player has
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
    this.shieldTimer = Math.max(0, this.shieldTimer - dt)
    this.doubleShootTimer = Math.max(0, this.doubleShootTimer - dt)
    this.tripleShootTimer = Math.max(0, this.tripleShootTimer - dt)

    // Shooting
    if (this.isShooting && this.fireCooldown === 0) {
      // Triple shoot has highest priority, then double shoot, then normal
      if (this.tripleShootTimer > 0) {
        // Triple shoot: fire rate similar to double shoot but with 3 bullets
        const currentFireRate = this.fireRate * 2
        this.fireCooldown = 1 / currentFireRate
        
        // Fire three bullets: center, left angle (-10 degrees), right angle (+10 degrees)
        const centerX = this.x + this.width / 2
        const bulletY = this.y
        
        Game.bullets.push(new Bullet(centerX, bulletY, 'triple', 0))
        Game.bullets.push(new Bullet(centerX - 10, bulletY, 'triple', -10))
        Game.bullets.push(new Bullet(centerX + 10, bulletY, 'triple', 10))
        
      } else if (this.doubleShootTimer > 0) {
        // Double fire rate during double shoot
        const currentFireRate = this.fireRate * 2
        this.fireCooldown = 1 / currentFireRate
        
        // Double shoot: fire two bullets side by side
        const bulletOffset = 30
        Game.bullets.push(new Bullet(this.x + this.width / 2 - bulletOffset / 2, this.y, 'double'))
        Game.bullets.push(new Bullet(this.x + this.width / 2 + bulletOffset / 2, this.y, 'double'))
      } else {
        // Normal shooting: single bullet
        this.fireCooldown = 1 / this.fireRate
        Game.bullets.push(new Bullet(this.x + this.width / 2, this.y, 'normal'))
      }
      play('shoot')
    }
  }

  render() {
    // Blink when invulnerable from collision or shield power-up
    if ((this.invuln > 0 || this.shieldTimer > 0) && Math.floor(performance.now() / 100) % 2 === 0) return
    Game.ctx.drawImage(Game.playerImage, this.x, this.y, this.width, this.height)
  }

  hit() {
    // Check for shield protection first
    if (this.shieldTimer > 0 || this.invuln > 0 || Game.gameOver) return
    this.lives -= 1
    this.invuln = 2
    if (this.lives <= 0) {
      Game.gameOver = true
    }
  }

  useBomb() {
    if (this.bombs <= 0) return false
    
    this.bombs -= 1
    
    // Kill all enemies on screen
    Game.enemies.forEach(enemy => {
      if (enemy.active) {
        enemy.active = false
        Game.score += 10 // Give points for each enemy killed
        // Spawn particles for each destroyed enemy
        spawnHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15)
      }
    })
    
    // Remove all enemy bullets
    Game.enemyBullets.forEach(bullet => {
      bullet.active = false
    })
    
    play('explosion')
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
    this.fireCooldown = 0 // seconds
    this.fireRate = randomInt(20, 100) / 100 // 0.2 to 1.0 bullets per second
    this.canShoot = Math.random() < 0.3 // 30% chance this enemy can shoot
    
    // Select a random enemy template type
    this.templateIndex = Math.floor(Math.random() * Game.enemyTemplates.length)
    this.coloredImage = null
    this.createColoredImage()
  }

  createColoredImage() {
    const svgPath = Game.enemyTemplates[this.templateIndex]

    // Check if SVG is already cached
    if (Game.enemySvgCache[svgPath]) {
      this.generateImageFromSvg(Game.enemySvgCache[svgPath])
      return
    }

    // Load SVG file
    fetch(svgPath)
      .then(response => response.text())
      .then(svgText => {
        // Cache the SVG content
        Game.enemySvgCache[svgPath] = svgText
        this.generateImageFromSvg(svgText)
      })
      .catch(error => {
        console.warn('Failed to load enemy SVG:', svgPath, error)
        this.coloredImage = null
      })
  }

  generateImageFromSvg(svgText) {
    // Parse SVG text
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
    const svgElement = svgDoc.documentElement

    // Apply color
    const bodyElements = svgElement.querySelectorAll('[fill="#PLACEHOLDER_COLOR"]')
    bodyElements.forEach(el => el.setAttribute('fill', this.color))

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData)

    // Create image from data URL
    this.coloredImage = new Image()
    this.coloredImage.src = dataUrl
  }

  update(dt) {
    if (!this.active) return
    this.y += this.speed * dt
    if (this.y > Game.height) {
      this.active = false
      return
    }

    // Shooting logic (only if enemy is visible and can shoot)
    if (this.canShoot && this.y > 0 && this.y < Game.height - this.height) {
      this.fireCooldown = Math.max(0, this.fireCooldown - dt)
      if (this.fireCooldown === 0) {
        this.fireCooldown = 1 / this.fireRate
        const bulletSpeed = this.speed + randomInt(100, 200) // enemy speed + delta
        Game.enemyBullets.push(new EnemyBullet(this.x + this.width / 2, this.y + this.height, bulletSpeed))
      }
    }
  }

  render() {
    if (!this.active) return
    if (this.coloredImage && this.coloredImage.complete) {
      Game.ctx.drawImage(this.coloredImage, this.x, this.y, this.width, this.height)
    }
  }
}

class Bullet {
  constructor(x, y, type = 'normal', angle = 0) {
    this.width = type === 'double' ? 8 : 5
    this.height = 10
    this.x = x - this.width / 2
    this.y = y - this.height
    this.speed = 980 // px/s
    this.active = true
    this.type = type // 'normal', 'double', or 'triple'
    this.angle = angle // angle in degrees, 0 = straight up, negative = left, positive = right
    
    // Calculate velocity components based on angle
    const angleRad = (angle * Math.PI) / 180
    this.vx = Math.sin(angleRad) * this.speed // horizontal velocity
    this.vy = -Math.cos(angleRad) * this.speed // vertical velocity (negative because up is negative Y)
  }

  update(dt) {
    if (!this.active) return
    
    if (this.angle === 0) {
      // Straight bullet (original behavior)
      this.y -= this.speed * dt
    } else {
      // Angled bullet
      this.x += this.vx * dt
      this.y += this.vy * dt
    }
    
    // Remove bullet if it goes off screen
    if (this.y < -this.height || this.x < -this.width || this.x > Game.width) {
      this.active = false
    }
  }

  render() {
    if (!this.active) return

    if (this.type === 'double') {
      Game.ctx.fillStyle = 'yellow'
    } else if (this.type === 'triple') {
      Game.ctx.fillStyle = 'cyan'
    } else {
      Game.ctx.fillStyle = 'white'
    }
    Game.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}

class EnemyBullet {
  constructor(x, y, speed) {
    this.width = 10
    this.height = 10
    this.x = x - this.width / 2
    this.y = y
    this.speed = speed // px/s
    this.active = true
  }

  update(dt) {
    if (!this.active) return
    this.y += this.speed * dt
    if (this.y > Game.height) this.active = false
  }

  render() {
    if (!this.active) return
    Game.ctx.fillStyle = 'red'
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

class PowerUp {
  constructor() {
    this.speed = 120 // px/s, slower than enemies
    this.active = true
    
    // Simple frequency selection: 60% normal, 40% low
    const useNormalFrequency = Math.random() < 0.6
    
    if (useNormalFrequency) {
      const randomIndex = Math.floor(Math.random() * PowerUpConfig.normal.length)
      this.type = PowerUpConfig.normal[randomIndex]
    } else {
      const randomIndex = Math.floor(Math.random() * PowerUpConfig.low.length)
      this.type = PowerUpConfig.low[randomIndex]
    }
    
    this.height = 25
    this.width = this.type == 'double_shoot' ? 40 : 25
    this.x = Math.random() * (Game.width - this.width)
    this.y = -this.height
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
    
    // Make power-ups blink
    if (Math.floor(performance.now() / 200) % 2 === 0) return
    
    const ctx = Game.ctx
    const config = PowerUpConfig.types[this.type]
    
    ctx.font = '25px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(config.icon, this.x + this.width / 2, this.y + this.height / 2)
  }

  hit() {
    this.active = false
    
    const config = PowerUpConfig.types[this.type]
    if (config && config.effect) {
      config.effect(Game.player)
    }
  }
}

// ============================================
// CONTROLS AND UI
// ============================================
function setupOptionsMenu() {
  const soundBtn = document.getElementById('sound-btn')
  const restartBtn = document.getElementById('restart-btn')
  const pauseBtn = document.getElementById('pause-btn')

  soundBtn.addEventListener('touchstart', (e) => { preventDefaults(e); toggleSound() })
  soundBtn.addEventListener('click', (e) => { preventDefaults(e); toggleSound() })

  restartBtn.addEventListener('touchstart', (e) => { preventDefaults(e); restart() })
  restartBtn.addEventListener('click', (e) => { preventDefaults(e); restart() })

  pauseBtn.addEventListener('touchstart', (e) => { preventDefaults(e); togglePause() })
  pauseBtn.addEventListener('click', (e) => { preventDefaults(e); togglePause() })
}

function setupMobileControls() {
  const leftBtn = document.getElementById('left-btn')
  const rightBtn = document.getElementById('right-btn')
  const shootBtn = document.getElementById('shoot-btn')

  leftBtn.addEventListener('touchstart', (e) => { preventDefaults(e); Game.player.isMovingLeft = true })
  leftBtn.addEventListener('touchend',   (e) => { preventDefaults(e); Game.player.isMovingLeft = false })
  leftBtn.addEventListener('mousedown',  (e) => { preventDefaults(e); Game.player.isMovingLeft = true })
  leftBtn.addEventListener('mouseup',    (e) => { preventDefaults(e); Game.player.isMovingLeft = false })
  leftBtn.addEventListener('mouseleave', (e) => { Game.player.isMovingLeft = false })

  rightBtn.addEventListener('touchstart', (e) => { preventDefaults(e); Game.player.isMovingRight = true })
  rightBtn.addEventListener('touchend',   (e) => { preventDefaults(e); Game.player.isMovingRight = false })
  rightBtn.addEventListener('mousedown',  (e) => { preventDefaults(e); Game.player.isMovingRight = true })
  rightBtn.addEventListener('mouseup',    (e) => { preventDefaults(e); Game.player.isMovingRight = false })
  rightBtn.addEventListener('mouseleave', (e) => { Game.player.isMovingRight = false })

  shootBtn.addEventListener('touchstart', (e) => { preventDefaults(e); Game.player.isShooting = true })
  shootBtn.addEventListener('touchend',   (e) => { preventDefaults(e); Game.player.isShooting = false })
  shootBtn.addEventListener('mousedown',  (e) => { preventDefaults(e); Game.player.isShooting = true })
  shootBtn.addEventListener('mouseup',    (e) => { preventDefaults(e); Game.player.isShooting = false })
  shootBtn.addEventListener('mouseleave', (e) => { Game.player.isShooting = false })
}

function restart() {
  // Clear all intervals and animation frames
  if (Game.spawnIntervalId) {
    clearInterval(Game.spawnIntervalId)
    Game.spawnIntervalId = 0
  }
  if (Game.frameId) {
    cancelAnimationFrame(Game.frameId)
    Game.frameId = 0
  }

  // Reset game state arrays
  Game.enemies = []
  Game.bullets = []
  Game.enemyBullets = []
  Game.particles = []
  Game.powerUps = []

  // Reset game state variables
  Game.score = 0
  Game.newMaxScore = false
  Game.gameOver = false
  Game.paused = false
  Game.backgroundY = 0
  Game.powerUpTimer = 0

  // Create new player
  Game.player = new Player()

  // Restart spawn enemies loop
  Game.spawnIntervalId = setInterval(spawnEnemies, 1000)

  // Restart game loop
  Game.interval = 0
  Game.lastFrameTime = performance.now()
  Game.frameId = requestAnimationFrame(gameLoop)
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
  let maxEnemies = Math.round(clamp(Game.interval / 10, 1, 25))
  let maxSpeed = clamp(80 + Game.interval * 10, 80, 600) // px/s
  let maxSize = clamp(40 + Game.interval * 10, 40, 100)

  for (let i = 0; i < maxEnemies; i++) {
    const speed = randomInt(80, maxSpeed)
    const size = randomInt(40, maxSize)
    Game.enemies.push(new Enemy(speed, size))
  }
}

function spawnPowerUps(dt) {
  if (Game.paused || Game.gameOver) return
  
  // Update power-up timer
  Game.powerUpTimer += dt
  
  // Spawn a new power-up randomly every 10-20 seconds
  const nextSpawnTime = randomInt(10, 20)
  if (Game.powerUpTimer >= nextSpawnTime) {
    Game.powerUps.push(new PowerUp())
    Game.powerUpTimer = 0
  }
}

function update(dt) {
  Game.player.update(dt)
  Game.enemies.forEach((e) => e.update(dt))
  Game.enemyBullets.forEach((b) => b.update(dt))
  Game.bullets.forEach((b) => b.update(dt))
  Game.particles.forEach((p) => p.update(dt))
  Game.powerUps.forEach((p) => p.update(dt))

  // Spawn power-ups
  spawnPowerUps(dt)

  // Bullet–Enemy collisions
  for (let bi = 0; bi < Game.bullets.length; bi++) {
    const b = Game.bullets[bi]
    if (!b.active) continue
    for (let ei = 0; ei < Game.enemies.length; ei++) {
      const e = Game.enemies[ei]
      if (!e.active) continue
      if (collision(b, e, -3)) {
        b.active = false
        e.active = false
        Game.score += 10
        // Spawn small burst of particles
        spawnHitParticles(e.x + e.width / 2, e.y + e.height / 2, 10)
        break
      }
    }
  }

  // Enemy Bullet–Player collisions
  for (let bi = 0; bi < Game.enemyBullets.length; bi++) {
    const b = Game.enemyBullets[bi]
    if (!b.active) continue
    if (collision(b, { x: Game.player.x, y: Game.player.y, width: Game.player.width, height: Game.player.height }, 2)) {
      b.active = false
      spawnHitParticles(Game.player.x + Game.player.width / 2, Game.player.y + Game.player.height / 2, 8)
      Game.player.hit()
      if (Game.player.lives <= 0) {
        Game.gameOver = true
      }
      break
    }
  }

  // Player–Enemy collisions
  for (const e of Game.enemies) {
    if (!e.active) continue

    if (collision({ x: Game.player.x, y: Game.player.y, width: Game.player.width, height: Game.player.height }, e, 2)) {
      e.active = false
      spawnHitParticles(Game.player.x + Game.player.width / 2, Game.player.y + Game.player.height / 2, 14)
      Game.player.hit()
      if (Game.player.lives <= 0) {
        Game.gameOver = true
      }
    }
  }

  // Player–PowerUp collisions
  for (const p of Game.powerUps) {
    if (!p.active) continue

    if (collision({ x: Game.player.x, y: Game.player.y, width: Game.player.width, height: Game.player.height }, p, -2)) {
      p.hit()
      
      // Play achievement sound for power-up collection
      play('achievement')

      // Spawn some particles for visual feedback
      spawnHitParticles(p.x + p.width / 2, p.y + p.height / 2, 8)
    }
  }

  // Cleanup inactive objects
  Game.bullets = Game.bullets.filter(b => b.active)
  Game.enemyBullets = Game.enemyBullets.filter(b => b.active)
  Game.enemies = Game.enemies.filter(e => e.active)
  Game.particles = Game.particles.filter(p => p.active)
  Game.powerUps = Game.powerUps.filter(p => p.active)

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
  Game.enemyBullets.forEach((b) => b.render())
  Game.particles.forEach((p) => p.render())
  Game.powerUps.forEach((p) => p.render())

  // HUD
  ctx.textAlign = 'start'
  ctx.fillStyle = 'white'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `20px '${Game.font}'`

  // Score
  const maxScore = parseInt(localStorage.getItem('gameScore')) || 0
  ctx.fillText(`Score ${Game.score} Record ${maxScore}`, 20, 40)

  // Lives
  ctx.font = `15px '${Game.font}'`
  ctx.fillText(`♥️ ${Game.player.lives}`, 20, 70)

  // Show power-up status
  let uiLine = 90
  if (Game.player.shieldTimer > 0) {
    ctx.font = `15px '${Game.font}'`
    ctx.fillText(`🛡️ ${Math.ceil(Game.player.shieldTimer)}s`, 20, uiLine)
    uiLine += 20
  }
  if (Game.player.doubleShootTimer > 0) {
    ctx.font = `15px '${Game.font}'`
    ctx.fillText(`${PowerUpConfig.types.double_shoot.icon} ${Math.ceil(Game.player.doubleShootTimer)}s`, 20, uiLine)
    uiLine += 20
  }
  if (Game.player.tripleShootTimer > 0) {
    ctx.font = `15px '${Game.font}'`
    ctx.fillText(`${PowerUpConfig.types.triple_shoot.icon} ${Math.ceil(Game.player.tripleShootTimer)}s`, 20, uiLine)
    uiLine += 20
  }
  if (Game.player.bombs > 0) {
    ctx.font = `15px '${Game.font}'`
    ctx.fillText(`💣 ${Game.player.bombs}`, 20, uiLine)
  }

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

  // PAUSED
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

  // Keywords events
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') Game.player.isMovingLeft = true
    if (event.key === 'ArrowRight') Game.player.isMovingRight = true
    if (event.key === ' ') { Game.player.isShooting = true; preventSpaceScroll(event) }
    if (event.key === 's') toggleSound()
    if (event.key === 'r') restart()
    if (event.key === 'p') togglePause()
    if (event.key === 'b') {
      if (!Game.gameOver && !Game.paused) {
        Game.player.useBomb()
      }
    }

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

  // Spawn enemies loop
  if (Game.spawnIntervalId) clearInterval(Game.spawnIntervalId)
  Game.spawnIntervalId = setInterval(spawnEnemies, 1000)

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
