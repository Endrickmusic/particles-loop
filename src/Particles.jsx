import { OrbitControls, useFBO } from "@react-three/drei"
import { useFrame, useThree, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import { DoubleSide, Vector2, NearestFilter, RGBAFormat, FloatType, Scene, OrthographicCamera, DataTexture } from "three"

import './shader/simulationMaterial.jsx'
import fragmentShader from "./shader/fragmentShader.js"
import vertexShader from "./shader/vertexShader.js"

export default function Particles({ size = 128, ...props }) {
  
  const simRef = useRef()
  const renderRef = useRef()
  
  // Set up FBO

  const [scene] = useState(() => new Scene())
  const [camera] = useState(() => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1))
  camera.position.set(0, 0, 0.5)
  camera.lookAt(0, 0, 0)
  const [positions] = useState(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]))
  const [uvs] = useState(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]))

  const fbo = useFBO(size, size, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: FloatType
  })

  const fbo1 = useFBO(size, size, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: FloatType
  })


  // const fboTexture = new DataTexture(data, size, size, RGBAFormat, FloatType)
  // fboTexture.magFilter = NearestFilter
  // fboTexture.minFilter = NearestFilter
  // fboTexture.needsUpdate = true

  // console.log(fboTexture)

  // Normalize points
  const particles = useMemo(() => {
    const length = size * size
    const particles = new Float32Array(length * 3)
    for (let i = 0; i < length; i++) {
      let i3 = i * 3
      particles[i3 + 0] = (i % size) / size
      particles[i3 + 1] = i / size / size
    }
    return particles
  }, [size])

    useFrame(( state ) => {

      let time = state.clock.getElapsedTime()
      
      state.gl.setRenderTarget(fbo)
      state.gl.clear()
      state.gl.render(scene, camera)

      renderRef.current.material.uniforms.uPositions.value = fbo.texture
      
      state.gl.setRenderTarget(null)


      simRef.current.uniforms.uTime.value = time
      renderRef.current.material.uniforms.uTime.value = time

    })
  
    const uniforms = useMemo(() => ({
      uPositions: {
        value: null,
      },
      uTime: {
        value: null,
      }
    }), [])
  
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
            />
        </mesh>,
        scene
      )}

      <OrbitControls />    
      <mesh 
      ref={renderRef}
      scale={[1, 1, 1]}
      >
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            ref={simRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={uniforms}
            side={DoubleSide}
          />
        </mesh>
   </>
  )}
