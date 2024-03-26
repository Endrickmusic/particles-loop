import { ShaderMaterial, DataTexture, RGBAFormat, FloatType, NearestFilter } from 'three'
import { extend } from '@react-three/fiber'

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

// Create a custom simulation shader material
class SimulationMaterial extends ShaderMaterial {
  constructor(size) {

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

    const simulationUniforms = {

      // Pass the positions Data Texture as a uniform
     
      uPositions: { value: positionsTexture },
      uTime: { value: 0 }
   
    }

    super({
      uniforms: simulationUniforms,
      
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

        pos.xy += vec2(0.001);

        gl_FragColor = pos;       
        }`

    })
  }
}

// Make the simulation material available as a JSX element in our canva
extend({ SimulationMaterial: SimulationMaterial });