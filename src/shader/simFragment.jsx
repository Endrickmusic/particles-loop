const simFragment = `

uniform sampler2D uPositions;
uniform float uTime;
varying vec2 vUv;

void main() {

vec4 pos = texture2D(uPositions, vUv);
// gl_FragColor = vec4( vUv, 0.0, 1.0);
gl_FragColor = pos;       
}

`
export default simFragment