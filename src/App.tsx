import { useState } from 'react'
import RoomCanvas from './components/RoomCanvas'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'

function App() {
  const [roomWidth, setRoomWidth] = useState(144)
  const [roomLength, setRoomLength] = useState(120)

  return (
    <div className="max-w-screen-xl mx-auto p-8 text-center">
      <h1 className="text-5xl font-bold leading-tight">Sanctum</h1>
      <p className="my-4">A room layout planner web app designed to allow users to visually and mathematically plan spaces with precision and ease.</p>
      
      <div className="flex gap-8 justify-center my-8">
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="room-width">Room Width (inches):</Label>
          <Input
            id="room-width"
            type="number"
            min="12"
            max="1200"
            value={roomWidth}
            className="w-32"
            onChange={(e) => {
              const value = Number(e.target.value)
              if (!isNaN(value) && value > 0) {
                setRoomWidth(value)
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="room-length">Room Length (inches):</Label>
          <Input
            id="room-length"
            type="number"
            min="12"
            max="1200"
            value={roomLength}
            className="w-32"
            onChange={(e) => {
              const value = Number(e.target.value)
              if (!isNaN(value) && value > 0) {
                setRoomLength(value)
              }
            }}
          />
        </div>
      </div>

      <RoomCanvas roomWidth={roomWidth} roomLength={roomLength} />
    </div>
  )
}

export default App
