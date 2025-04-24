attribute vec3 position;

uniform mat4 worldViewProjection;
uniform vec3 sunDir;

void main() {
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
