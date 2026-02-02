import { useEffect, useRef, useState } from 'react'

// Grid spacing constant (12 inches = 1 foot)
const GRID_SPACING = 12 // inches

// Zoom limits
const MIN_SCALE = 0.01 // max zoom out
const MAX_SCALE = 10 // max zoom in

interface Camera {
  x: number // camera position in world space (inches)
  y: number // camera position in world space (inches)
}

const Workspace = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [spacePressed, setSpacePressed] = useState(false)
  
  // Camera state - starts at world origin (0, 0)
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 })
  
  // Zoom state - 1.0 is base scale (1 pixel per inch)
  const [zoom, setZoom] = useState(1)
  
  // Canvas dimensions - dynamically updated on resize
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true)
        e.preventDefault()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false)
        setIsPanning(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle window resize and set up canvas dimensions
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      // Set display size (CSS pixels)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      // Set actual size in memory (scaled for device pixel ratio)
      canvas.width = width * dpr
      canvas.height = height * dpr

      // Update state to trigger re-render
      setCanvasWidth(canvas.width)
      setCanvasHeight(canvas.height)
    }

    updateCanvasSize()

    window.addEventListener('resize', updateCanvasSize)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [])

  // Main rendering effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (canvasWidth === 0 || canvasHeight === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Reset transform and scale the context for devicePixelRatio
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    // Clear the canvas (use CSS pixel dimensions for clearing)
    const displayWidth = canvas.width / dpr
    const displayHeight = canvas.height / dpr
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // Scale (pixels per inch) based on zoom level
    const scale = zoom

    // Helper function to convert world coordinates to canvas coordinates
    const worldToCanvas = (worldX: number, worldY: number) => {
      // World origin is at center of canvas
      // Camera position determines what part of the world is visible
      const viewX = worldX - camera.x
      const viewY = worldY - camera.y
      
      // Convert to canvas space (canvas center corresponds to camera position)
      const canvasX = displayWidth / 2 + viewX * scale
      const canvasY = displayHeight / 2 + viewY * scale
      
      return { x: canvasX, y: canvasY }
    }

    // Helper function to convert canvas coordinates to world coordinates
    const canvasToWorld = (canvasX: number, canvasY: number) => {
      const viewX = (canvasX - displayWidth / 2) / scale
      const viewY = (canvasY - displayHeight / 2) / scale
      
      const worldX = viewX + camera.x
      const worldY = viewY + camera.y
      
      return { x: worldX, y: worldY }
    }

    // Calculate visible world bounds based on camera position
    const visibleWorldWidth = displayWidth / scale
    const visibleWorldHeight = displayHeight / scale
    
    const visibleMinX = camera.x - visibleWorldWidth / 2
    const visibleMaxX = camera.x + visibleWorldWidth / 2
    const visibleMinY = camera.y - visibleWorldHeight / 2
    const visibleMaxY = camera.y + visibleWorldHeight / 2

    // Draw infinite grid
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 0.5

    // Calculate grid line range based on visible area
    const startX = Math.floor(visibleMinX / GRID_SPACING) * GRID_SPACING
    const endX = Math.ceil(visibleMaxX / GRID_SPACING) * GRID_SPACING
    const startY = Math.floor(visibleMinY / GRID_SPACING) * GRID_SPACING
    const endY = Math.ceil(visibleMaxY / GRID_SPACING) * GRID_SPACING

    // Vertical grid lines
    for (let x = startX; x <= endX; x += GRID_SPACING) {
      const start = worldToCanvas(x, visibleMinY)
      const end = worldToCanvas(x, visibleMaxY)
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = startY; y <= endY; y += GRID_SPACING) {
      const start = worldToCanvas(visibleMinX, y)
      const end = worldToCanvas(visibleMaxX, y)
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }

    // Display camera info
    ctx.fillStyle = '#888'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(
      `Camera: (${camera.x.toFixed(0)}", ${camera.y.toFixed(0)}") | Zoom: ${zoom.toFixed(2)}x${spacePressed ? ' | Space: ACTIVE' : ' | Hold Space to pan'}`,
      10,
      displayHeight - 10
    )
    
    // Suppress unused variable warning - canvasToWorld is defined for future use
    void canvasToWorld
  }, [camera, zoom, spacePressed, canvasWidth, canvasHeight])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Start panning on middle-click or when space is pressed
    if (e.button === 1 || spacePressed) {
      setIsPanning(true)
      setDragOffset({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return

    // Calculate movement delta in canvas pixels
    const deltaCanvasX = e.clientX - dragOffset.x
    const deltaCanvasY = e.clientY - dragOffset.y

    // Convert canvas delta to world delta (inverted for natural panning feel)
    const deltaWorldX = -deltaCanvasX / zoom
    const deltaWorldY = -deltaCanvasY / zoom

    // Update camera position (no clamping - infinite canvas)
    setCamera({
      x: camera.x + deltaWorldX,
      y: camera.y + deltaWorldY,
    })

    setDragOffset({ x: e.clientX, y: e.clientY })
  }

  const handleCanvasMouseUp = () => {
    setIsPanning(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvas.width / dpr
    const displayHeight = canvas.height / dpr

    // Mouse position in canvas coordinates
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Get world point under cursor BEFORE zoom
    const viewX = (mouseX - displayWidth / 2) / zoom
    const viewY = (mouseY - displayHeight / 2) / zoom
    const worldX = viewX + camera.x
    const worldY = viewY + camera.y

    // Calculate new zoom level
    const zoomFactor = Math.exp(-e.deltaY * 0.002)
    const newZoom = Math.max(MIN_SCALE, Math.min(MAX_SCALE, zoom * zoomFactor))

    // Adjust camera so world point stays under cursor
    const newCamera = {
      x: worldX - (mouseX - displayWidth / 2) / newZoom,
      y: worldY - (mouseY - displayHeight / 2) / newZoom
    }

    setZoom(newZoom)
    setCamera(newCamera)
  }

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 bg-card ${isPanning ? 'cursor-grabbing' : spacePressed ? 'cursor-grab' : 'cursor-default'}`}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
    />
  )
}

export default Workspace
