// Matteo Ventali (1985026)
// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite( bgImg, fgImg, fgOpac, fgPos )
{
    // We have to apply the alpha blending on the fgImg's pixels that are positioned on
    // the foreground image. We imagine an image as a matrix in which:
    // j -> it is useful to scan the rows;
    // i -> it is useful to scan the columns.
    for ( j=0; j < fgImg.height; j++ )
    {
        for ( i=0; i < fgImg.width; i++ )
        {
            // Apply the translation given by fgPos
            bgX = fgPos.x + i;
            bgY = fgPos.y + j;
            
            // I have to check that the pixel (i,j) is positioned onto the background image
            // To check this we have to ensure that bgX and bgY are in the background image
            if ( bgX >= 0 && bgY >= 0 && bgX < bgImg.width && bgY < bgImg.height )
            {
                // There I have to consider the pixel (i,j) of the foreground image
                // and hence I have to apply the alpha-blending
                // In the data array we have a structure like this one [RGBA, RGBA ....]
                // so I have to convert in the propery way the indexes 
                fgIndex = ((j * fgImg.width) + i)*4;
                bgIndex = ((bgY * bgImg.width) + bgX) * 4;

                // Here we compute the alpha values of foreground and background
                alphaBg = bgImg.data[bgIndex + 3]/255;
                alphaFg = (fgImg.data[fgIndex + 3]/255) * fgOpac;
                
                // Then we compute the alpha final with the following formula
                // a = a_f + (1 - a_f)*a_b
                alphaFinal = alphaFg + (1-alphaFg)*alphaBg;
                
                // Now we apply to the all channels alpha-blending
                // We have three channels RGB
                for ( c=0; c < 3; c++ )
                {
                    // c = a_f * c_f + (1 - a_f) * a_b * c_b
                    bgImg.data[bgIndex + c] = (fgImg.data[fgIndex + c] * alphaFg + 
                            bgImg.data[bgIndex + c] * alphaBg * (1 - alphaFg)) / alphaFinal;
                }

                // Alpha update
                bgImg.data[bgIndex + 3] = alphaFinal * 255;
            }
        }
    }
}