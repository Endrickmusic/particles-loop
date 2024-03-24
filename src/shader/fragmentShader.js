const fragmentShader = `

uniform float uTime;
uniform float progress;
uniform sampler2D uPositions;
uniform vec4 uResolution;

varying vec2 vUv;
varying vec3 vPositions;
varying vec3 vColor;
float PI = 3.1415926;


void main() {

    // Time varying pixel color
    vec3 col = 0.5 + 0.5 * cos(uTime + vUv.xyx + vec3(0,2,4));
    // vec4 pos = texture2D(uPositions, vUv);

    // Output to screen
    gl_FragColor = vec4(col, 1.0);
    // gl_FragColor = vec4(vUv, 0.0, 1.0);
    // gl_FragColor = pos;
	
}

`

export default fragmentShader