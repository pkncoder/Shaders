precision mediump float;

// ------------------------ Uniforms ---------------------

uniform vec2 u_resolution;
uniform float u_time;

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

float map(vec3 position, float radius) {

    float distOne = circleSDF(
        position - vec3(sin(u_time), 0.0, 0.0), 
        radius + (radius / 2.0)
    );

    position.y -= u_time * .4;
    position = fract(position) - 0.5;

    float distTwo = sdBox(
        position - vec3(0.0, 0.0, 0.0), 
        vec3(radius)
    );

    return smin(distOne, distTwo, 1.0);
}

// ----------------------- Shaders -----------------------


vec3 PixelPerPixel(vec2 uv) {

    float radius = 0.1;

    vec3 col = vec3(0.0, 0.0, 0.0);   // Template color that will be modified

    float t = 0.; // total distance travelled

    float itterations;

    Ray ray = Ray(
        vec3(0.0, 0.0, -3.0),
        normalize(vec3(uv, 1.0))
    );

    for (int i = 0; i < 80; i++) {
        vec3 p = ray.orgin + ray.direction * t;     // position along the ray

        float d = map(p, radius);         // current distance to the scene

        t += d;                   // "march" the ray

        if (d < .001) {
            itterations = float(i);
            break; // early stop if close enough
        }     

        if (t > 100.) {
            itterations = float(i);
            break;      // early stop if too far
        }
    }

    col = vec3(t * 0.01);

    return vec3(col);
}


// ------------------------ Other ------------------------

void main() {
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) / u_resolution.y;
    
    // float angle = tan((PI * 0.5 * FOV) / 180.0);
    // vec2 xy = vec2(angle, angle);
    // uv *= xy;

    gl_FragColor = vec4(PixelPerPixel(uv), 1.0);
}