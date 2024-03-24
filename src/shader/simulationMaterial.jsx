import { ShaderMaterial, DataTexture, RGBAFormat, FloatType, NearestFilter } from 'three'
import { extend } from '@react-three/fiber'



// Create a custom simulation shader material
class SimulationMaterial extends ShaderMaterial {
  constructor(size) {



    super({
      
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vUv = uv;
        }`,

      fragmentShader: `
        
        uniform sampler2D uPositions;
        uniform float uTime;
        varying vec2 vUv;
   
        void main() {

        vec4 pos = texture2D(uPositions, vUv);
        // gl_FragColor = vec4( vUv, 0.0, 1.0);
        gl_FragColor = pos;       
        }`

    })
  }
}

// Make the simulation material available as a JSX element in our canva
extend({ SimulationMaterial: SimulationMaterial });