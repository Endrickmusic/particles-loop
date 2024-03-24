import { OrbitControls, useFBO } from "@react-three/drei"
import { useFrame, useThree, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import { DoubleSide, Vector2, NearestFilter, RGBAFormat, FloatType, Scene, OrthographicCamera, DataTexture } from "three"

import './shader/simulationMaterial.jsx'
import fragmentShader from "./shader/fragmentShader.js"
import vertexShader from "./shader/vertexShader.js"

import simFragment from "./shader/simFragment.jsx"
import simVertex from "./shader/simVertex.jsx"


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

    // Create a Data Texture with our positions data

    const positionsTexture = new DataTexture(
      generatePositions(size),
      size,
      size,
      RGBAFormat,
      FloatType
    )
    positionsTexture.magFilter = NearestFilter
    positionsTexture.minFilter = NearestFilter
    positionsTexture.needsUpdate = true

    console.log(positionsTexture)

    const simulationUniforms = useMemo(() => ({

      // Pass the positions Data Texture as a uniform
     
      uPositions: { value: positionsTexture },
      uTime: { value: 0 }
   
    }))

    useFrame(( state ) => {

      let time = state.clock.getElapsedTime()
      
      state.gl.setRenderTarget(fbo)
      state.gl.clear()
      state.gl.render(scene, camera)
      state.gl.setRenderTarget(null)


      simRef.current.uniforms.uTime.value = time
      // renderRef.current.material.uniforms.uPositions.value = fbo.texture
      // simRef.current.uniforms.uPositions.value = fbo.texture
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

    const viewport = useThree(state => state.viewport)
  
    return (
    <>
            {/* Simulation goes into a FBO/Off-buffer */}
            {createPortal(
        <mesh>

            <planeGeometry
              args={[1, 1]}
            />
            {/* <simulationMaterial 
              args={[size]}
              uniforms={simulationUniforms}
              ref={simRef}  */}
            <shaderMaterial
              vertexShader={simVertex}
              fragmentShader={simFragment}
              uniforms={uniforms}
            />
        </mesh>,
        scene
      )}

      <OrbitControls />    
      <mesh 
      ref={renderRef}
      scale={[1, 1, 1]}
      >
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            ref={simRef}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={simulationUniforms}
            side={DoubleSide}
          />
          {/* <simulationMaterial
          args={[size]}
          side={DoubleSide} */}
          
        </mesh>
   </>
  )}

  const generatePositions = (size) => {
  
    const length = size * size * 4
    
    const data = new Float32Array(length)
  
    for(let i = 0; i < size; i++){
      for(let j = 0; j < size; j++){
        let index = (i + j * size) * 4
        let theta = Math.random() * Math.PI * 2
        let r = 0.5 + 0.5 * Math.random() 
  
        data[ index + 0 ] = r * Math.cos(theta)
        data[ index + 1 ] = r * Math.sin(theta)
        data[ index + 2 ] = 1.
        data[ index + 3 ] = 1.
      }
    }
  
    return data;
  };