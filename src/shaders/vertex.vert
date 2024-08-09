#version 330 core

layout (location = 0) in vec3 position;

out vec2 u_resolution;

void main() {
    gl_Position = vec4(position, 1.0);
    u_resolution = vec2(1000.0, 650.0);
}