precision mediump float;

// ------------------------ Uniforms ---------------------

uniform vec2 u_resolution;
// uniform float u_time;
uniform vec2 u_mouse;

// -----------------------  Defines ----------------------


#define ASPECT_RATIO u_resolution.x / u_resolution.y
#define FOV 10.0

#define PI 3.14159265359 

#define MAX_STEPS 128
#define EPSILON 0.001
#define MAX_DIST 500.0


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

float map(vec3 position) {

    float distOne = circleSDF(position - vec3(0.0, 0.0, 0.0), 1.0);

    float h = 1.0;
    vec3 normal = vec3(0.0, 1.0, 0.0);
    float distTwo = dot(position, normal) + h;

    return min(distOne, distTwo);
}

// ----------------------- Shaders -----------------------

mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

vec3 getNormal(vec3 p) {
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

    float radius = 1.0;

    vec3 col = vec3(0.0, 0.0, 0.0);   // Template color that will be modified

    float t = 0.; // total distance travelled

    Ray ray = Ray(
        vec3(0.0, 0.0, -3.0),
        normalize(vec3(uv, 1.0))
    );

    ray.orgin.xz *= rot2D(-m.x);
    ray.direction.xz *= rot2D(-m.x);

    ray.orgin.yz *= rot2D(-m.y);
    ray.direction.yz *= rot2D(-m.y);

    for (int i = 0; i < 100; i++) {

        vec3 p = ray.orgin + ray.direction * t;     // position along the ray
        vec3 q = p;

        float d = map(p);         // current distance to the scene

        t += d;                   // "march" the ray

        if (d < .001) {
            vec3 normal = getNormal(ray.orgin + ray.direction * t);

            vec3 lightColor = vec3(1.0);
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