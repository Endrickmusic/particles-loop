import { useThree } from "@react-three/fiber"
import { OrbitControls, useFBO, useTexture } from "@react-three/drei"
import { useFrame, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"
import {
  DoubleSide,
  Vector2,
  NearestFilter,
  RGBAFormat,
  FloatType,
  Scene,
  OrthographicCamera,
  DataTexture,
  BufferGeometry,
  MeshMatcapMaterial,
} from "three"

import "./shader/simulationMaterial.js"
import "./shader/renderMaterial.js"

import { generatePositions, infoArray } from "./dataTextures.jsx"
import CustomShaderMaterial from "three-custom-shader-material"
import { patchShaders } from "gl-noise/build/glNoise.m"

const shader = {
  vertex: /* glsl */ `
      
      attribute vec2 ref;

      uniform float uTime;
      uniform sampler2D uPosition;
      uniform sampler2D uVelocity;

      vec3 rotate3D(vec3 v, vec3 vel){
        vec3 newPos = v;
        vec3 up = vec3(0, 1, 0);
        vec3 axis = normalize(cross(up, vel));
        float angle = acos(dot(up, normalize(vel)));
        newPos = newPos * cos (angle) + cross(axis, newPos) * sin(angle) + axis * dot(axis, newPos) * (1. - cos(angle));
        return newPos;
    }

      vec3 displace(vec3 point, vec3 vel) {
        vec3 pos = texture2D(uPosition, ref).rgb;
        vec3 copyPoint = rotate3D(point, vel);
        vec3 instancePosition = (instanceMatrix * vec4(copyPoint, 1.)).xyz;
        return instancePosition + pos;
      }  
  
      void main() {
        vec3 vel = texture2D(uVelocity, ref).rgb;
        vec3 p = displace(position, vel);
        csm_PositionRaw = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.);
        csm_Normal = rotate3D( normal, vel );
      }
      `,
  fragment: /* glsl */ `
      void main() {
        csm_DiffuseColor = vec4(1.);
      }
      `,
}

export default function Particles({ size = 128 }) {
  const simRef = useRef()
  const renderRef = useRef()
  const mouseRef = useRef()
  const iRef = useRef()

  const viewport = useThree((state) => state.viewport)

  const [matcap1, matcap2, matcap3, matcap4] = useTexture([
    "./textures/matcap01.png",
    "./textures/matcap02.jpg",
    "./textures/matcap03.jpg",
    "./textures/matcap07.jpg",
  ])

  // Set up FBO

  const [scene] = useState(() => new Scene())
  const [camera] = useState(
    () => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1)
  )
  camera.position.set(0, 0, 0.5)
  camera.lookAt(0, 0, 0)

  let fbo = useFBO(size, size, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: FloatType,
  })

  let fbo1 = useFBO(size, size, {
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    format: RGBAFormat,
    type: FloatType,
  })

  const uniforms = useMemo(
    () => ({
      uPosition: {
        value: null,
      },
      uVelocity: {
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
        let index = i + j * size

        positions[index * 3 + 0] = Math.random()
        positions[index * 3 + 1] = Math.random()
        positions[index * 3 + 2] = 0

        ref[index * 2 + 0] = i / size
        ref[index * 2 + 1] = j / size
      }
    }
    return { positions, ref }
  }, [size])

  useFrame((state) => {
    let time = state.clock.getElapsedTime()

    mouseRef.current.position.set(
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
      1
    )

    simRef.current.uniforms.uMouse.value = [
      (state.pointer.x * viewport.width) / 2,
      (state.pointer.y * viewport.height) / 2,
    ]

    simRef.current.uniforms.uTime.value = time
    renderRef.current.uniforms.uTime.value = time

    state.gl.setRenderTarget(fbo)
    // state.gl.clear()
    state.gl.render(scene, camera)
    state.gl.setRenderTarget(null)

    simRef.current.uniforms.uPositions.value = fbo.texture
    renderRef.current.uniforms.uPositions.value = fbo1.texture

    // Pass mouse coordinates to shader uniform

    // simRef.current.uniforms.uMouse.value = [mouse.x, mouse.y]
    // console.log(simRef.current.uniforms.uMouse.value)

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
          <planeGeometry args={[2, 2]} />
          <simulationMaterial
            ref={simRef}
            uPositions={generatePositions(size)}
            uInfo={infoArray(size)}
          />
        </mesh>,
        scene
      )}

      <OrbitControls />
      <mesh ref={mouseRef} scale={[0.1, 0.1, 0.1]}>
        <sphereGeometry />
        <meshBasicMaterial />
      </mesh>

      <points scale={[1, 1, 1]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-ref"
            count={ref.length / 2}
            array={ref}
            itemSize={2}
          />
        </bufferGeometry>
        <renderMaterial
          ref={renderRef}
          transparent={true}
          uInfo={infoArray(size)}
        />
      </points>
      <instancedMesh ref={iRef} args={[null, null, size * size]}>
        <boxGeometry args={[0.01, 0.07, 0.01]} />
        <CustomShaderMaterial
          baseMaterial={MeshMatcapMaterial}
          size={0.01}
          vertexShader={patchShaders(shader.vertex)}
          fragmentShader={patchShaders(shader.fragment)}
          uniforms={uniforms}
          transparent
          matcap={matcap3}
        />
      </instancedMesh>
    </>
  )
}
