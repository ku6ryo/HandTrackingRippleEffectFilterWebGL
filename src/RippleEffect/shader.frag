precision mediump float;

uniform sampler2D u_imageTarget;
uniform sampler2D u_imageMask;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

float PI = 3.14159265358979323846264;

void main() {
  vec4 displacement = texture2D(u_imageMask, v_texCoord);
  float theta = displacement.a * 2. * PI;
  vec2 direction = vec2(cos(theta), sin(theta));
  vec2 uv = v_texCoord + direction * displacement.a * 0.2;
  vec4 c = texture2D(u_imageTarget, uv);
  gl_FragColor = vec4(c.rgb, 1.0);
}