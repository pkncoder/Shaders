#version 330 core
precision highp float;

in vec2 u_resolution;

uniform bool u_mouseMove;

uniform int u_time;

uniform float u_mousePosX;
uniform float u_mousePosY;

vec2 u_mouse = vec2(u_mousePosX, u_mousePosY);

#define PI 3.14159265359
#define TWO_PI 6.28318530718

struct RayTracingMaterial {
    vec3 color;
    vec3 specularColor;
    vec3 emmisive;
    float roughness;
    float specularProbability;
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
        
        float t1 = (-b + sqrt(det)) / (a);

        if (t1 < 0.0) {
            return hit;
        }

        hit.hit = true;
        hit.hitPos = ray.orgin + ray.direction * t1;
        hit.dist = t1;
        hit.normal = normalize(hit.hitPos - sphere.coords);
        hit.material = sphere.material;

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
    
    float t = tN < 0.1 ? tF : tN;

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

// ACES tone mapping curve fit to go from HDR to LDR
//https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 ACESFilm(vec3 x)
{
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((x*(a*x + b)) / (x*(c*x + d) + e), 0.0f, 1.0f);
}

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

vec3 LessThan(vec3 f, float value)
{
    return vec3(
        (f.x < value) ? 1.0f : 0.0f,
        (f.y < value) ? 1.0f : 0.0f,
        (f.z < value) ? 1.0f : 0.0f);
}
 
vec3 LinearToSRGB(vec3 rgb)
{
    rgb = clamp(rgb, 0.0f, 1.0f);
 
    return mix(
        pow(rgb, vec3(1.0f / 2.4f)) * 1.055f - 0.055f,
        rgb * 12.92f,
        LessThan(rgb, 0.0031308f)
    );
}

HitInfo calculateClosestHit(Ray ray, int depth) {

    Sphere[8] spheres;
    Box[7] boxes;

    spheres[0] = Sphere(
        vec3(-3.0, 0.0, -3.0),
        0.6,
        RayTracingMaterial(
            vec3(0.3, 1.0, 0.3),
            vec3(0.3, 1.0, 0.3),
            vec3(0.0),
            0.0,
            1.0
        )
    );
    spheres[1] = Sphere(
        vec3(-1.5, 0.0, -3.0),
        0.6,
        RayTracingMaterial(
            vec3(0.3, 1.0, 0.3),
            vec3(0.3, 1.0, 0.3),
            vec3(0.0),
            0.25,
            1.0
        )
    );
    spheres[2] = Sphere(
        vec3(0.0, 0.0, -3.0),
        0.6,
        RayTracingMaterial(
            vec3(0.3, 1.0, 0.3),
            vec3(0.3, 1.0, 0.3),
            vec3(0.0),
            0.5,
            1.0
        )
    );
    spheres[3] = Sphere(
        vec3(1.5, 0.0, -3.0),
        0.6,
        RayTracingMaterial(
            vec3(0.3, 1.0, 0.3),
            vec3(0.3, 1.0, 0.3),
            vec3(0.0),
            0.75,
            1.0
        )
    );
    spheres[4] = Sphere(
        vec3(3.0, 0.0, -3.0),
        0.6,
        RayTracingMaterial(
            vec3(0.3, 1.0, 0.3),
            vec3(0.3, 1.0, 0.3),
            vec3(0.0),
            1.0,
            1.0
        )
    );

    spheres[5] = Sphere(
        vec3(-2.5, -2.7, -3.0),
        1.1,
        RayTracingMaterial(
            vec3(1.0, 0.9882, 0.3647),
            vec3(0.9),
            vec3(0.0),
            0.2,
            0.1
        )
    );
    spheres[6] = Sphere(
        vec3(0.0, -2.7, -3.0),
        1.1,
        RayTracingMaterial(
            vec3(0.97, 0.45, 0.94),
            vec3(0.9),
            vec3(0.0),
            0.2,
            0.3
        )
    );

    spheres[7] = Sphere(
        vec3(2.5, -2.7, -3.0),
        1.1,
        RayTracingMaterial(
            vec3(0.0, 0.0, 1.0),
            vec3(1.0, 0.0, 0.0),
            vec3(0.0),
            0.5,
            0.5
        )
    );



    boxes[0] = Box(
        vec3(-4.0, 0.0, -3.0),
        vec3(0.1, 4.0, 4.0),
        RayTracingMaterial(
            vec3(1.0, 0.0, 0.0),
            vec3(1.0),
            vec3(0.0),
            1.0,
            0.0
        )
    );

    boxes[1] = Box(
        vec3(0.0, 0.0, -1.0),
        vec3(4.0, 4.0, 0.1),
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            vec3(1.0),
            vec3(0.0),
            1.0,
            0.0
        )
    );

    boxes[2] = Box(
        vec3(4.0, 0.0, -3.0),
        vec3(0.1, 4.0, 4.0),
        RayTracingMaterial(
            vec3(0.0, 1.0, 0.0),
            vec3(1.0),
            vec3(0.0),
            1.0,
            0.0
        )
    );

    boxes[3] = Box(
        vec3(0.0, -4.0, -3.0),
        vec3(4.0, 0.1, 4.0),
        RayTracingMaterial(
            vec3(1.0),
            vec3(1.0),
            vec3(0.0),
            1.0,
            0.0
        )
    );

    boxes[4] = Box(
        vec3(0.0, 4.0, -3.0),
        vec3(4.0, 0.1, 4.0),
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            vec3(1.0),
            vec3(0.0),
            1.0,
            0.0
        )
    );
    boxes[5] = Box(
        vec3(0.0, 3.9, -4.0),
        vec3(2.0, 0.1, 2.0),
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            vec3(1.0),
            vec3(1.0),
            1.0,
            0.0
        )
    );

    boxes[6] = Box(
        vec3(0.0, 0.0, -7.0),
        vec3(4.0, 4.0, 0.2),
        RayTracingMaterial(
            vec3(1.0),
            vec3(1.0),
            vec3(0.0),
            1.0,
            0.0
        )
    );

    HitInfo closestHit;
    closestHit.hit = false;
    closestHit.dist = 800000.0;

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

vec3 trace(Ray ray, inout uint rngState) {
    int numBounces = 5;

    vec3 colorMult = vec3(1.0);
    vec3 color = vec3(0.0);

    for (int b = 0; b <= numBounces; b++) {

        HitInfo closestHit = calculateClosestHit(ray, b);

        rngState += uint(b) * -185u;

        if (!closestHit.hit) {
            break;
        }

        // update the ray position
        ray.orgin = closestHit.hitPos + closestHit.normal * 0.1;

        // calculate whether we are going to do a diffuse or specular reflection ray
        float doSpecular = (RandomFloat01(rngState) < closestHit.material.specularProbability) ? 1.0 : 0.0;

        // Calculate a new ray direction.
        // Diffuse uses a normal oriented cosine weighted hemisphere sample.
        // Perfectly smooth specular uses the reflection ray.
        // Rough (glossy) specular lerps from the smooth specular to the rough diffuse by the material roughness squared
        // Squaring the roughness is just a convention to make roughness feel more linear perceptually.
        vec3 diffuseRayDir = normalize(closestHit.normal + RandomUnitVector(rngState));
        if (dot(closestHit.normal, diffuseRayDir) >= 90.0) { diffuseRayDir = -diffuseRayDir; }
        vec3 specularRayDir = reflect(ray.direction, closestHit.normal);
        specularRayDir = normalize(mix(specularRayDir, diffuseRayDir, closestHit.material.roughness * closestHit.material.roughness));
        ray.direction = mix(diffuseRayDir, specularRayDir, doSpecular);

        // add in emissive lighting
        color += closestHit.material.emmisive * colorMult;

        // update the colorMultiplier
        colorMult *= mix(closestHit.material.color, closestHit.material.specularColor, doSpecular);
    
        float p = max(colorMult.r, max(colorMult.g, colorMult.b));

        if (RandomFloat01(rngState) >= p) {
            break;
        }
        colorMult *= 1.0 / p; 
    }

    return color;
}

void main() {

    int pixelIndex = int(gl_FragCoord.y * u_resolution.x + gl_FragCoord.x);
    uint rngState = uint((pixelIndex + u_time * -719393));

    // calculate subpixel camera jitter for anti aliasing
    //vec2 jitter = vec2(RandomFloat01(rngState), RandomFloat01(rngState)) - 0.5f;

    vec2 uv = (((gl_FragCoord.xy) / u_resolution) * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);

    float angle = tan((PI * 0.5 * 30.0) / 180.0);
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

    
    for (int r = 0; r < 1; r++) {
        color += trace(ray, rngState) / 1;
    }
    color *= 1.0;
    color = ACESFilm(color);
    color = LinearToSRGB(color);

    gl_FragColor = vec4(color, 1.0);
}