// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [IMPLEMENTED]
	
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	// Rotation matrix x and y
	var rotX = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];

	var rotY = [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];

	var resRot = MatrixMult(rotX, rotY);
	var mv = MatrixMult(trans, resRot);
	
	return mv;
}


// [IMPLEMENTED] Complete the implementation of the following class.

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// Compile the shader program
		this.prog = InitShaderProgram( meshVS, meshFS );
		
		// Get the ids of the uniform variables in the shaders
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' );
		this.matInversion = gl.getUniformLocation( this.prog, 'matInversion' );
		this.sampler = gl.getUniformLocation( this.prog, 'tex' );
		this.flagTex = gl.getUniformLocation( this.prog, 'flagTex' );
		this.lightDirection = gl.getUniformLocation ( this.prog, 'lightDirection' );
		this.alpha = gl.getUniformLocation( this.prog, 'alpha' );
		
		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );
		this.txc = gl.getAttribLocation( this.prog, 'txc' );
		this.norm = gl.getAttribLocation( this.prog, 'norm' );

		// Vertex buffer of WebGL
		this.vertbuffer = gl.createBuffer();
		this.texcoords = gl.createBuffer();

		// Normal buffer of WebGL
		this.normbuffer = gl.createBuffer();

		// Inversion matrix
		this.mat = Array(1, 0, 0, 0, 	0, 1, 0, 0, 	0, 0, 1, 0, 	0, 0, 0, 1);

		// Model view and normal matrixes 
		this.mv = gl.getUniformLocation( this.prog, 'mv' );
		this.normalMatrix = gl.getUniformLocation( this.prog, 'normalMatrix' );

		// Texture creation
		this.mytex = gl.createTexture();
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [IMPLEMENTED] Update the contents of the vertex buffer objects.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}
	
	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		gl.useProgram( this.prog );
		
		// [IMPLEMENTED] Set the uniform parameter(s) of the vertex shader
		if ( swap )
			// Apply the inversion transformation
			this.mat = Array(1, 0, 0, 0, 	0, 0, 1, 0, 	0, 1, 0, 0, 	0, 0, 0, 1);
		else
			this.mat = Array(1, 0, 0, 0, 	0, 1, 0, 0, 	0, 0, 1, 0, 	0, 0, 0, 1);
	}
	
	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [IMPLEMENTED] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, matrixMVP );
		gl.uniformMatrix4fv( this.matInversion, false, this.mat);
		gl.uniformMatrix4fv( this.mv, false, matrixMV );
		gl.uniformMatrix3fv( this.normalMatrix, false, matrixNormal);
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.texcoords );
		gl.vertexAttribPointer( this.txc, 2, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.txc );
		
		gl.bindBuffer( gl.ARRAY_BUFFER, this.normbuffer );
		gl.vertexAttribPointer( this.norm, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.norm );

		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [IMPLEMENTED] Bind the texture
		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture(gl.TEXTURE_2D, this.mytex);
		
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

		// [IMPLEMENTED] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
		gl.useProgram(this.prog);
		gl.uniform1i(this.sampler, 0);
		gl.uniform1i(this.flagTex, true);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [IMPLEMENTED] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		gl.useProgram(this.prog);
		if ( show )
			gl.uniform1i(this.flagTex, true);
		else
			gl.uniform1i(this.flagTex, false);
	}
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [IMPLEMENTED] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDirection, x, y, z);
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [IMPLEMENTED] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.alpha, shininess);
	}
}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep( dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution )
{
	var forces = Array( positions.length ).fill(new Vec3(0,0,0)); // The total for per particle
	
	// [IMPLEMENTED] Compute the total force of each particle
	for ( i = 0; i < springs.length; i++ )
	{
		// Distance and direction vector of the spring force between two particles
		l = positions[springs[i].p1].sub(positions[springs[i].p0]).len();
		d = positions[springs[i].p1].sub(positions[springs[i].p0]).div(l);

		// Spring forces
		f0s = d.mul((l - springs[i].rest)*stiffness);
		f1s = d.mul((springs[i].rest - l)*stiffness);

		// Updating forces
		forces[springs[i].p0] = forces[springs[i].p0].add(f0s);
		forces[springs[i].p1] = forces[springs[i].p1].add(f1s);

		// Damping forces
		ldot = velocities[springs[i].p1].sub(velocities[springs[i].p0]).dot(d);
		f0d = d.mul(ldot*damping);
		f1d = d.mul(-ldot*damping);

		// Updating forces
		forces[springs[i].p0] = forces[springs[i].p0].add(f0d);
		forces[springs[i].p1] = forces[springs[i].p1].add(f1d);
	}

	// Gravity forces
	for ( i = 0; i < positions.length; i++ )
		forces[i] = forces[i].add(gravity.mul(particleMass));
	
	// [IMPLEMENTED] Update positions and velocities
	// (only when the vertex is not manually selected)
	for ( i = 0; i < positions.length; i++ )
	{
		if ( !(massSpring.selVert == i) )
		{
			// New acceleration and velocity
			a = forces[i].div(particleMass);
			velocities[i] = velocities[i].add(a.mul(dt));

			// New position
			positions[i] = positions[i].add(velocities[i].mul(dt));
		}
	}
	
	// [IMPLEMENTED] Handle collisions
	for ( i = 0; i < positions.length; i++ )
	{
		// Check if the particle exceed the limits of the box
		// on all the 3 axes
		if ( positions[i].x < -1 || positions[i].x > 1 )
		{
			// Reflect the velocity
			velocities[i].x = -restitution * velocities[i].x;
			positions[i].x = Math.max(-1, Math.min(1, positions[i].x));
		}
		if ( positions[i].y < -1 || positions[i].y > 1 )
		{
			// Reflect the velocity
			velocities[i].y = -restitution * velocities[i].y;
			positions[i].y = Math.max(-1, Math.min(1, positions[i].y));
		}
		if ( positions[i].z < -1 || positions[i].z > 1 )
		{
			// Reflect the velocity
			velocities[i].z = -restitution * velocities[i].z;
			positions[i].z = Math.max(-1, Math.min(1, positions[i].z));
		}
	}
}

// Vertex shader source code
var meshVS = `
	attribute vec3 pos;
	attribute vec2 txc;
	attribute vec3 norm;
	uniform mat4 mvp;
	uniform mat4 matInversion;
	uniform mat4 mv;
	uniform mat3 normalMatrix;
	
	varying vec2 texCoord;
	varying vec3 normal;
	varying vec4 position;

	void main()
	{
		gl_Position = mvp * matInversion * vec4(pos,1);
		texCoord = txc;
		normal = normalMatrix * norm;
		position = mv * vec4(pos,1);
	}
`;

// Fragment shader source code
var meshFS = `
	precision mediump float;
	varying vec2 texCoord;
	uniform bool flagTex;
	uniform sampler2D tex;
	uniform vec3 lightDirection;
	uniform float alpha;

	varying vec3 normal;
	varying vec4 position;

	void main()
	{
		// Color of the object
		vec4 diffuse;
		vec4 specular = vec4(1,1,1,1);
	
		// Evaluating if texture must be applied
		if (flagTex)
			diffuse = texture2D( tex, texCoord );
		else
			diffuse = vec4(1,1,1,1);

		// Calculating the h vector
		vec3 h = normalize(normalize(lightDirection) + (-normalize(position).xyz));
		
		// Calculating the diffuse and specular component
		// We fix the light intensity as 1 
		diffuse = diffuse * max(0.0, dot(normalize(normal), normalize(lightDirection)));
		specular = specular * max(0.0, pow(dot(normalize(normal), h), alpha));
		
		gl_FragColor = diffuse + specular;
	}
`;

