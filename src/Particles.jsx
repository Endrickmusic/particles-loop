import { OrbitControls, useFBO } from "@react-three/drei"
import { useFrame, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import { DoubleSide, Vector2, NearestFilter, RGBAFormat, FloatType, Scene, OrthographicCamera, DataTexture, BufferGeometry } from "three"

import './shader/simulationMaterial.js'
import './shader/renderMaterial.js'

import { generatePositions } from './generatePositions.jsx'

export default function Particles({ size = 256, ...props }) {
  
  const simRef = useRef()
  const renderRef = useRef()
  
  // Set up FBO

  const [scene] = useState(() => new Scene())
  const [camera] = useState(() => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1))
  camera.position.set(0, 0, 0.5)
  camera.lookAt(0, 0, 0)

  let fbo = useFBO(size, size, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: FloatType
  })

  let fbo1 = useFBO(size, size, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: FloatType
  })


  const { positions, ref } = useMemo(() => {
      
    // Generate positions and uvs for the particles

      const count = size * size
      const positions = new Float32Array(count * 3)
      const ref = new Float32Array(count * 2)

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          let index = (i + j * size)
  
          positions[ index * 3 + 0 ] = Math.random()
          positions[ index * 3 + 1 ] = Math.random()
          positions[ index * 3 + 2 ] = 0

          ref[ index * 2 + 0 ] = i / size 
          ref[ index * 2 + 1 ] = j / size 
      }
    }
    return { positions, ref }
  },[size])

    console.log(simRef.current)

    useFrame(( state ) => {

      let time = state.clock.getElapsedTime()
      
      simRef.current.uniforms.uTime.value = time
      renderRef.current.uniforms.uTime.value = time

      

      state.gl.setRenderTarget(fbo)
      // state.gl.clear()
      state.gl.render(scene, camera)
      state.gl.setRenderTarget(null)

      simRef.current.uniforms.uPositions.value = fbo.texture
      renderRef.current.uniforms.uPositions.value = fbo1.texture

      // Swap render targets
      
      let temp = fbo
      fbo = fbo1
      fbo1 = temp

    })
  
    const uniforms = useMemo(() => ({
      uPositions: {
        value: null,
      },
      uTime: {
        value: 0,
      }
    }), [size])
  
    return (
    <>
        {/* Simulation goes into a FBO/Off-buffer */}
        {createPortal(
          <mesh>

            <planeGeometry
              args={[2, 2]}
            />
            <simulationMaterial 
              args={[size]}
              ref={simRef} 
              uPositions = {generatePositions(size)}
            />
          </mesh>,
          scene
      )}

      <OrbitControls />    
      <points
      scale={[1, 1, 1]}
      >
          <bufferGeometry>
              <bufferAttribute
              attach = 'attributes-position'
              count = {positions.length / 3}
              array={positions}
              itemSize ={3}
              />
              <bufferAttribute
              attach = 'attributes-ref'
              count = {ref.length / 2}
              array={ref}
              itemSize ={2}
              />
          </bufferGeometry>
          <renderMaterial 
          ref={renderRef}
          />
        </points>
   </>
  )}

