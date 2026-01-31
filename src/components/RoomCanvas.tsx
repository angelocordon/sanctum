import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'

// Canvas padding from viewport edges
const CANVAS_PADDING = 40 // pixels

// World bounds: 40ft × 40ft (480" × 480"), origin at center
const WORLD_WIDTH = 480 // inches (40 feet)
const WORLD_HEIGHT = 480 // inches (40 feet)

// Rotation handle constants
const ROTATION_HANDLE_OFFSET = 20 // pixels
const ROTATION_HANDLE_RADIUS = 10 // pixels

interface RoomCanvasProps {
  roomWidth: number // in inches
  roomLength: number // in inches
}

interface Item {
  id: string
  width: number // in inches
  depth: number // in inches
  label: string
  x: number // position in inches (room-local coordinates)
  y: number // position in inches (room-local coordinates)
  rotation: number // rotation angle in degrees
}

interface Camera {
  x: number // camera position in world space (inches)
  y: number // camera position in world space (inches)
}

interface Room {
  x: number // room position in world space (inches, measured from world origin)
  y: number // room position in world space (inches, measured from world origin)
}

const RoomCanvas = ({ roomWidth, roomLength }: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [newItemWidth, setNewItemWidth] = useState('')
  const [newItemDepth, setNewItemDepth] = useState('')
  const [newItemLabel, setNewItemLabel] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isRoomSelected, setIsRoomSelected] = useState(false)
  const [isDraggingItem, setIsDraggingItem] = useState(false)
  const [isDraggingRoom, setIsDraggingRoom] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isRotating, setIsRotating] = useState(false)
  const [spacePressed, setSpacePressed] = useState(false)
  
  // Camera state - starts at world origin (0, 0)
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 })
  
  // Room state - starts at world origin (0, 0)
  const [room, setRoom] = useState<Room>({ x: 0, y: 0 })
  
  // Canvas dimensions - dynamically updated on resize
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [canvasHeight, setCanvasHeight] = useState(0)

  // Handle space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true)
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (canvasWidth === 0 || canvasHeight === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale the context for devicePixelRatio
    const dpr = window.devicePixelRatio || 1
    ctx.scale(dpr, dpr)

    // Clear the canvas (use CSS pixel dimensions for clearing)
    const displayWidth = canvas.width / dpr
    const displayHeight = canvas.height / dpr
    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // Calculate scale factor (pixels per inch) to fit the world in the canvas
    const availableWidth = displayWidth - 2 * CANVAS_PADDING
    const availableHeight = displayHeight - 2 * CANVAS_PADDING

    // Use a single scale factor for both axes to maintain proportions
    const scaleX = availableWidth / WORLD_WIDTH
    const scaleY = availableHeight / WORLD_HEIGHT
    const scale = Math.min(scaleX, scaleY) // Use the smaller scale to fit both dimensions

    // Helper function to convert world coordinates to canvas coordinates
    const worldToCanvas = (worldX: number, worldY: number) => {
      // World origin is at center of world bounds
      // Camera position is in world space
      const viewX = worldX - camera.x
      const viewY = worldY - camera.y
      
      // Convert to canvas space (canvas center corresponds to camera position)
      const canvasX = displayWidth / 2 + viewX * scale
      const canvasY = displayHeight / 2 + viewY * scale
      
      return { x: canvasX, y: canvasY }
    }

    // Draw world bounds (40ft × 40ft workspace)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 3
    const worldTopLeft = worldToCanvas(-WORLD_WIDTH / 2, -WORLD_HEIGHT / 2)
    const worldBottomRight = worldToCanvas(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    ctx.strokeRect(
      worldTopLeft.x,
      worldTopLeft.y,
      worldBottomRight.x - worldTopLeft.x,
      worldBottomRight.y - worldTopLeft.y
    )

    // Draw grid for the world
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 0.5

    // Grid spacing: minor lines every 2 inches, major lines every 12 inches (1 foot)
    const minorGridSpacing = 2 // inches
    const majorGridSpacing = 12 // inches

    // Vertical grid lines
    for (let x = -WORLD_WIDTH / 2; x <= WORLD_WIDTH / 2; x += minorGridSpacing) {
      const pos = worldToCanvas(x, -WORLD_HEIGHT / 2)
      const endPos = worldToCanvas(x, WORLD_HEIGHT / 2)
      const isMajor = x % majorGridSpacing === 0
      ctx.strokeStyle = isMajor ? '#666' : '#444'
      ctx.lineWidth = isMajor ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.lineTo(endPos.x, endPos.y)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = -WORLD_HEIGHT / 2; y <= WORLD_HEIGHT / 2; y += minorGridSpacing) {
      const pos = worldToCanvas(-WORLD_WIDTH / 2, y)
      const endPos = worldToCanvas(WORLD_WIDTH / 2, y)
      const isMajor = y % majorGridSpacing === 0
      ctx.strokeStyle = isMajor ? '#666' : '#444'
      ctx.lineWidth = isMajor ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      ctx.lineTo(endPos.x, endPos.y)
      ctx.stroke()
    }

    // Calculate room position in world space
    const roomWorldX = room.x - roomWidth / 2 // Room position is center-based
    const roomWorldY = room.y - roomLength / 2

    // Draw room boundaries
    const roomTopLeft = worldToCanvas(roomWorldX, roomWorldY)
    const roomBottomRight = worldToCanvas(roomWorldX + roomWidth, roomWorldY + roomLength)
    
    ctx.fillStyle = isRoomSelected ? 'rgba(100, 108, 255, 0.1)' : 'rgba(100, 108, 255, 0.05)'
    ctx.fillRect(
      roomTopLeft.x,
      roomTopLeft.y,
      roomBottomRight.x - roomTopLeft.x,
      roomBottomRight.y - roomTopLeft.y
    )
    
    ctx.strokeStyle = isRoomSelected ? '#ffaa00' : '#646cff'
    ctx.lineWidth = isRoomSelected ? 3 : 2
    ctx.strokeRect(
      roomTopLeft.x,
      roomTopLeft.y,
      roomBottomRight.x - roomTopLeft.x,
      roomBottomRight.y - roomTopLeft.y
    )

    // Draw items (in room-local coordinates)
    items.forEach((item) => {
      // Convert room-local coordinates to world coordinates
      const itemWorldX = roomWorldX + item.x
      const itemWorldY = roomWorldY + item.y
      
      const itemPos = worldToCanvas(itemWorldX + item.width / 2, itemWorldY + item.depth / 2)
      const itemWidth = item.width * scale
      const itemDepth = item.depth * scale

      ctx.save()
      
      // Translate to item center for rotation
      ctx.translate(itemPos.x, itemPos.y)
      ctx.rotate((item.rotation * Math.PI) / 180)
      
      // Draw item rectangle (centered at origin after rotation)
      const isSelected = item.id === selectedItemId
      ctx.fillStyle = isSelected ? 'rgba(100, 108, 255, 0.5)' : 'rgba(100, 108, 255, 0.3)'
      ctx.strokeStyle = isSelected ? '#ffaa00' : '#646cff'
      ctx.lineWidth = isSelected ? 3 : 2
      ctx.fillRect(-itemWidth / 2, -itemDepth / 2, itemWidth, itemDepth)
      ctx.strokeRect(-itemWidth / 2, -itemDepth / 2, itemWidth, itemDepth)

      // Draw label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.label, 0, -10)

      // Draw dimensions
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(`${item.width}" × ${item.depth}"`, 0, 10)
      
      // Draw rotation handle if selected
      if (isSelected) {
        const handleDistance = Math.max(itemWidth, itemDepth) / 2 + ROTATION_HANDLE_OFFSET
        ctx.fillStyle = '#ffaa00'
        ctx.beginPath()
        ctx.arc(0, -handleDistance, 6, 0, 2 * Math.PI)
        ctx.fill()
      }
      
      ctx.restore()
    })

    // Draw room dimension labels
    ctx.fillStyle = '#fff'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Width label (top)
    const topLabelPos = worldToCanvas(room.x, roomWorldY - 10 / scale)
    ctx.fillText(`${roomWidth}"`, topLabelPos.x, topLabelPos.y)

    // Length label (right side)
    ctx.save()
    const rightLabelPos = worldToCanvas(roomWorldX + roomWidth + 20 / scale, room.y)
    ctx.translate(rightLabelPos.x, rightLabelPos.y)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${roomLength}"`, 0, 0)
    ctx.restore()

    // Display info
    ctx.textAlign = 'left'
    ctx.fillStyle = '#888'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(
      `World: 40ft × 40ft | Camera: (${camera.x.toFixed(0)}", ${camera.y.toFixed(0)}")`,
      10,
      displayHeight - 30
    )
    ctx.fillText(
      `Room: (${room.x.toFixed(0)}", ${room.y.toFixed(0)}) | ${spacePressed ? 'Space: ACTIVE' : 'Space: Hold to pan'}`,
      10,
      displayHeight - 10
    )
  }, [roomWidth, roomLength, items, selectedItemId, camera, room, isRoomSelected, spacePressed, canvasWidth, canvasHeight])

  const handleAddItem = () => {
    const width = parseFloat(newItemWidth)
    const depth = parseFloat(newItemDepth)
    const label = newItemLabel.trim()

    if (isNaN(width) || isNaN(depth) || width <= 0 || depth <= 0 || !label) {
      alert('Please provide valid width, depth, and label')
      return
    }

    const newItem: Item = {
      id: `item-${Date.now()}`,
      width,
      depth,
      label,
      x: 12, // Start 12 inches from left
      y: 12, // Start 12 inches from top
      rotation: 0, // Start with no rotation
    }

    setItems([...items, newItem])
    setNewItemWidth('')
    setNewItemDepth('')
    setNewItemLabel('')
  }

  // Helper function to get scale and coordinate transforms
  const getCanvasTransform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvas.width / dpr
    const displayHeight = canvas.height / dpr

    const availableWidth = displayWidth - 2 * CANVAS_PADDING
    const availableHeight = displayHeight - 2 * CANVAS_PADDING
    const scaleX = availableWidth / WORLD_WIDTH
    const scaleY = availableHeight / WORLD_HEIGHT
    const scale = Math.min(scaleX, scaleY)

    // Helper function to convert canvas coordinates to world coordinates
    const canvasToWorld = (canvasX: number, canvasY: number) => {
      const viewX = (canvasX - displayWidth / 2) / scale
      const viewY = (canvasY - displayHeight / 2) / scale
      const worldX = viewX + camera.x
      const worldY = viewY + camera.y
      return { x: worldX, y: worldY }
    }

    return { scale, canvasToWorld, displayWidth, displayHeight }
  }, [camera.x, camera.y])

  // Helper to check if a point (in world coordinates) is inside the room
  const isPointInRoom = (worldX: number, worldY: number) => {
    const roomWorldX = room.x - roomWidth / 2
    const roomWorldY = room.y - roomLength / 2
    return (
      worldX >= roomWorldX &&
      worldX <= roomWorldX + roomWidth &&
      worldY >= roomWorldY &&
      worldY <= roomWorldY + roomLength
    )
  }

  // Helper to check if a point is inside a rotated rectangle
  const isPointInItem = (
    worldX: number,
    worldY: number,
    item: Item
  ) => {
    // Convert room-local item coordinates to world coordinates
    const roomWorldX = room.x - roomWidth / 2
    const roomWorldY = room.y - roomLength / 2
    const itemWorldX = roomWorldX + item.x
    const itemWorldY = roomWorldY + item.y
    
    const itemCenterX = itemWorldX + item.width / 2
    const itemCenterY = itemWorldY + item.depth / 2
    const itemWidth = item.width
    const itemDepth = item.depth

    // Translate point to item's coordinate system
    const dx = worldX - itemCenterX
    const dy = worldY - itemCenterY

    // Rotate point back by negative rotation
    const angle = (-item.rotation * Math.PI) / 180
    const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle)
    const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle)

    // Check if in rectangle bounds
    return (
      Math.abs(rotatedX) <= itemWidth / 2 &&
      Math.abs(rotatedY) <= itemDepth / 2
    )
  }

  // Helper to check if a point is on the rotation handle
  const isPointOnRotationHandle = (
    worldX: number,
    worldY: number,
    item: Item,
    scale: number
  ) => {
    // Convert room-local item coordinates to world coordinates
    const roomWorldX = room.x - roomWidth / 2
    const roomWorldY = room.y - roomLength / 2
    const itemWorldX = roomWorldX + item.x
    const itemWorldY = roomWorldY + item.y
    
    const itemCenterX = itemWorldX + item.width / 2
    const itemCenterY = itemWorldY + item.depth / 2
    const itemWidth = item.width
    const itemDepth = item.depth
    const handleDistance = Math.max(itemWidth, itemDepth) / 2 + ROTATION_HANDLE_OFFSET / scale

    // Rotate handle position around the item center
    const angle = (item.rotation * Math.PI) / 180
    const handleX = itemCenterX + handleDistance * Math.sin(angle)
    const handleY = itemCenterY - handleDistance * Math.cos(angle)

    const dx = worldX - handleX
    const dy = worldY - handleY
    return Math.sqrt(dx * dx + dy * dy) <= ROTATION_HANDLE_RADIUS / scale
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    const transform = getCanvasTransform()
    if (!transform) return

    const { scale, canvasToWorld } = transform
    const worldPos = canvasToWorld(canvasX, canvasY)

    // If space is pressed, start panning
    if (spacePressed) {
      setIsPanning(true)
      setDragOffset({ x: canvasX, y: canvasY })
      return
    }

    // Check items in reverse order (top to bottom)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]

      // Check if clicking on rotation handle of selected item
      if (item.id === selectedItemId && isPointOnRotationHandle(worldPos.x, worldPos.y, item, scale)) {
        setIsRotating(true)
        setIsRoomSelected(false)
        return
      }

      // Check if clicking on item
      if (isPointInItem(worldPos.x, worldPos.y, item)) {
        setSelectedItemId(item.id)
        setIsDraggingItem(true)
        setIsRoomSelected(false)
        
        // Calculate offset from item position to click position in room-local coordinates
        const roomWorldX = room.x - roomWidth / 2
        const roomWorldY = room.y - roomLength / 2
        const roomLocalX = worldPos.x - roomWorldX
        const roomLocalY = worldPos.y - roomWorldY
        
        setDragOffset({
          x: roomLocalX - item.x,
          y: roomLocalY - item.y,
        })
        return
      }
    }

    // Check if clicking inside the room (but not on an item)
    if (isPointInRoom(worldPos.x, worldPos.y)) {
      setIsRoomSelected(true)
      setSelectedItemId(null)
      setIsDraggingRoom(true)
      setDragOffset({
        x: worldPos.x - room.x,
        y: worldPos.y - room.y,
      })
      return
    }

    // Click on empty space - deselect everything
    setSelectedItemId(null)
    setIsRoomSelected(false)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    const transform = getCanvasTransform()
    if (!transform) return

    const { scale, canvasToWorld, displayWidth, displayHeight } = transform
    const worldPos = canvasToWorld(canvasX, canvasY)

    // Handle camera panning
    if (isPanning) {
      const deltaCanvasX = canvasX - dragOffset.x
      const deltaCanvasY = canvasY - dragOffset.y
      
      // Convert canvas delta to world delta
      const deltaWorldX = -deltaCanvasX / scale
      const deltaWorldY = -deltaCanvasY / scale
      
      // Update camera position
      const newCameraX = camera.x + deltaWorldX
      const newCameraY = camera.y + deltaWorldY
      
      // Clamp camera so the visible region stays within world bounds
      // Calculate how much of the world is visible in each dimension
      const visibleWorldWidth = displayWidth / scale
      const visibleWorldHeight = displayHeight / scale
      
      // Clamp camera position
      const maxCameraX = WORLD_WIDTH / 2 - visibleWorldWidth / 2
      const minCameraX = -WORLD_WIDTH / 2 + visibleWorldWidth / 2
      const maxCameraY = WORLD_HEIGHT / 2 - visibleWorldHeight / 2
      const minCameraY = -WORLD_HEIGHT / 2 + visibleWorldHeight / 2
      
      const clampedCameraX = Math.max(minCameraX, Math.min(maxCameraX, newCameraX))
      const clampedCameraY = Math.max(minCameraY, Math.min(maxCameraY, newCameraY))
      
      setCamera({ x: clampedCameraX, y: clampedCameraY })
      setDragOffset({ x: canvasX, y: canvasY })
      return
    }

    // Handle room dragging
    if (isDraggingRoom) {
      const newRoomX = worldPos.x - dragOffset.x
      const newRoomY = worldPos.y - dragOffset.y
      
      // Clamp room position to stay within world bounds
      const maxRoomX = WORLD_WIDTH / 2 - roomWidth / 2
      const minRoomX = -WORLD_WIDTH / 2 + roomWidth / 2
      const maxRoomY = WORLD_HEIGHT / 2 - roomLength / 2
      const minRoomY = -WORLD_HEIGHT / 2 + roomLength / 2
      
      const clampedRoomX = Math.max(minRoomX, Math.min(maxRoomX, newRoomX))
      const clampedRoomY = Math.max(minRoomY, Math.min(maxRoomY, newRoomY))
      
      setRoom({ x: clampedRoomX, y: clampedRoomY })
      return
    }

    const selectedItem = items.find((item) => item.id === selectedItemId)
    if (!selectedItem) return

    // Handle item dragging
    if (isDraggingItem) {
      // Convert world position to room-local coordinates
      const roomWorldX = room.x - roomWidth / 2
      const roomWorldY = room.y - roomLength / 2
      const roomLocalX = worldPos.x - roomWorldX
      const roomLocalY = worldPos.y - roomWorldY
      
      const newXInInches = roomLocalX - dragOffset.x
      const newYInInches = roomLocalY - dragOffset.y

      // Calculate bounding box for rotated item
      const angle = (selectedItem.rotation * Math.PI) / 180
      const cos = Math.abs(Math.cos(angle))
      const sin = Math.abs(Math.sin(angle))
      const rotatedWidth = selectedItem.width * cos + selectedItem.depth * sin
      const rotatedHeight = selectedItem.width * sin + selectedItem.depth * cos

      // Clamp to room boundaries accounting for rotation and center-based positioning
      const halfRotatedWidth = rotatedWidth / 2
      const halfRotatedHeight = rotatedHeight / 2

      // Compute the item's center in inches based on its unrotated top-left position
      const centerX = newXInInches + selectedItem.width / 2
      const centerY = newYInInches + selectedItem.depth / 2

      // Clamp the center so the rotated bounding box stays within room bounds
      const clampedCenterX = Math.max(
        halfRotatedWidth,
        Math.min(roomWidth - halfRotatedWidth, centerX)
      )
      const clampedCenterY = Math.max(
        halfRotatedHeight,
        Math.min(roomLength - halfRotatedHeight, centerY)
      )

      // Convert clamped center back to unrotated top-left coordinates
      const clampedX = clampedCenterX - selectedItem.width / 2
      const clampedY = clampedCenterY - selectedItem.depth / 2

      setItems(
        items.map((item) =>
          item.id === selectedItemId
            ? { ...item, x: clampedX, y: clampedY }
            : item
        )
      )
    } else if (isRotating) {
      // Convert room-local item coordinates to world coordinates
      const roomWorldX = room.x - roomWidth / 2
      const roomWorldY = room.y - roomLength / 2
      const itemWorldX = roomWorldX + selectedItem.x
      const itemWorldY = roomWorldY + selectedItem.y
      
      const itemCenterX = itemWorldX + selectedItem.width / 2
      const itemCenterY = itemWorldY + selectedItem.depth / 2

      // Calculate angle from item center to mouse
      const dx = worldPos.x - itemCenterX
      const dy = worldPos.y - itemCenterY
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
      
      // Normalize angle to 0-360 range
      angle = ((angle % 360) + 360) % 360

      setItems(
        items.map((item) =>
          item.id === selectedItemId ? { ...item, rotation: angle } : item
        )
      )
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDraggingItem(false)
    setIsDraggingRoom(false)
    setIsPanning(false)
    setIsRotating(false)
  }

  const handleDeleteSelected = () => {
    if (selectedItemId) {
      setItems(items.filter((item) => item.id !== selectedItemId))
      setSelectedItemId(null)
    }
  }

  const handleRotationChange = (angle: number) => {
    if (selectedItemId) {
      // Normalize angle to 0-360 range
      const normalizedAngle = ((angle % 360) + 360) % 360
      setItems(
        items.map((item) =>
          item.id === selectedItemId ? { ...item, rotation: normalizedAngle } : item
        )
      )
    }
  }

  return (
    <>
      {/* Canvas fills entire viewport */}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 bg-card ${spacePressed ? 'cursor-grab' : 'cursor-default'} ${isPanning ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />
      
      {/* UI overlays positioned above canvas */}
      <div className="fixed top-4 left-4 right-4 flex flex-col gap-4 pointer-events-none z-10">
        <div className="pointer-events-auto p-6 border border-input rounded-lg bg-card shadow-lg max-w-3xl">
          <h3 className="mt-0 mb-4 text-2xl font-semibold">Add Custom Item</h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex flex-col gap-2 text-left flex-1 min-w-[120px]">
              <Label htmlFor="item-width">Width (inches):</Label>
              <Input
                id="item-width"
                type="number"
                min="1"
                step="1"
                value={newItemWidth}
                onChange={(e) => setNewItemWidth(e.target.value)}
                placeholder="e.g., 36"
              />
            </div>
            <div className="flex flex-col gap-2 text-left flex-1 min-w-[120px]">
              <Label htmlFor="item-depth">Depth (inches):</Label>
              <Input
                id="item-depth"
                type="number"
                min="1"
                step="1"
                value={newItemDepth}
                onChange={(e) => setNewItemDepth(e.target.value)}
                placeholder="e.g., 24"
              />
            </div>
            <div className="flex flex-col gap-2 text-left flex-1 min-w-[120px]">
              <Label htmlFor="item-label">Label:</Label>
              <Input
                id="item-label"
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder="e.g., Desk"
              />
            </div>
            <Button type="button" onClick={handleAddItem} className="mt-6">Add Item</Button>
          </div>
        </div>
        
        {selectedItemId && (
          <div className="pointer-events-auto p-6 border-2 border-orange-500 rounded-lg bg-orange-500/10 backdrop-blur-sm shadow-lg max-w-3xl">
            <h3 className="mt-0 mb-4 text-2xl font-semibold">Selected Item</h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="flex flex-col gap-2 text-left flex-1 min-w-[120px]">
                <Label htmlFor="rotation-angle">Rotation (degrees):</Label>
                <Input
                  id="rotation-angle"
                  type="number"
                  min="0"
                  max="360"
                  step="1"
                  value={Math.round(
                    items.find((item) => item.id === selectedItemId)?.rotation || 0
                  )}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    if (!isNaN(value)) {
                      handleRotationChange(value)
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={handleDeleteSelected} variant="destructive" className="mt-6">
                Delete Item
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default RoomCanvas
