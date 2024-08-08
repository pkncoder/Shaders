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

struct RayTracingMaterial {
    vec3 color;
    float emmisive;
    float smoothness;
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
    RayTracingMaterial material;
};

struct Ray {
    vec3 orgin;
    vec3 direction;
};

struct Box {
    vec3 orgin;
    vec3 boxSize;
    RayTracingMaterial material;
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
        return hit;
    }

    hit.hit = true;
    hit.hitPos = ray.orgin + ray.direction * t0;
    hit.dist = t0;
    hit.normal = normalize(hit.hitPos - sphere.coords);
    hit.material = sphere.material;

    return hit;
}

//https://iquilezles.org/articles/intersectors/
// axis aligned box centered at the origin, with size box.boxSize
HitInfo intersect( Ray ray, Box box ) 
{

    HitInfo hit;
    hit.hit = false;

    vec3 m = 1./ray.direction;
    vec3 n = m*(ray.orgin - box.orgin);
    vec3 k = abs(m) * box.boxSize;
	
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;

	float tN = max( max( t1.x, t1.y ), t1.z );
	float tF = min( min( t2.x, t2.y ), t2.z );
	
	if( tN > tF || tF < 0.) return hit;
    
    float t = tN < 0.0001 ? tF : tN;

    hit.hit = true;
    hit.hitPos = ray.orgin + ray.direction * t;
    hit.dist = t;
    hit.normal = -sign(ray.direction)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);;
    hit.material = box.material;

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

HitInfo calculateClosestHit(Ray ray, int depth) {

    Sphere[1] spheres;
    Box[7] boxes;

    spheres[0] = Sphere(
        vec3(0.0, 0.0, -5.0),
        2.0,
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            0.0,
            0.0
        )
    );

    boxes[0] = Box(
        vec3(-4.0, 0.0, -3.0),
        vec3(0.1, 4.0, 4.0),
        RayTracingMaterial(
            vec3(1.0, 0.0, 0.0),
            0.0,
            0.0
        )
    );

    boxes[1] = Box(
        vec3(0.0, 0.0, -1.0),
        vec3(4.0, 4.0, 0.1),
        RayTracingMaterial(
            vec3(0.2, 0.2, 0.2),
            0.0,
            0.0
        )
    );

    boxes[2] = Box(
        vec3(4.0, 0.0, -3.0),
        vec3(0.1, 4.0, 4.0),
        RayTracingMaterial(
            vec3(0.0, 0.0, 1.0),
            0.0,
            0.0
        )
    );

    boxes[3] = Box(
        vec3(0.0, -4.0, -3.0),
        vec3(4.0, 0.1, 4.0),
        RayTracingMaterial(
            vec3(0.0, 1.0, 0.0),
            0.0,
            0.0
        )
    );

    boxes[4] = Box(
        vec3(0.0, 4.0, -3.0),
        vec3(4.0, 0.1, 4.0),
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            0.0,
            0.0
        )
    );
    boxes[5] = Box(
        vec3(0.0, 3.8, -3.0),
        vec3(1.0, 0.2, 1.0),
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            1.0,
            0.0
        )
    );

    boxes[6] = Box(
        vec3(0.0, 0.0, -7.0),
        vec3(4.0, 4.0, 0.1),
        RayTracingMaterial(
            vec3(1.0),
            0.0,
            0.0
        )
    );

    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.dist = 800000.0; // Infinity

    for (int i = 0; i < spheres.length(); i++) {
        HitInfo sphereHit = intersect(ray, spheres[i]);

        if (sphereHit.hit && sphereHit.dist < closestHit.dist) {
            closestHit = sphereHit;
        }
    }

    int ignore = 0;
    if (depth < 1) { ignore = 1; }

    for (int i = 0; i < boxes.length() - ignore; i++) {
        HitInfo boxHit = intersect(ray, boxes[i]);

        if (boxHit.hit && boxHit.dist < closestHit.dist) {
            closestHit = boxHit;
        }
    }

    return closestHit;
}

vec3 trace(Ray ray, int rngState, int depth) {
    int numBounces = 10;

    vec3 colorMult = vec3(1.0);
    vec3 color = vec3(0.0);

    for (int b = 0; b <= numBounces; b++) { 
        HitInfo closestHit = calculateClosestHit(ray, b);

        if (!closestHit.hit) {
            break;
        }

        // check
        vec3 offset = (closestHit.normal + RandomDirection(rngState));

        if (dot(closestHit.normal, offset) < 0.0) {
            offset = -offset;
        }

        // check
        ray.orgin = closestHit.hitPos;

        vec3 diffuseDirection = normalize(offset);
        vec3 specularDirection = reflect(ray.direction, closestHit.normal);

        ray.direction = normalize(mix(diffuseDirection, specularDirection, closestHit.material.smoothness));

        vec3 emittedLight = closestHit.material.emmisive * closestHit.material.color;
        //float lightStrength = dot(closestHit.normal, ray.direction);
        color += emittedLight * colorMult;
        colorMult *= closestHit.material.color;
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

    int pixelIndex = int(gl_FragCoord.y * u_resolution.x + gl_FragCoord.x);
	int rngState = pixelIndex + (u_time * 1) * 719393;

    vec3 color = vec3(0.0);
    
    for (int r = 0; r < u_raysPerPixel; r++) {
        color += trace(ray, rngState, r);
    }

    color = pow(color / u_raysPerPixel, vec3(1.0 / 2.2));

    gl_FragColor = vec4(color, 1.0);
}