#version 330 core
precision mediump float;

in vec2 u_resolution;

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

// Calculate the closest object in the scene
HitInfo calculateClosestHit(Ray ray) {

    // Start with a base hit info
    HitInfo closestHit;
    closestHit.hit = false; // Set hit to false
    closestHit.dist = 800000000000000000000.0; // Set dist to a really big number

    Sphere spheres[1]; // Array of all the spheres
    spheres[0] = Sphere(
        vec3(0.0, 0.0, 10.0),
        1.0,
        RayTracingMaterial(
            vec3(1.0, 0.7843, 0.0),
            0.0,
            1.0
        )
    );
    
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

    // Calculate the uv coords and correct aspect ratio
    vec2 uv = (((gl_FragCoord.xy) / u_resolution) * 2.0 - 1.0) * vec2(u_resolution.x / u_resolution.y, 1.0);

    // Calculate the angle with the FOV
    float angle = tan((PI * 0.5 * 30.0) / 180.0);
    vec2 xy = vec2(angle, angle); // Get the xy components
    uv *= xy; // Multiply the uv by them
    
    // Get our ray
    Ray ray = Ray(
        vec3(0.0, 0.0, 0.0), // Orgin at 0,0
        normalize(vec3(uv, 1.0)) // Direction to the current uv and forward
    );

    // Find the closest hit
    HitInfo hit = calculateClosestHit(ray);
    if (!hit.hit) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    RayTracingMaterial material = hit.material;
    

    vec3 albedo = material.albedo;
    float roughness = material.roughness; // Surface roughness
    float metallic = material.metallic; // Surface metalism factor

    PointLight lights[1];
    lights[0] = PointLight(
        vec3(3.0, 3.0, 4.0),
        vec3(1.0)
    );

    vec3 F0 = vec3(0.04); // TODO: describe
    F0 = mix(F0, albedo, metallic); // TODO: describe

    vec3 Lo; // Light out
    vec3 V; // TODO: describe

    for (int i = 0; i < lights.length(); i++) {

        // Calcualte some variables that will be user
        vec3 L = normalize(lights[i].position - ray.direction);
        vec3 H = normalize(V + L); // Halfway vector
        float dist = length(lights[i].position - ray.direction);
        float attenuation = 1.0 / (dist * dist);
        vec3 radiance = lights[i].albedo * attenuation; // Light 'Power' factor

    
        // Calculate the NDF (Normal distrobution function)
        vec3 N = hit.normal; // Surface normal
        

        // Calculate
        float NDF = DistributionGGX(N, H, roughness);

        // Calculate the Frensel Effect
        float cosTheta = max(dot(H, V), 0.0); // TODO: describe
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
    }


    float ao = 0.1; // Ambient light factor
    vec3 ambient = vec3(0.03) * albedo * ao;

    // Find the color values
    vec3 color = ambient + Lo;  

    // Apply HDR and gamma correction
    color = color / (color + vec3(1.0));
    color = pow(color, vec3(1.0/2.2)); 

    // Return our final color value
    gl_FragColor = vec4(color, 1.0);
}
