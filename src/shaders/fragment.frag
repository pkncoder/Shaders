#version 330 core
precision highp float;

in vec2 u_resolution;

uniform bool u_mouseMove;

uniform int u_raysPerPixel;

uniform int u_time;

uniform float u_fov;

uniform float u_mousePosX;
uniform float u_mousePosY;

vec2 u_mouse = vec2(u_mousePosX, u_mousePosY);

#define PI 3.14159265359
#define softShadowRayNum 30.0

struct RayTracingMaterial {
    vec3 color;
    float emmisive;
    float roughness;
};

struct Sphere {
    vec3 coords;
    float radius;
    RayTracingMaterial material;
};

struct HitInfo {
    bool hit;
    vec3 hitPos;
    float dist;
    vec3 normal;
    Sphere sphereHit;
};

struct Ray {
    vec3 orgin;
    vec3 direction;
};

HitInfo intersect(Ray ray, Sphere sphere) {
    HitInfo hit;

    hit.hit = false;

    vec3 rayOffset = ray.orgin - sphere.coords;

    float a = dot(ray.direction, ray.direction);
    float b = dot(rayOffset, ray.direction);
    float c = dot(rayOffset, rayOffset) - sphere.radius * sphere.radius;

    float det = b * b - a * c;

    if (det < 0.0) {return hit;}

    float t0 = (-b - sqrt(det)) / (a);

    if (t0 < 0.0) {

        float t1 = (-b + sqrt(det)) / (a);

        if (t1 > 0.0) {
            hit.hit = true;
            hit.hitPos = ray.orgin + ray.direction * t1;
            hit.dist = t1;
            hit.normal = normalize(hit.hitPos - sphere.coords);
            hit.sphereHit = sphere;
        }

        return hit;
    }

    hit.hit = true;
    hit.hitPos = ray.orgin + ray.direction * t0;
    hit.dist = t0;
    hit.normal = normalize(hit.hitPos - sphere.coords);
    hit.sphereHit = sphere;

    return hit;
}

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

int NextRandom(inout int state)
{
    state = state * 747796405 + 2891336453;
    int result = ((state >> ((state >> 28) + 4)) ^ state) * 277803737;
    result = (result >> 22) ^ result;
    return result;
}

float RandomValue(inout int state)
{
    return NextRandom(state) / 4294967295.0; // 2^32 - 1
}

// Random value in normal distribution (with mean=0 and sd=1)
float RandomValueNormalDistribution(inout int state)
{
    // Thanks to https://stackoverflow.com/a/6178290
    float theta = 2 * 3.1415926 * RandomValue(state);
    float rho = sqrt(-2 * log(RandomValue(state)));
    return rho * cos(theta);
}

// Calculate a random direction
vec3 RandomDirection(inout int state)
{
    // Thanks to https://math.stackexchange.com/a/1585996
    float x = RandomValueNormalDistribution(state);
    float y = RandomValueNormalDistribution(state);
    float z = RandomValueNormalDistribution(state);
    return normalize(vec3(x, y, z));
}

HitInfo calculateClosestHit(Ray ray) {

    Sphere[3] spheres;

    spheres[0] = Sphere(
        vec3(-100.0, 0.0, 108.0),
        100.0,
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            100.0,
            1.0
        )
    );
    spheres[1] = Sphere(
        vec3(5.0, -10.0, -10.0),
        10.0,
        RayTracingMaterial(
            vec3(0.29, 0.28, 0.28),
            0.0,
            1.0
        )
    );
    spheres[2] = Sphere(
        vec3(-5.0, 5.0, 8.0),
        1.5,
        RayTracingMaterial(
            vec3(0.38, 0.0, 1.0),
            0.0,
            1.0
        )
    );

    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.dist = 1.0 / 0.0; // Infinity

    for (int i = 0; i < spheres.length(); i++) {
        HitInfo sphereHit = intersect(ray, spheres[i]);

        if (sphereHit.hit && sphereHit.dist < closestHit.dist) {
            closestHit = sphereHit;
        }
    }

    return closestHit;
}

vec3 trace(Ray ray, vec2 uv, int depth) {
    int numBounces = 2;

    vec3 colorMult = vec3(1.0);
    vec3 color = vec3(0.0);

    for (int b = 0; b < numBounces; b++) { 
        HitInfo closestHit = calculateClosestHit(ray);

        if (!closestHit.hit) {
            break;
        }

        // check
        int pixelIndex = int(gl_FragCoord.y * u_resolution.x + gl_FragCoord.x);
	    int rngState = pixelIndex + (u_time) * 719393;
        vec3 offset = (RandomDirection(rngState));

        // check
        ray.orgin = closestHit.hitPos + closestHit.normal * 0.1;
        ray.direction = normalize(closestHit.normal + offset);

        vec3 emittedLight = closestHit.sphereHit.material.emmisive * closestHit.sphereHit.material.color;
        color += emittedLight * colorMult;
        colorMult *= closestHit.sphereHit.material.color;
    }

    return color;
}

void main() {
    vec2 uv = ((gl_FragCoord.xy / u_resolution) * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);
    
    float angle = tan((PI * 0.5 * u_fov) / 180.0);
    vec2 xy = vec2(angle, angle);
    uv *= xy;

    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    Ray ray = Ray(
        vec3(0.0, 0.0, -20.0),
        normalize(vec3(uv, 1.0))
    );

    float mouseModifier = 3.0;

    if (u_mouseMove) {
        ray.orgin.xz *= rot2D(-m.x * mouseModifier);
        ray.direction.xz *= rot2D(-m.x * mouseModifier);

        ray.orgin.yz *= rot2D(m.y * mouseModifier);
        ray.direction.yz *= rot2D(m.y * mouseModifier);
    }

    vec3 color = vec3(0.0);
    
    for (int r = 0; r < u_raysPerPixel; r++) {
        color += trace(ray, uv, r);
    }

    gl_FragColor = vec4(color / u_raysPerPixel, 1.0);
}