const vertexShader = `
attribute vec4 vertexPosition;

uniform float uTime;
uniform sampler2D uPositions;

varying vec2 vUv;

float PI = 3.141592;


void main() {
    
    vec4 pos = texture2D(uPositions, uv);
    vec4 mvPosition = modelViewMatrix * vec4( pos.xyz, 1.0 );
    gl_PointSize = 10. * ( 1. / - mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
}

`

export default vertexShader