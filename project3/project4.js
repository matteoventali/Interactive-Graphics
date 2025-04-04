// Ventali Matteo (1985026)
// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
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
	var mvp = MatrixMult(projectionMatrix, MatrixMult(trans, resRot));
	
	return mvp;
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
		
		// Get the ids of the vertex attributes in the shaders
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' );

		// Get the ids of the vertex attributes in the shaders
		this.matInversion = gl.getUniformLocation( this.prog, 'matInversion' );
		
		// Vertex buffer of WebGL
		this.vertbuffer = gl.createBuffer();

		// Inversion matrix
		this.mat = Array(1, 0, 0, 0, 	0, 1, 0, 0, 	0, 0, 1, 0, 	0, 0, 0, 1);
		
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords )
	{
		// [IMPLEMENTED] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
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
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [IMPLEMENTED] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );
		gl.uniformMatrix4fv( this.mvp, false, trans );
		gl.uniformMatrix4fv( this.matInversion, false, this.mat);
		gl.bindBuffer( gl.ARRAY_BUFFER, this.vertbuffer );
		gl.vertexAttribPointer( this.vertPos, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( this.vertPos );
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );
	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture

		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
	}
	
}

// Vertex shader source code
var meshVS = `
	attribute vec3 pos;
	uniform mat4 mvp;
	uniform mat4 matInversion;
	void main()
	{
		gl_Position = mvp * matInversion * vec4(pos,1);
	}
`;
// Fragment shader source code
var meshFS = `
	precision mediump float;
	void main()
	{
		gl_FragColor = vec4(1,gl_FragCoord.z*gl_FragCoord.z,0,1);
	}
`;
