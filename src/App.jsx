import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import './index.css'
import Particles from './Particles.jsx'

function App() {
  
  return (
  <>

    <Canvas
      camera={{ 
        position: [0, 0, 5],
        fov: 40 }}  
    >
      <color attach="background" args={[0x222222]} />
      <Particles 
      />
    </Canvas>
  </>
  )
}

export default App
