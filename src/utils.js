function resizeCanvas() {
  const canvas = Game.canvas
  const aspectRatio = 1400 / 900 // 1.556
  
  // Determine max available space
  const isMobile = window.innerWidth <= 768
  const maxWidth = isMobile ? window.innerWidth * 0.95 : Math.min(window.innerWidth * 0.95, 1400)
  const maxHeight = isMobile ? window.innerHeight * 0.75 : Math.min(window.innerHeight * 0.7, 900)
  
  // Calculate dimensions maintaining aspect ratio
  const widthFromHeight = maxHeight * aspectRatio
  const heightFromWidth = maxWidth / aspectRatio
  
  // Use the dimensions that fit within both constraints
  const newWidth = widthFromHeight <= maxWidth ? widthFromHeight : maxWidth
  const newHeight = heightFromWidth <= maxHeight ? heightFromWidth : maxHeight
  
  canvas.style.width = newWidth + 'px'
  canvas.style.height = newHeight + 'px'
}

// Prevent default touch behaviors
function preventDefaults(e) {
  e.preventDefault()
  e.stopPropagation()
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