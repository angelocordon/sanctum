import { useState } from 'react'
import './App.css'
import RoomCanvas from './components/RoomCanvas'

function App() {
  const [roomWidth, setRoomWidth] = useState(12)
  const [roomLength, setRoomLength] = useState(10)

  return (
    <div className="App">
      <h1>Sanctum</h1>
      <p>A room layout planner web app designed to allow users to visually and mathematically plan spaces with precision and ease.</p>
      
      <div className="room-controls">
        <div className="control-group">
          <label htmlFor="room-width">Room Width (feet):</label>
          <input
            id="room-width"
            type="number"
            min="1"
            max="100"
            value={roomWidth}
            onChange={(e) => setRoomWidth(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label htmlFor="room-length">Room Length (feet):</label>
          <input
            id="room-length"
            type="number"
            min="1"
            max="100"
            value={roomLength}
            onChange={(e) => setRoomLength(Number(e.target.value))}
          />
        </div>
      </div>

      <RoomCanvas roomWidth={roomWidth} roomLength={roomLength} />
    </div>
  )
}

export default App
