var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// diffuse coefficient
	vec3  k_s;	// specular coefficient
	float n;	// specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

bool IntersectRay( inout HitInfo hit, Ray ray );

// Shades the given point and returns the computed color.
vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
{
	vec3 color = vec3(0,0,0);
	for ( int i=0; i<NUM_LIGHTS; ++i ) 
	{
		// [IMPLEMENTED]: Check for shadows
		HitInfo h;
		Ray r;
		r.dir = normalize(lights[i].position - position);
		r.pos = position;

		// If no intersection we have to implement the Blinn model
		if ( !IntersectRay( h, r ) ) 
		{
			// [IMPLEMENTED]: If not shadowed, perform shading using the Blinn model
			// color += mtl.k_d * lights[i].intensity;	// change this line
			float cosTheta = max(0.0, dot(normal, r.dir));
			vec3 h = normalize(r.dir + view);
			float cosPhi = max(0.0, dot(normal, h));
			color += lights[i].intensity * (mtl.k_d * cosTheta + mtl.k_s * pow(cosPhi, mtl.n));
		}
	}
	
	return color;
}

// Intersects the given ray with all spheres in the scene
// and updates the given HitInfo using the information of the sphere
// that first intersects with the ray.
// Returns true if an intersection is found.
bool IntersectRay( inout HitInfo hit, Ray ray )
{
	hit.t = 1e30;
	bool foundHit = false;
	for ( int i=0; i<NUM_SPHERES; ++i ) 
	{
		// [IMPLEMENTED]: Test for ray-sphere intersection
		// .. with delta condition ..
		float a_coefficient = dot(ray.dir, ray.dir);
		float b_coefficient = 2.0 * dot(ray.dir, ray.pos - spheres[i].center);
		float c_coefficient = dot(ray.pos - spheres[i].center, ray.pos - spheres[i].center) - pow(spheres[i].radius, 2.0);
		float delta = b_coefficient * b_coefficient - 4.0 * a_coefficient * c_coefficient;

		if ( delta > 0.0 )
		{
			// [IMPLEMENTED]: If intersection is found, update the given HitInfo
			float temp_t = (-b_coefficient - sqrt(delta)) / (2.0 * a_coefficient);
			if ( temp_t < hit.t && temp_t > 0.0 )
			{
				hit.t = temp_t;
				hit.position = ray.pos + hit.t * ray.dir; // p + td
				hit.normal = normalize(hit.position - spheres[i].center); // direction of sphere's ray
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Given a ray, returns the shaded color where the ray intersects a sphere.
// If the ray does not hit a sphere, returns the environment color.
vec4 RayTracer( Ray ray )
{
	HitInfo hit;
	if ( IntersectRay( hit, ray ) ) {
		vec3 view = normalize( -ray.dir );
		vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
		
		// Compute reflections
		vec3 k_s = hit.mtl.k_s;
		for ( int bounce=0; bounce<MAX_BOUNCES; ++bounce ) {
			if ( bounce >= bounceLimit ) break;
			if ( hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0 ) break;
			
			Ray r;	// this is the reflection ray
			HitInfo h;	// reflection hit info
			
			// [IMPLEMENTED]: Initialize the reflection ray
			r.pos = hit.position;
			r.dir = reflect( ray.dir, hit.normal ); // No need to normalize, both dir and normal are normalized
			
			if ( IntersectRay( h, r ) ) {
				// [IMPLEMENTED]: Hit found, so shade the hit point
				view = normalize( -r.dir );
				clr += Shade( h.mtl, h.position, h.normal, view ) * k_s;

				// [IMPLEMENTED]: Update the loop variables for tracing the next reflection ray
				k_s *= h.mtl.k_s;	// update the specular coefficient
				hit = h;
			} else {
				// The refleciton ray did not intersect with anything,
				// so we are using the environment color
				clr += k_s * textureCube( envMap, r.dir.xzy ).rgb;
				break;	// no more reflections
			}
		}
		return vec4( clr, 1 );	// return the accumulated color, including the reflections
	} else {
		return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
	}
}
`;