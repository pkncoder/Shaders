#version 330 core
precision mediump float;

#define PI 3.14159265359


/* -------------------------- STRUCTS -------------------------- */
// Ray tracing objects
// Object materials
struct RayTracingMaterial {
    vec3 albedo;
    float metallic;
    float roughness;
};

// Ball
struct Sphere {
    vec3 position;
    float radius;
    RayTracingMaterial material;
};

// Point-light
struct PointLight {
    vec3 position;
    vec3 albedo;
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

/* ---------------------- FINAL HELPER EQUATIONS --------------- */


/*---------------------------- COOK-TORRANCE BDRF -----------------------------*/

// D
// Normal distrobution
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;
	
    float num   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
	
    return num / denom;
}

// F
// Frensel
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}  

// G
// Geometry
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float num   = NdotV;
    float denom = NdotV * (1.0 - k) + k;
	
    return num / denom;
}
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);
	
    return ggx1 * ggx2;
}


/* --------------------- Main Function --------------- */

void main() {

    PointLight lights[1];
    lights[0] = PointLight(
        vec3(3.0, 3.0, 4.0),
        vec3(1.0)
    );

    Sphere spheres[1];
    spheres[0] = Sphere(
        vec3(0.0, 0.0, 0.0),
        2.0,
        RayTracingMaterial(
            vec3(1.0, 0.0, 0.0),
            0.0,
            1.0
        )
    );



    vec3 albedo;
    float roughness; // Surface roughness
    float metallic; // Surface metalism factor

    vec3 F0 = vec3(0.04); // TODO: describe
    F0 = mix(F0, albedo, metallic); // TODO: describe

    vec3 Lo; // Light out

    vec3 lightPositions[1];
    vec3 lightColors[1];
    int i;
    vec3 WorldPos;
    vec3 V; // TODO: describe

        vec3 L = normalize(lightPositions[i] - WorldPos);
        vec3 H = normalize(V + L); // Halfway vector
        float distance = length(lightPositions[i] - WorldPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = lightColors[i] * attenuation; // Light 'Power' factor

    
        // Calculate the NDF (Normal distrobution function)
        vec3 N; // Surface normal
        

        // Calculate
        float NDF = DistributionGGX(N, H, roughness);

        // Calculate the Frensel Effect
        float cosTheta; // TODO: describe
        vec3 F = fresnelSchlick(cosTheta, F0);

        // Calculate the Geometry function
        float G = GeometrySmith(N, V, L, roughness);


        // Finally calculate the Cook-Torrance BRDF
        vec3 numerator    = NDF * G * F; // Get the numerator
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0)  + 0.0001; // Get the denominator

        // Use the BDRF to get the specular component
        vec3 specular = numerator / denominator;


        // Now get the energy of the equation
        vec3 kS = F; // Specular energy
        vec3 kD = vec3(1.0) - kS; // Diffuse energy

        kD *= 1.0 - metallic; // Reduce the diffuse energy based on the metallic factor


        // Finally, get the final light values
        // TODO: describe
        float NdotL = max(dot(N, L), 0.0);        
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    

    float ao; // Ambient light factor
    vec3 ambient = vec3(0.03) * albedo * ao;

    // Find the color values
    vec3 color   = ambient + Lo;  

    // Apply HDR and gamma correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2)); 

    // Return our final color value
    gl_FragColor = vec4(color, 1.0);
}
