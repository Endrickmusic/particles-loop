import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const RenderMaterial = shaderMaterial(
    // uniforms
    {
        uTime: 0,
        uPositions: null
    },
    // vertex shader
    `
    attribute vec2 ref;

    uniform float uTime;
    uniform sampler2D uPositions;

    varying vec2 vRef;

    float PI = 3.141592;

    void main() {
    
    vec4 pos = texture2D(uPositions, ref);
    vec4 mvPosition = modelViewMatrix * vec4( pos.xyz, 1.0 );
    gl_PointSize = 20. * ( 1. / - mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
    vRef = ref;
}
    `,
    // fragment shader
    `
    uniform float uTime;
    uniform sampler2D uPositions;
    uniform vec4 uResolution;

    varying vec2 vRef;
    varying vec3 vPositions;
    varying vec3 vColor;
    float PI = 3.1415926;


    void main() {

    // Time varying pixel color
    vec3 col = 0.5 + 0.5 * cos(uTime + vRef.xyx + vec3(0,2,4));
    // vec4 pos = texture2D(uPositions, vUv);

    // Output to screen
    gl_FragColor = vec4(col, 1.0);
    // gl_FragColor = vec4(vUv, 0.0, 1.0);
    // gl_FragColor = pos;
	
}
    `
)

extend({ RenderMaterial })