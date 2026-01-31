import { useEffect, useRef, useState } from 'react'
import './RoomCanvas.css'

// Canvas dimensions
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

interface RoomCanvasProps {
  roomWidth: number // in feet
  roomLength: number // in feet
}

interface Item {
  id: string
  width: number // in feet
  depth: number // in feet
  label: string
  x: number // position in feet
  y: number // position in feet
}

const RoomCanvas = ({ roomWidth, roomLength }: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [items, setItems] = useState<Item[]>([])
  const [newItemWidth, setNewItemWidth] = useState('')
  const [newItemDepth, setNewItemDepth] = useState('')
  const [newItemLabel, setNewItemLabel] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scale factor (pixels per foot)
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

    // Grid spacing: 1 foot in real world
    const gridSpacing = scale // pixels per foot

    // Vertical grid lines
    for (let x = 0; x <= roomWidth; x++) {
      const px = offsetX + x * gridSpacing
      ctx.beginPath()
      ctx.moveTo(px, offsetY)
      ctx.lineTo(px, offsetY + roomLengthPx)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let y = 0; y <= roomLength; y++) {
      const py = offsetY + y * gridSpacing
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

      // Draw item rectangle
      ctx.fillStyle = 'rgba(100, 108, 255, 0.3)'
      ctx.strokeStyle = '#646cff'
      ctx.lineWidth = 2
      ctx.fillRect(itemX, itemY, itemWidth, itemDepth)
      ctx.strokeRect(itemX, itemY, itemWidth, itemDepth)

      // Draw label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.label, itemX + itemWidth / 2, itemY + itemDepth / 2 - 10)

      // Draw dimensions
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(
        `${item.width} × ${item.depth} ft`,
        itemX + itemWidth / 2,
        itemY + itemDepth / 2 + 10
      )
    })

    // Draw dimension labels
    ctx.fillStyle = '#fff'
    ctx.font = '14px system-ui, sans-serif'
    ctx.textAlign = 'center'

    // Width label (top)
    ctx.fillText(
      `${roomWidth} ft`,
      offsetX + roomWidthPx / 2,
      offsetY - 10
    )

    // Length label (right side)
    ctx.save()
    ctx.translate(offsetX + roomWidthPx + 20, offsetY + roomLengthPx / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${roomLength} ft`, 0, 0)
    ctx.restore()

    // Display scale factor
    ctx.textAlign = 'left'
    ctx.fillStyle = '#888'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(
      `Scale: ${scale.toFixed(2)} pixels/foot`,
      10,
      CANVAS_HEIGHT - 10
    )
  }, [roomWidth, roomLength, items])

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
      x: 1, // Start 1 foot from left
      y: 1, // Start 1 foot from top
    }

    setItems([...items, newItem])
    setNewItemWidth('')
    setNewItemDepth('')
    setNewItemLabel('')
  }

  return (
    <div className="room-canvas-container">
      <div className="item-controls">
        <h3>Add Custom Item</h3>
        <div className="item-form">
          <div className="control-group">
            <label htmlFor="item-width">Width (feet):</label>
            <input
              id="item-width"
              type="number"
              min="0.1"
              step="0.1"
              value={newItemWidth}
              onChange={(e) => setNewItemWidth(e.target.value)}
              placeholder="e.g., 3"
            />
          </div>
          <div className="control-group">
            <label htmlFor="item-depth">Depth (feet):</label>
            <input
              id="item-depth"
              type="number"
              min="0.1"
              step="0.1"
              value={newItemDepth}
              onChange={(e) => setNewItemDepth(e.target.value)}
              placeholder="e.g., 2"
            />
          </div>
          <div className="control-group">
            <label htmlFor="item-label">Label:</label>
            <input
              id="item-label"
              type="text"
              value={newItemLabel}
              onChange={(e) => setNewItemLabel(e.target.value)}
              placeholder="e.g., Desk"
            />
          </div>
          <button onClick={handleAddItem}>Add Item</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="room-canvas"
      />
    </div>
  )
}

export default RoomCanvas
