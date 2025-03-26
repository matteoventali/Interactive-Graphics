// Matteo Ventali (1985026)
// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	// Get radiants from degrees
	r = rotation * Math.PI/180;
	
	// Build of translation matrix
	translationMatrix = Array(1, 0, 0, 0, 1, 0, positionX, positionY, 1);

	// Build of rotation matrix (counter-clockwise)
	rotationMatrix = Array(Math.cos(r), Math.sin(r), 0, -Math.sin(r), Math.cos(r), 0, 0, 0, 1);

	// Build of scale matrix
	scaleMatrix = Array(scale, 0, 0, 0, scale, 0, 0, 0, 1);
	
	// Matrix transformation result
	result = ApplyTransform(ApplyTransform(scaleMatrix, rotationMatrix), translationMatrix);

	return result;
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	// To apply first trans1 and then trans2 we have to compute the product trans2 * trans1
	result = Array(9).fill(0);
	
	for(row = 0; row < 3; row++) // row of trans2
	{
		for(column = 0; column < 3; column++) // column of trans1
		{
			partialSum = 0;
			
			for (j=0; j < 3; j++) // Internal index in the scalar-product
			{
				partialSum += trans2[row + j*3] * trans1[column*3 + j];
			}

			// Store the partial sum into the result array
			result[column*3 + row] = partialSum;
		}
	}

	return result;
}
