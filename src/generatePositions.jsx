import { DataTexture, RGBAFormat, FloatType, NearestFilter } from "three"

export const generatePositions = (size) => {
  
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
  


const positionsTexture = new DataTexture(
    data,
    size,
    size,
    RGBAFormat,
    FloatType
  )
  positionsTexture.magFilter = NearestFilter
  positionsTexture.minFilter = NearestFilter
  positionsTexture.needsUpdate = true

  return positionsTexture;
}
