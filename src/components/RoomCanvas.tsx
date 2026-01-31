import { useEffect, useRef } from 'react'
import './RoomCanvas.css'

interface RoomCanvasProps {
  roomWidth: number // in feet
  roomLength: number // in feet
}

const RoomCanvas = ({ roomWidth, roomLength }: RoomCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasWidth = 800
  const canvasHeight = 600

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
      canvasHeight - 10
    )
  }, [roomWidth, roomLength])

  return (
    <div className="room-canvas-container">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="room-canvas"
      />
    </div>
  )
}

export default RoomCanvas
