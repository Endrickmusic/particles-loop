import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import './index.css'
import Particles from './Particles.jsx'

function App() {
  
  const [mouse, setMouse] = useState({ x: 0, y: 0 }); // State to hold mouse coordinates

  const handlePointerMove = (event) => {
    // Update mouse state with new coordinates
    // console.log(event.clientX)
    setMouse({ x: event.clientX, y: event.clientY })
  }

  return (
  <>

    <Canvas
      camera={{ 
        position: [0, 0, 5],
        fov: 40 }}  
      // onPointerMove={handlePointerMove}
    >
      <color attach="background" args={[0x222222]} />
      <Particles 
        // mouse={mouse}
      />
    </Canvas>
  </>
  )
}

export default App
