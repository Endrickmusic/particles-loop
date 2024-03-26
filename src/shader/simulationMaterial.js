import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Create a custom simulation shader material

const SimulationMaterial = shaderMaterial (
     
    // uniforms 
    {
      uPositions: null,
      uTime: 0
    },
      
    //  vertex shader
    `
        varying vec2 vUv;
        
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 5.0;
          vUv = uv;
        }`,

    // fragment shader  
    `
        
        uniform sampler2D uPositions;
        uniform float uTime;
        varying vec2 vUv;
   
        void main() {

        vec4 pos = texture2D(uPositions, vUv);

        pos.xy += vec2(0.001);

        gl_FragColor = pos;       
        }`

    )

// Make the simulation material available as a JSX element in our canvas
extend({ SimulationMaterial })