#version 330 core
precision highp float;

in vec2 u_resolution;

uniform bool u_mouseMove;

uniform int u_time;

uniform float u_fov;

uniform float u_mousePosX;
uniform float u_mousePosY;

vec2 u_mouse = vec2(u_mousePosX, u_mousePosY);

#define PI 3.14159265359
#define softShadowRayNum 30.0


struct HitInfo {
    bool hit;
    vec3 hitPos;
    float dist;
    vec3 normal;
};

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

struct Ray {
    vec3 orgin;
    vec3 direction;
};

struct Light {
    vec3 orgin;
    float radius;
    vec3 color;
    float power;
    float maxDist;
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
        }

        return hit;
    }

    hit.hit = true;
    hit.hitPos = ray.orgin + ray.direction * t0;
    hit.dist = t0;
    hit.normal = normalize(hit.hitPos - sphere.coords);

    return hit;
}

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

void main() {
    vec3 color = vec3(0.0);
    Sphere[3] spheres;
    Light[2] lights;

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

    spheres[0] = Sphere(
        vec3(0.0, -1.0, 8.0),
        4.0,
        RayTracingMaterial(
            vec3(1.0, 1.0, 1.0),
            0.0,
            1.0
        )
    );
    spheres[1] = Sphere(
        vec3(0.0, -50005.0, 8.0),
        50000.0,
        RayTracingMaterial(
            vec3(0.29, 0.28, 0.28),
            0.0,
            1.0
        )
    );
    spheres[2] = Sphere(
        vec3(0.0, 0.0, 2.0),
        1.5,
        RayTracingMaterial(
            vec3(1.0),
            0.0,
            1.0
        )
    );

    lights[0] = Light(
        vec3(10.0, 10.0, -10.0),
        1.0,
        vec3(0.88, 0.35, 0.35),
        3.0,
        100.0
    );
    lights[1] = Light(
        vec3(-10.0, 10.0, -10.0),
        3.0,
        vec3(0.35, 0.4, 0.87),
        1.0,
        100.0
    );

    Sphere clostestSphere = spheres[0];
    float smallestDist = 800000000.0;

    HitInfo hit;

    for (int i = 0; i < spheres.length(); i++) {
        HitInfo currentHit = intersect(ray, spheres[i]);

        if(currentHit.hit && currentHit.dist < smallestDist) {
            smallestDist = currentHit.dist;
            clostestSphere = spheres[i];

            hit = currentHit;
        }
    }

    if (hit.hit) {

        for (int k = 0; k < lights.length(); k++) {

            Ray shadowRay = Ray(
                hit.hitPos + hit.normal * 0.01,
                lights[k].orgin
            );

            HitInfo shadowRayHit;

            float shadowRaysHits = 0.0;

            for (int i = 0; i < spheres.length(); i++) {

                for (int s = 0; s < softShadowRayNum; s++) {

                    float offsetX = random((uv - u_time / 9824.0) * s) * lights[k].radius;
                    float offsetY = random((-uv + u_time / 12732.0) * -s) * lights[k].radius;


                    Ray nsr = shadowRay;

                    nsr.direction.xy += vec2(offsetX, offsetY);

                    

                    

                    shadowRayHit = intersect(nsr, spheres[i]);

                    if (shadowRayHit.hit) {
                        shadowRaysHits++;
                    }
                }

                if (shadowRaysHits == softShadowRayNum) {
                    color += vec3(0.0);
                    break;
                }
            }

            if (shadowRaysHits != softShadowRayNum && lights[k].maxDist > hit.dist) {
                color += lights[k].color * clostestSphere.material.color * ((softShadowRayNum - shadowRaysHits) / softShadowRayNum) * max(dot(hit.normal, normalize(lights[k].orgin - hit.hitPos)), 0.0);
            }

            else {
                color += vec3(0.0);
            }
        }
    }

    else {color = vec3(0.16, 0.14, 0.16);}

    // if (hit.hit) {
    //     color = hit.normal;
    // }

    gl_FragColor = vec4(color, 1.0);   
    //gl_FragColor = vec4(random(uv - u_time / 98924.0), random(-uv + u_time / 128732.0), 0.0, 1.0);
}