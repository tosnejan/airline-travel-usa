export function size(vector) {
  return Math.sqrt(vector.reduce((sum, x) => sum + x*x, 0))
}

export function dot(A,B) {
  let ret = 0
  for(let i = 0; i < A.length; i++){
    ret += A[i]*B[i]
  }
  return ret
}

export function difference(A,B) {
  return A.map((v,i) => v-B[i])
}
