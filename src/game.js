const Game = {
  canvas: null,
  ctx: null,
  sound: true,
  player: null,
  enemies: [],
  bullets: [],
  score: 0,
  newMaxScore: false,
  gameOver: false,
  backgroundImage: new Image(),
  backgroundY: 0,
  interval: 0,
  font: 'Press Start 2P',
  playerImage: new Image()
}

class Player {
  constructor() {
    this.width = 40
    this.height = 40
    this.x = Game.canvas.width / 2 - this.width / 2
    this.y = Game.canvas.height - this.height - 10
    this.speed = 6
    this.isMovingLeft = false
    this.isMovingRight = false
    this.isShooting = false
  }

  update() {
    // Move the player
    if (this.isMovingLeft) this.x -= this.speed
    if (this.isMovingRight) this.x += this.speed

    // Ensure the player is inside the canvas
    if (this.x < 0) this.x = 0
    if (this.x > Game.canvas.width - this.width) this.x = Game.canvas.width - this.width

    // Shoot bullet
    if (this.isShooting) {
      this.isShooting = false
      Game.bullets.push(new Bullet(this.x + this.width / 2, this.y))

      play('shoot')
    }
  }

  render() {
    Game.ctx.drawImage(Game.playerImage, this.x, this.y, this.width, this.height)
  }
}

class Enemy {
  constructor(speed, size = 50) {
    this.width = size
    this.height = size
    this.x = Math.random() * (Game.canvas.width - this.width)
    this.y = 0
    this.speed = speed
    this.color = randomColor()
  }

  update() {
    // Move the enemy
    this.y += this.speed

    // Check if the enemy has reached the end of the canvas
    if (this.y > Game.canvas.height) {
      Game.enemies = Game.enemies.filter((enemy) => enemy !== this)
    }
  }

  render() {
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
    this.speed = 10
  }

  update() {
    // Move the bullet
    this.y -= this.speed

    // Check if the bullet is outside canvas
    if (this.y < 0) {
      Game.bullets = Game.bullets.filter((bullet) => bullet !== this)
    }

    // Check if the bullet has hit an enemy
    Game.enemies.forEach((enemy) => {
      if (collision(this, enemy)) {
        Game.enemies = Game.enemies.filter((e) => e !== enemy)
        Game.bullets = Game.bullets.filter((bullet) => bullet !== this)
        Game.score += 10
      }
    })
  }

  render() {
    Game.ctx.fillStyle = "white"
    Game.ctx.fillRect(this.x, this.y, this.width, this.height)
  }
}

function start() {
  Game.canvas = document.getElementById("game")
  Game.ctx = Game.canvas.getContext("2d")

  // Make canvas responsive
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Load images
  Game.backgroundImage.src = "assets/background.jpeg"
  Game.playerImage.src = "assets/ship.png"

  // Create player AFTER canvas is resized
  Game.player = new Player()

  // Each second, spawn new Enemies increasing difficulty
  setInterval(spawnEnemies, 1000)

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") Game.player.isMovingLeft = true
    if (event.key === "ArrowRight") Game.player.isMovingRight = true
    if (event.key === " ") Game.player.isShooting = true
    if (event.key === "s") Game.sound = !Game.sound

    // Prevent scroll when pressing the spacebar
    if (event.key === " " && event.target == document.body) event.preventDefault()

    play("soundtrack", 0.25)
  })

  document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft") Game.player.isMovingLeft = false
    if (event.key === "ArrowRight") Game.player.isMovingRight = false
  })

  // Mobile controls
  setupMobileControls()

  gameLoop()
}

function resizeCanvas() {
  const canvas = Game.canvas
  const container = canvas.parentElement
  const rect = container.getBoundingClientRect()
  
  // Set a reasonable max size while keeping aspect ratio
  const maxWidth = Math.min(window.innerWidth * 0.95, 1400)
  const maxHeight = Math.min(window.innerHeight * 0.7, 900)
  
  // Maintain aspect ratio (roughly 1.56:1)
  const aspectRatio = 1400 / 900
  
  let newWidth = maxWidth
  let newHeight = newWidth / aspectRatio
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight
    newWidth = newHeight * aspectRatio
  }
  
  canvas.style.width = newWidth + 'px'
  canvas.style.height = newHeight + 'px'
}

function setupMobileControls() {
  const leftBtn = document.getElementById('left-btn')
  const rightBtn = document.getElementById('right-btn')
  const shootBtn = document.getElementById('shoot-btn')
  const soundBtn = document.getElementById('sound-btn')

  // Prevent default touch behaviors
  const preventDefaults = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Left button
  leftBtn.addEventListener('touchstart', (e) => {
    preventDefaults(e)
    Game.player.isMovingLeft = true
  })
  leftBtn.addEventListener('touchend', (e) => {
    preventDefaults(e)
    Game.player.isMovingLeft = false
  })
  leftBtn.addEventListener('mousedown', (e) => {
    preventDefaults(e)
    Game.player.isMovingLeft = true
  })
  leftBtn.addEventListener('mouseup', (e) => {
    preventDefaults(e)
    Game.player.isMovingLeft = false
  })

  // Right button
  rightBtn.addEventListener('touchstart', (e) => {
    preventDefaults(e)
    Game.player.isMovingRight = true
  })
  rightBtn.addEventListener('touchend', (e) => {
    preventDefaults(e)
    Game.player.isMovingRight = false
  })
  rightBtn.addEventListener('mousedown', (e) => {
    preventDefaults(e)
    Game.player.isMovingRight = true
  })
  rightBtn.addEventListener('mouseup', (e) => {
    preventDefaults(e)
    Game.player.isMovingRight = false
  })

  // Shoot button
  shootBtn.addEventListener('touchstart', (e) => {
    preventDefaults(e)
    Game.player.isShooting = true
    play("soundtrack", 0.25)
  })
  shootBtn.addEventListener('click', (e) => {
    preventDefaults(e)
    Game.player.isShooting = true
    play("soundtrack", 0.25)
  })

  // Sound button
  soundBtn.addEventListener('touchstart', (e) => {
    preventDefaults(e)
    Game.sound = !Game.sound
  })
  soundBtn.addEventListener('click', (e) => {
    preventDefaults(e)
    Game.sound = !Game.sound
  })
}

function spawnEnemies() {
  Game.interval++

  let maxEnemies = randomInt(2, Math.round(Game.interval / 5))
  let maxSpeed = maxEnemies + 1
  let maxSize = (maxSpeed + 10) * 10

  if (maxEnemies > 15) maxEnemies = 15
  if (maxSpeed > 25) maxSpeed = 25
  if (maxSize > 150) maxSize = 150

  generateEnemies(maxEnemies, { maxSpeed: maxSpeed, maxSize: maxSize })
}

function generateEnemies(number, attributes) {
  for (let i = 0; i < number; i++) {
    const enemy = new Enemy(randomInt(2, attributes['maxSpeed']), randomInt(30, attributes['maxSize']))
    Game.enemies.push(enemy)
  }
}

function randomInt(min, max) {
  let difference = max - min
  let rand = Math.random()

  rand = Math.floor(rand * difference)
  rand = rand + min

  return rand
}

function randomColor() {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`
}

function play(sound, volume = 0.2) {
  const audio = document.getElementById(sound)

  audio.volume = Game.sound ? volume : 0
  if (!audio.loop) audio.currentTime = 0

  audio.play()
}

function collision(obj1, obj2) {
  if (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  ) {
    return true
  } else {
    return false
  }
}

function update() {
  Game.player.update()
  Game.enemies.forEach((enemy) => enemy.update())
  Game.bullets.forEach((bullet) => bullet.update())

  // Check if the player was hit by any enemy
  Game.enemies.forEach((enemy) => {
    if (collision(Game.player, enemy)) {
      Game.gameOver = true
    }
  })
}

function render() {
  Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height)

  renderBackground()

  Game.player.render()
  Game.enemies.forEach((enemy) => enemy.render())
  Game.bullets.forEach((bullet) => bullet.render())

  // Render score
  const maxScore = localStorage.getItem("gameScore") || 0
  Game.ctx.fillStyle = "white"
  Game.ctx.font = `20px '${Game.font}'`
  Game.ctx.fillText(`Score ${Game.score} Record ${maxScore}`, 10, 30)

  // Notify new record achieved
  if (Game.score > maxScore && !Game.newMaxScore) {
    play('achievement')
    Game.newMaxScore = true
  }

  // GAME OVER
  if (Game.gameOver) {
    play('explosion')

    Game.ctx.fillStyle = "white"
    Game.ctx.font = `60px '${Game.font}'`
    
    // Center the "GAME OVER" text automatically
    const gameOverText = "GAME OVER"
    const gameOverMetrics = Game.ctx.measureText(gameOverText)
    const gameOverX = (Game.canvas.width - gameOverMetrics.width) / 2
    const gameOverY = Game.canvas.height / 2 - 20
    
    Game.ctx.fillText(gameOverText, gameOverX, gameOverY)
    
    Game.ctx.font = `20px '${Game.font}'`
    const restartText = "Press R to restart"
    const restartMetrics = Game.ctx.measureText(restartText)
    const restartX = (Game.canvas.width - restartMetrics.width) / 2
    const restartY = gameOverY + 60
    
    Game.ctx.fillText(restartText, restartX, restartY)

    if (Game.score > maxScore) localStorage.setItem("gameScore", Game.score)

    document.addEventListener("keyup", (event) => {
      if (event.key === "r") location.reload()
    })
  }
}

function renderBackground() {
  // Scale background to fit canvas dimensions
  Game.ctx.drawImage(Game.backgroundImage, 0, Game.backgroundY, Game.canvas.width, Game.canvas.height)
  Game.ctx.drawImage(Game.backgroundImage, 0, Game.backgroundY - Game.canvas.height, Game.canvas.width, Game.canvas.height)

  Game.backgroundY += 0.5
  if (Game.backgroundY >= Game.canvas.height)
    Game.backgroundY = 0
}

function gameLoop() {
  update()
  render()

  if (!Game.gameOver) requestAnimationFrame(gameLoop)
}

start()
