#version 330 core

layout (location = 0) in vec3 position;

uniform int u_time;

out vec2 u_resolution;

void main() {
    gl_Position = vec4(position, 1.0);
    u_resolution = vec2(3000.0, 2000.0);
}