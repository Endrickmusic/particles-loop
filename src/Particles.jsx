import { useThree } from "@react-three/fiber"
import { OrbitControls, useFBO } from "@react-three/drei"
import { useFrame, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useState, useEffect } from "react"
import { DoubleSide, Vector2, NearestFilter, RGBAFormat, FloatType, Scene, OrthographicCamera, DataTexture, BufferGeometry, MeshPhysicalMaterial, InstancedBufferAttribute } from "three"

import CustomShaderMaterial from 'three-custom-shader-material'
import { patchShaders } from 'gl-noise/build/glNoise.m'

import './shader/simulationMaterial.js'
import './shader/renderMaterial.js'

import { generatePositions, infoArray } from './dataTextures.jsx'

export default function Particles({ size = 8 }) {
  
  const simRef = useRef()
  const renderRef = useRef()
  const mouseRef = useRef()
  const instanceRef = useRef()

  const viewport = useThree(state => state.viewport)


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

  const uniforms = useMemo(
    () => ({
      uPositions: {
        value: null,
      },
    }),
    []
  )

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

  useEffect(()=> {

    // creating refs for the instances

    const ref = new Float32Array(size * size *2)

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        let index = (i + j * size)
        ref[ index * 2 + 0 ] = i / (size - 1)
        ref[ index * 2 + 1 ] = j / (size - 1)  
    }
  }
  instanceRef.current.geometry.setAttribute('aRef', new InstancedBufferAttribute(ref, 2))
  },[])


    useFrame(( state ) => {
      let time = state.clock.getElapsedTime()
      
      mouseRef.current.position.set((state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2, 1)

      simRef.current.uniforms.uMouse.value = [(state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2]

      simRef.current.uniforms.uTime.value = time
      renderRef.current.uniforms.uTime.value = time

      state.gl.setRenderTarget(fbo)
      // state.gl.clear()
      state.gl.render(scene, camera)
      state.gl.setRenderTarget(null)

      simRef.current.uniforms.uPositions.value = fbo.texture
      renderRef.current.uniforms.uPositions.value = fbo1.texture
      // console.log(instanceRef.current)
      instanceRef.current.material.uniforms.uPositions.value = fbo.texture

      // Swap render targets
      
      let temp = fbo
      fbo = fbo1
      fbo1 = temp

    })
  
    return (
    <>
        {/* Simulation goes into a FBO/Off-buffer */}
        {createPortal(
          <mesh>

            <planeGeometry
              args={[2, 2]}
            />
            <simulationMaterial 
              ref={simRef} 
              uPositions = {generatePositions(size)}
              uInfo = {infoArray(size)}
            />
          </mesh>,
          scene
      )}

      <OrbitControls /> 
      <mesh
        ref={mouseRef}
        scale={[0.1, 0.1, 0.1]}
        >
          <sphereGeometry />
          <meshBasicMaterial />
        </mesh>

      <points
      scale={[1, 1, 1]}
      >

          <bufferGeometry
          >
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
          transparent={true}
          uInfo={infoArray(size)}
          />
        </points>

      <instancedMesh
        ref={instanceRef}
        args={[null, null, size * size]}
      >
        <boxGeometry 
        args={[0.1, 0.1, 0.1]}
        />
        <CustomShaderMaterial
          baseMaterial={MeshPhysicalMaterial}
          size={0.01}
          vertexShader={patchShaders(shader.vertex)}
          fragmentShader={patchShaders(shader.fragment)}
          uniforms={uniforms}
          transparent
        />
      </instancedMesh>
   </>
  )}

  const shader = {
    vertex: /* glsl */ `
      
      attribute vec2 aRef;

      uniform float uTime;
      uniform sampler2D uPositions;
  
      vec3 displace(vec3 point) {
        vec3 pos = texture2D(uPositions, aRef).rgb;
        vec3 instancePosition = (instanceMatrix * vec4(point, 1.)).xyz;
        return instancePosition + pos;
      }  
  
      vec3 orthogonal(vec3 v) {
        return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
        : vec3(0.0, -v.z, v.y));
      }
  
      vec3 recalcNormals(vec3 newPos) {
        float offset = 0.001;
        vec3 tangent = orthogonal(normal);
        vec3 bitangent = normalize(cross(normal, tangent));
        vec3 neighbour1 = position + tangent * offset;
        vec3 neighbour2 = position + bitangent * offset;
  
        vec3 displacedNeighbour1 = displace(neighbour1);
        vec3 displacedNeighbour2 = displace(neighbour2);
  
        vec3 displacedTangent = displacedNeighbour1 - newPos;
        vec3 displacedBitangent = displacedNeighbour2 - newPos;
  
        return normalize(cross(displacedTangent, displacedBitangent));
      }
  
      void main() {
        vec3 p = displace(position);
        csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.);
        csm_Normal = recalcNormals(p);
      }
      `,
    fragment: /* glsl */ `
      void main() {
        csm_DiffuseColor = vec4(1.);
      }
      `,
  }