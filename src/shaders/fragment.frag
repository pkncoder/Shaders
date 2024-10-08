#version 330 core
precision mediump float;

in vec2 u_resolution;

uniform bool u_mouseMove;

uniform float u_mousePosX;
uniform float u_mousePosY;

uniform int u_time;

uniform vec3 u_albedo;
uniform float u_roughness;
uniform float u_metallic;
uniform float u_ambient;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

#define MAX_BOUNCES 1
#define SAMPLES 3.0

#define SPHERE_NUM 3

vec2 u_mouse = vec2(u_mousePosX, u_mousePosY);


/* -------------------------- STRUCTS -------------------------- */
// Ray tracing objects
// Object materials
struct RayTracingMaterial {
    vec3 albedo;
    float emmisive;
    float metallic;
    float roughness;
};

// Ball
struct Sphere {
    vec3 position;
    float radius;
    RayTracingMaterial material;
};

// Functional structs
// Returned from hit functions to give info on an intersection
struct HitInfo {
    bool hit;
    vec3 hitPos;
    float dist;
    vec3 normal;
    RayTracingMaterial material;
};

// Used in hit and lighting functions to calculate info on the final color
struct Ray {
    vec3 orgin;
    vec3 direction;
};


/* Random Values */

uint wang_hash(inout uint seed)
{
    seed = uint(seed ^ uint(61)) ^ uint(seed >> uint(16));
    seed *= uint(9);
    seed = seed ^ (seed >> 4);
    seed *= uint(0x27d4eb2d);
    seed = seed ^ (seed >> 15);
    return seed;
}
 
float RandomFloat01(inout uint state)
{
    return float(wang_hash(state)) / 4294967296.0;
}

vec3 RandomUnitVector(inout uint state)
{
    float z = RandomFloat01(state) * 2.0f - 1.0f;
    float a = RandomFloat01(state) * TWO_PI;
    float r = sqrt(1.0f - z * z);
    float x = r * cos(a);
    float y = r * sin(a);
    return vec3(x, y, z);
}


/* --------------------- RAY-OBJECT EQUATIONS ------------------ */

HitInfo intersect(Ray ray, Sphere sphere) {
    HitInfo hit;

    hit.hit = false;

    vec3 rayOffset = ray.orgin - sphere.position;

    float a = dot(ray.direction, ray.direction);
    float b = dot(rayOffset, ray.direction);
    float c = dot(rayOffset, rayOffset) - sphere.radius * sphere.radius;

    float det = b * b - a * c;

    if (det < 0.0) {return hit;}

    float t0 = (-b - sqrt(det)) / (a);

    if (t0 < 0.0) {
        
        float t1 = (-b + sqrt(det)) / (a);

        if (t1 < 0.0) {
            return hit;
        }

        hit.hit = true;
        hit.hitPos = ray.orgin + ray.direction * t1;
        hit.dist = t1;
        hit.normal = normalize(hit.hitPos - sphere.position);
        hit.material = sphere.material;

        return hit;
    }

    hit.hit = true;
    hit.hitPos = ray.orgin + ray.direction * t0;
    hit.dist = t0;
    hit.normal = normalize(hit.hitPos - sphere.position);
    hit.material = sphere.material;

    return hit;
}

// Calculate the closest object in the scene
HitInfo calculateClosestHit(Ray ray, Sphere spheres[SPHERE_NUM]) {

    // Start with a base hit info
    HitInfo closestHit;
    closestHit.hit = false; // Set hit to false
    closestHit.dist = 800000000000000000000.0; // Set dist to a really big number

    // Loop every sphere
    for (int i = 0; i < spheres.length(); i++) {

        // Calculate the hit info of the current sphere
        HitInfo hit = intersect(ray, spheres[i]);

        // If the hit hit, and it is closer than the current closest
        if (hit.hit && hit.dist < closestHit.dist) {

            // Set closest hit to this hit
            closestHit = hit;
        }
    }

    // At the end, return hit
    return closestHit;
}

/*---------------------------- COOK-TORRANCE BDRF -----------------------------*/

// N
// Normal distrubution
float distributionGGX (vec3 N, vec3 H, float roughness){
    float a2    = roughness * roughness * roughness * roughness;
    float NdotH = max (dot (N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

// G
// Geometry
float geometrySchlickGGX (float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith (vec3 N, vec3 V, vec3 L, float roughness){
    return geometrySchlickGGX (max (dot (N, L), 0.0), roughness) * 
           geometrySchlickGGX (max (dot (N, V), 0.0), roughness);
}

// F
// Frensel
vec3 fresnelSchlick (float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow (1.0 - cosTheta, 5.0);
}


/* ------------------ PBR FUNCTIONS ------------------ */


vec3 PBR(Ray ray, Sphere spheres[SPHERE_NUM], uint rngState) {

    /* Calculate the first hit*/
    HitInfo hit;


    /* Variables */
    vec3 F0;
    float cosTheta;

    vec3 V;
    vec3 N;

    vec3 Kd;

    vec3 specular;

    vec3 hitMod = vec3(1.0);
    vec3 totalColor = vec3(0.0);

    for (int i = 0; i <= MAX_BOUNCES; i++) {

        hit = calculateClosestHit(ray, spheres);

        if (!hit.hit) {
            break;
        }

        F0 = vec3(0.04); // TODO: describe
        F0 = mix(F0, pow(hit.material.albedo, vec3(2.2)), hit.material.metallic); // TODO: describe

        V = normalize(ray.orgin - hit.hitPos); // TODO: describe

        N = hit.normal; // Surface normal

        cosTheta = max(dot(hit.normal, V), 0.0); // TODO: describe


        /* PBR Calculations */
        // BDRF parts
        float NDF = distributionGGX(N, N, hit.material.roughness);
        float G = geometrySmith(N, V, N, hit.material.roughness);
        vec3 F = fresnelSchlick(cosTheta, F0);

        // Now get the energy of the equation
        Kd = vec3(1.0) - F;
        Kd *= 1.0 - hit.material.metallic;

        // Cook - Torrence
        vec3 numerator = NDF * G * F; // cookTorrence numerator
        float denominator = 4.0 * max(dot(N, V), 0.0) * cosTheta; // cookTorrence denominator

        ray.orgin = hit.hitPos + hit.normal * 0.1;

        // Specular part
        specular = numerator / max(denominator, 0.0001);

        // calculate whether we are going to do a diffuse or specular reflection ray
        float doSpecular = (RandomFloat01(rngState) < 0.5) ? 1.0 : 0.0;

        vec3 diffuseRayDir = normalize(hit.normal + RandomUnitVector(rngState));
        if (dot(hit.normal, diffuseRayDir) >= 90.0) { diffuseRayDir = -diffuseRayDir; }
        vec3 specularRayDir = specular;
        specularRayDir = normalize(mix(specularRayDir, diffuseRayDir, hit.material.roughness));
        ray.direction = mix(diffuseRayDir, specularRayDir, doSpecular);

        vec3 diffuse = pow(hit.material.albedo, vec3(2.2));

        //Final lighting equation
        hitMod *= Kd * diffuse;
        totalColor += hit.material.emmisive * hitMod;
    }

    return totalColor;
}

/* --------------------- Main Function --------------- */

// Rotation matrix for mouse movement
mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

void main() {


    /* Camera Setup */

    // Calculate the uv coords and correct aspect ratio
    vec2 uv = (((gl_FragCoord.xy) / u_resolution) * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    // Calculate the angle with the FOV
    float angle = tan((PI * 0.5 * 30.0) / 180.0);
    vec2 xy = vec2(angle, angle); // Get the xy components
    uv *= xy; // Multiply the uv by them


    /* Other non-ray tracing setup */

    int pixelIndex = int(gl_FragCoord.y * u_resolution.x + gl_FragCoord.x);;


    /* Path Tracing Setup */


    /* SCENE */

    // Spheres
    Sphere spheres[SPHERE_NUM]; // Array of all the spheres
    spheres[0] = Sphere(
        vec3(3.0, -18.0, 20.0),
        20.0,
        RayTracingMaterial(
            u_albedo,
            0.0,
            u_metallic,
            u_roughness
        )
    );
    spheres[1] = Sphere(
        vec3(0.0, 0.0, 10.0),
        2.0,
        RayTracingMaterial(
            u_albedo,
            0.0,
            u_metallic,
            1.0
        )
    );
    spheres[2] = Sphere(
        vec3(-100.0, 0.0, 100.0),
        80,
        RayTracingMaterial(
            vec3(1.0),
            1.0,
            0.0,
            1.0
        )
    );


    /* Ray */

    // Get our ray
    Ray ray = Ray(
        vec3(-5.0, 0.0, -10.0), // Orgin at 0,0
        normalize(vec3(uv, 1.0)) // Direction to the current uv and forward
    );

    // Apply mouse movement

    float mouseModifier = 3.0;

    if (u_mouseMove) {
        ray.orgin.xz *= rot2D(-m.x * mouseModifier);
        ray.direction.xz *= rot2D(-m.x * mouseModifier);

        ray.orgin.yz *= rot2D(m.y * mouseModifier);
        ray.direction.yz *= rot2D(m.y * mouseModifier);
    }

    // Find the closest hit
    HitInfo hit = calculateClosestHit(ray, spheres);

    // If the ray doesn't hit
    if (!hit.hit) {
        gl_FragColor = vec4(vec3(0.1647, 0.1765, 0.1765), 1.0);
        return;
    }


    /* PBR & Path Tracing */
    
    // Path tracing
    vec3 Lo = vec3(0.0); // Light out

    uint rngState;

    // Loop every light
    for (int i = 0; i < SAMPLES; i++) {
        rngState = uint(((pixelIndex) * 3014) * (u_time * 3 * (i + 1) * 12));

        // Get the PRB calculation for each light
        Lo += PBR(ray, spheres, rngState) / SAMPLES;
    }


    // Post-Path procsessing
    float ao = u_ambient; // Ambient light factor
    vec3 ambient = vec3(0.03) * hit.material.albedo * ao;

    // Find the color values
    vec3 color = ambient + Lo;  

    // Apply HDR and gamma correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2)); 

    // Return our final color value
    gl_FragColor = vec4(color, 1.0);
}
