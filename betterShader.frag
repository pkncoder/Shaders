#version 330 core
precision mediump float;

// ------------------------ Uniforms ---------------------

in vec2 u_resolution;

uniform float u_mousePosX;
uniform float u_mousePosY;

// -----------------------  Defines ----------------------


#define ASPECT_RATIO u_resolution.x / u_resolution.y
#define FOV 10.0

#define PI 3.14159265359 

#define MAX_STEPS 128
#define EPSILON 0.001
#define MAX_DIST 500.0

vec2 u_mouse = vec2(u_mousePosX, u_mousePosY);


// -------------------- Structs --------------------------


struct Ray {
    vec3 orgin;
    vec3 direction;
};


// ------------------ Ray Marching Opperations -----------


float smin(float a, float b, float k) {
    float h = max(k-abs(a-b), 0.0)/k;
    return min(a,b) - h*h*h*k*(1.0/6.0);
}


// ------------------------- Helpers ---------------------

float circleSDF(vec3 position, float radius) {
	return length(position) - radius;
}

float sdBox( vec3 p, vec3 b )
{
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float map(vec3 position) {

    float distOne = circleSDF(position - vec3(-1.0, 0.0, 0.0), 1.0);

    float boxOne = sdBox(position - vec3(0.0, 0.0, 0.0), vec3(3.0, 3.0, 3.0));
    float boxTwo = sdBox(position - vec3(0.2, 0.2, -0.2), vec3(3.0, 3.0, 3.0));

    float pipeOne = sdCappedCylinder(position - vec3(0.0), 5.0, 1.);
    float pipeTwo = sdCappedCylinder(position - vec3(0.0), 5.1, 0.8);

    //return max(boxOne, -boxTwo);
    return max(pipeOne, -pipeTwo);
}

// ----------------------- Shaders -----------------------

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

vec3 getNormal(vec3 p) {
    //p = fract(p) - 0.5;

    vec2 d = vec2(0.01, 0.0);
    float gx = map(p + d.xyy) - map(p - d.xyy);
    float gy = map(p + d.yxy) - map(p - d.yxy);
    float gz = map(p + d.yyx) - map(p - d.yyx);
    vec3 normal = vec3(gx, gy, gz);
    return normalize(normal);
}

vec3 render() {

    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) / u_resolution.y;
    vec2 m = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    vec3 col = vec3(0.1608, 0.1608, 0.1608);   // Template color that will be modified

    float t = 0.; // total distance travelled

    Ray ray = Ray(
        vec3(0.0, 0.0, -10.0),
        normalize(vec3(uv, 1.0))
    );

    float mouseModifier = 2.0;

    ray.orgin.xz *= rot2D(-m.x * mouseModifier);
    ray.direction.xz *= rot2D(-m.x * mouseModifier);

    ray.orgin.yz *= rot2D(m.y * mouseModifier);
    ray.direction.yz *= rot2D(m.y * mouseModifier);

    for (int i = 0; i < 200; i++) {

        vec3 p = ray.orgin + ray.direction * t;     // position along the ray

        float d = map(p);         // current distance to the scene

        t += d;                   // "march" the ray

        if (d < .001) {
            vec3 normal = getNormal(ray.orgin + ray.direction * t);

            vec3 lightColor = vec3(1.0, 0.15, 0.82);
            vec3 lightSource = vec3(1.0, 1.0, -1.0);
            float diffuseStrength = max(0.0, dot(normalize(lightSource), normal));
            vec3 diffuse = lightColor * diffuseStrength;

            vec3 viewSource = normalize(ray.orgin);
            vec3 reflectSource = normalize(reflect(-lightSource, normal));
            float specularStrength = max(0.0, dot(viewSource, reflectSource));
            specularStrength = pow(specularStrength, 64.0);
            vec3 specular = specularStrength * lightColor;

            vec3 lighting = diffuse * 0.75 + specular * 0.25;
            col = lighting;

            col *= t / 8.0;

            // col = vec3(t / 100.0);
            // col = vec3(i / 300.0);

            break; // early stop if close enough
        }     

        if (t > 100.) {
            break;      // early stop if too far
        }
    }

    return pow(col, vec3(1.0 / 2.0));
}


// ------------------------ Other ------------------------

void main() {
    gl_FragColor = vec4(render(), 1.0);
}