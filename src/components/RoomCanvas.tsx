import { useEffect, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'

// Canvas dimensions
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

interface RoomCanvasProps {
  roomWidth: number // in inches
  roomLength: number // in inches
}

interface Item {
  id: string
  width: number // in inches
  depth: number // in inches
  label: string
  x: number // position in inches
  y: number // position in inches
  rotation: number // rotation angle in degrees
}

const RoomCanvas = ({ roomWidth, roomLength }: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [newItemWidth, setNewItemWidth] = useState('')
  const [newItemDepth, setNewItemDepth] = useState('')
  const [newItemLabel, setNewItemLabel] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isRotating, setIsRotating] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scale factor (pixels per inch)
    // We want to fit the room in the canvas with some padding
    const padding = 40 // pixels
    const availableWidth = canvas.width - 2 * padding
    const availableHeight = canvas.height - 2 * padding

    // Use a single scale factor for both axes to maintain proportions
    const scaleX = availableWidth / roomWidth
    const scaleY = availableHeight / roomLength
    const scale = Math.min(scaleX, scaleY) // Use the smaller scale to fit both dimensions

    // Calculate actual room dimensions in pixels
    const roomWidthPx = roomWidth * scale
    const roomLengthPx = roomLength * scale

    // Center the room in the canvas
    const offsetX = (canvas.width - roomWidthPx) / 2
    const offsetY = (canvas.height - roomLengthPx) / 2

    // Draw grid
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 0.5

    // Grid spacing: minor lines every 2 inches, major lines every 12 inches (1 foot)
    const pixelsPerInch = scale

    // Vertical grid lines
    for (let x = 0; x <= roomWidth; x += 2) {
      const px = offsetX + x * pixelsPerInch
      const isMajor = x % 12 === 0
      ctx.strokeStyle = isMajor ? '#666' : '#444'
      ctx.lineWidth = isMajor ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(px, offsetY)
      ctx.lineTo(px, offsetY + roomLengthPx)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0; y <= roomLength; y += 2) {
      const py = offsetY + y * pixelsPerInch
      const isMajor = y % 12 === 0
      ctx.strokeStyle = isMajor ? '#666' : '#444'
      ctx.lineWidth = isMajor ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(offsetX, py)
      ctx.lineTo(offsetX + roomWidthPx, py)
      ctx.stroke()
    }

    // Draw room boundaries
    ctx.strokeStyle = '#646cff'
    ctx.lineWidth = 2
    ctx.strokeRect(offsetX, offsetY, roomWidthPx, roomLengthPx)

    // Draw items
    items.forEach((item) => {
      const itemX = offsetX + item.x * scale
      const itemY = offsetY + item.y * scale
      const itemWidth = item.width * scale
      const itemDepth = item.depth * scale

      ctx.save()
      
      // Translate to item center for rotation
      ctx.translate(itemX + itemWidth / 2, itemY + itemDepth / 2)
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
        const handleDistance = Math.max(itemWidth, itemDepth) / 2 + 20
        ctx.fillStyle = '#ffaa00'
        ctx.beginPath()
        ctx.arc(0, -handleDistance, 6, 0, 2 * Math.PI)
        ctx.fill()
      }
      
      ctx.restore()
    })

    // Draw dimension labels
    ctx.fillStyle = '#fff'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Width label (top)
    ctx.fillText(
      `${roomWidth}"`,
      offsetX + roomWidthPx / 2,
      offsetY - 10
    )

    // Length label (right side)
    ctx.save()
    ctx.translate(offsetX + roomWidthPx + 20, offsetY + roomLengthPx / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${roomLength}"`, 0, 0)
    ctx.restore()

    // Display scale factor
    ctx.textAlign = 'left'
    ctx.fillStyle = '#888'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(
      `Scale: ${scale.toFixed(2)} pixels/inch`,
      10,
      CANVAS_HEIGHT - 10
    )
  }, [roomWidth, roomLength, items, selectedItemId])

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

  // Helper function to get scale and offsets
  const getCanvasTransform = () => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const padding = 40
    const availableWidth = canvas.width - 2 * padding
    const availableHeight = canvas.height - 2 * padding
    const scaleX = availableWidth / roomWidth
    const scaleY = availableHeight / roomLength
    const scale = Math.min(scaleX, scaleY)
    const roomWidthPx = roomWidth * scale
    const roomLengthPx = roomLength * scale
    const offsetX = (canvas.width - roomWidthPx) / 2
    const offsetY = (canvas.height - roomLengthPx) / 2

    return { scale, offsetX, offsetY }
  }

  // Helper to check if a point is inside a rotated rectangle
  const isPointInItem = (
    px: number,
    py: number,
    item: Item,
    transform: { scale: number; offsetX: number; offsetY: number }
  ) => {
    const { scale, offsetX, offsetY } = transform
    const itemCenterX = offsetX + (item.x + item.width / 2) * scale
    const itemCenterY = offsetY + (item.y + item.depth / 2) * scale
    const itemWidth = item.width * scale
    const itemDepth = item.depth * scale

    // Translate point to item's coordinate system
    const dx = px - itemCenterX
    const dy = py - itemCenterY

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
    px: number,
    py: number,
    item: Item,
    transform: { scale: number; offsetX: number; offsetY: number }
  ) => {
    const { scale, offsetX, offsetY } = transform
    const itemCenterX = offsetX + (item.x + item.width / 2) * scale
    const itemCenterY = offsetY + (item.y + item.depth / 2) * scale
    const itemWidth = item.width * scale
    const itemDepth = item.depth * scale
    const handleDistance = Math.max(itemWidth, itemDepth) / 2 + 20

    // Rotate handle position around the item center
    const angle = (item.rotation * Math.PI) / 180
    const handleX = itemCenterX + handleDistance * Math.sin(angle)
    const handleY = itemCenterY - handleDistance * Math.cos(angle)

    const dx = px - handleX
    const dy = py - handleY
    return Math.sqrt(dx * dx + dy * dy) <= 10
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    const transform = getCanvasTransform()
    if (!transform) return

    // Check items in reverse order (top to bottom)
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i]

      // Check if clicking on rotation handle of selected item
      if (item.id === selectedItemId && isPointOnRotationHandle(px, py, item, transform)) {
        setIsRotating(true)
        return
      }

      // Check if clicking on item
      if (isPointInItem(px, py, item, transform)) {
        setSelectedItemId(item.id)
        setIsDragging(true)
        
        // Calculate offset from item position to click position in inches
        const clickXInInches = (px - transform.offsetX) / transform.scale
        const clickYInInches = (py - transform.offsetY) / transform.scale
        setDragOffset({
          x: clickXInInches - item.x,
          y: clickYInInches - item.y,
        })
        return
      }
    }

    // Click on empty space - deselect
    setSelectedItemId(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top

    const transform = getCanvasTransform()
    if (!transform) return

    const selectedItem = items.find((item) => item.id === selectedItemId)
    if (!selectedItem) return

    if (isDragging) {
      // Convert pixel position to inches
      const newXInInches = (px - transform.offsetX) / transform.scale - dragOffset.x
      const newYInInches = (py - transform.offsetY) / transform.scale - dragOffset.y

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
      const itemCenterX = transform.offsetX + (selectedItem.x + selectedItem.width / 2) * transform.scale
      const itemCenterY = transform.offsetY + (selectedItem.y + selectedItem.depth / 2) * transform.scale

      // Calculate angle from item center to mouse
      const dx = px - itemCenterX
      const dy = py - itemCenterY
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
    setIsDragging(false)
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
    <div className="flex flex-col justify-center items-center my-8">
      <div className="mb-8 p-6 border border-input rounded-lg bg-card w-full max-w-3xl">
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
          <Button onClick={handleAddItem} className="mt-6">Add Item</Button>
        </div>
      </div>
      {selectedItemId && (
        <div className="mb-8 p-6 border-2 border-orange-500 rounded-lg bg-orange-500/10 w-full max-w-3xl">
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
            <Button onClick={handleDeleteSelected} variant="destructive" className="mt-6">
              Delete Item
            </Button>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-input bg-card rounded cursor-default"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />
    </div>
  )
}

export default RoomCanvas
