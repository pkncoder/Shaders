#include "../../includes/packs/windowImports.h"
#include "../../includes/packs/fileImports.h"

#include "Shader.h"
#include <filesystem>
#include <cstring>


// ------------------------- Constructor(s) ------------------------------------


// Shader Path - file path to shader
// Open Gl Shader - type of shader ex. (GL_VERTEX_SHADER / GL_FRAGMENT_SHADER)
Shader::Shader(const char* shaderPath, GLint openGlShader) {

    // Compiling our shader and setting it to the attribute
    this->shader = compileShader(shaderPath, openGlShader);

}


// ------------------------------- Methods --------------------------------------

// Compiling our final shader
// Shader Path - file path to shader
// Open Gl Shader - type of shader ex. (GL_VERTEX_SHADER / GL_FRAGMENT_SHADER)
GLint Shader::compileShader(const char* shaderPath, GLint openGlShader) {

    // File variable
    ifstream file;

    // Set some exeptions to our file
    file.exceptions(ifstream::failbit | ifstream::badbit);

    // Open our file 
    file.open(shaderPath);

    // Check for errors when opening
    if (!file.is_open()) {
        cerr << "Failed to open the file." << endl;
        return 1;
    }

    // Get a buffer for our file text
    stringstream buffer;

    // Get the text from the file and output it into the buffer
    buffer << file.rdbuf();

    // Close our file
    file.close();

    // Get the file contents from the buffer and put it into a string
    string fileContents = buffer.str();

    // Save the file contents into a const char*
    const char* fileContentsChar = fileContents.c_str();

    // Save the text to a variable
    this->shaderText = fileContentsChar;

    openGlShader = glCreateShader(openGlShader);
    
    // Create a shader source for more info to the openGlShader before compilation
    glShaderSource(openGlShader, 1, &fileContentsChar, NULL);
    
    // Finally compile our shader
    glCompileShader(openGlShader);
    

    // Error checking 
    // Variables
    int success; // int to tell if an error has occored or not
    char infoLog[512]; // The text output

    // Get the shader iv to tell if an error happened or not
    glGetShaderiv(openGlShader, GL_COMPILE_STATUS, &success); 

    // Test for an error
    if(!success)
    {
        // Get the error log
        glGetShaderInfoLog(openGlShader, 512, NULL, infoLog);

        // Output it
        std::cout << "Shader Compilation Failed\n" << infoLog << std::endl;
        return 1;
    }

    // No error
    else {
        // IF there isn't an error print out that
        std::cout << "Shader compiled sucsessfully" << std::endl;
    }

    // Return the shader
    return openGlShader;
}

// Memory freeage
void Shader::removeShader() {
    // Delete the shader
    glDeleteShader(shader);
}
