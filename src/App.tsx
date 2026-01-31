import { useState } from 'react'
import RoomCanvas from './components/RoomCanvas'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'

function App() {
  const [roomWidth, setRoomWidth] = useState(144)
  const [roomLength, setRoomLength] = useState(120)

  return (
    <>
      {/* App header and controls as overlay - positioned in bottom-right */}
      <div className="fixed bottom-4 right-4 z-20 pointer-events-none">
        <div className="pointer-events-auto p-6 border border-input rounded-lg bg-card shadow-lg">
          <h1 className="text-2xl font-bold mb-2">Sanctum</h1>
          <p className="text-xs mb-4 max-w-xs">A room layout planner web app</p>
          
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 text-left">
              <Label htmlFor="room-width" className="text-xs">Room Width (inches):</Label>
              <Input
                id="room-width"
                type="number"
                min="12"
                max="1200"
                value={roomWidth}
                className="w-28 h-8 text-sm"
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (!isNaN(value) && value > 0) {
                    setRoomWidth(value)
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2 text-left">
              <Label htmlFor="room-length" className="text-xs">Room Length (inches):</Label>
              <Input
                id="room-length"
                type="number"
                min="12"
                max="1200"
                value={roomLength}
                className="w-28 h-8 text-sm"
                onChange={(e) => {
                  const value = Number(e.target.value)
                  if (!isNaN(value) && value > 0) {
                    setRoomLength(value)
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <RoomCanvas roomWidth={roomWidth} roomLength={roomLength} />
    </>
  )
}

export default App
