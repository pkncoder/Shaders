precision mediump float;

uniform vec2 u_resolution;

struct RayTracingMaterial {
    vec3 color;
};

struct Sphere {
    vec3 coords;
    float radius;
    RayTracingMaterial material;
};

struct Ray {
    vec3 orgin;
    vec3 direction;
};

float intersect(Ray ray, Sphere sphere) {
    vec3 oc = ray.orgin - sphere.coords;

    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(oc, ray.direction);
    float c = dot(oc, oc) - sphere.radius * sphere.radius;

    // Find our determinate
    float det = pow(b, 2.0) - 4.0 * a * c;

    if (det > 0.0) {
        return 1.0;
    }

    else return -1.0;
}



void main() {
    vec3 color;

    vec2 uv = ((gl_FragCoord.xy / u_resolution) * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);

    Ray ray = Ray(
        vec3(0.0, 0.0, 10.0),
        normalize(vec3(uv, 1.0))
    );

    Sphere sphere = Sphere(
        vec3(0.0, -1000.0, -80.0),
        1000.0,
        RayTracingMaterial(vec3(1.0))
    );
    if (intersect(ray, sphere) == 1.0) {color = vec3(1.0) * sphere.material.color;}

    else {color = vec3(0.0, 0.0, 0.0);}

    gl_FragColor = vec4(color, 1.0);
}