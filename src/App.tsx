import { useState } from 'react'
import './App.css'
import RoomCanvas from './components/RoomCanvas'

function App() {
  const [roomWidth, setRoomWidth] = useState(144)
  const [roomLength, setRoomLength] = useState(120)

  return (
    <div className="App">
      <h1>Sanctum</h1>
      <p>A room layout planner web app designed to allow users to visually and mathematically plan spaces with precision and ease.</p>
      
      <div className="room-controls">
        <div className="control-group">
          <label htmlFor="room-width">Room Width (inches):</label>
          <input
            id="room-width"
            type="number"
            min="12"
            max="1200"
            value={roomWidth}
            onChange={(e) => {
              const value = Number(e.target.value)
              if (!isNaN(value) && value > 0) {
                setRoomWidth(value)
              }
            }}
          />
        </div>
        <div className="control-group">
          <label htmlFor="room-length">Room Length (inches):</label>
          <input
            id="room-length"
            type="number"
            min="12"
            max="1200"
            value={roomLength}
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
