#include "./Program.h"

// ---------------------- Constructor(s) --------------------
Program::Program(Shader vertexShader, Shader fragmentShader) {
    
    // Store the shaders
    this->vertexShader = vertexShader;
    this->fragmentShader = fragmentShader;

    // Create a new program
    this->program = glCreateProgram();

    // Attach our shaders
    glAttachShader(program, vertexShader.getShader()); // Vertex Shader
    glAttachShader(program, fragmentShader.getShader()); // Fragment Shader

    // Link all the parts together in our program
    glLinkProgram(program);

    // Then error check
    int succsess; // Error output
    glGetProgramiv(program, GL_LINK_STATUS, &succsess); // Get the program iv

    // Check for an error
    if (!succsess) { 

        // IF there is an error
        char errorLog[1024]; // Keep an error log ver
        glGetProgramInfoLog(program, 1024, NULL, errorLog); // Get the log info
        std::cout << "Shader linking error:\n" << errorLog << '\n'; // Print it out
    } 
    
    else {
        // IF there isn't an error print out that
        std::cout << "Shaders attached sucsessfully" << std::endl;
    }

    // Validate our program
    glValidateProgram(program);

    // Detach our shaders now that they are linked
    glDetachShader(program, vertexShader.getShader());
    glDetachShader(program, fragmentShader.getShader());

    // Free our shaders from memory now that we don't need them
    vertexShader.removeShader();
    fragmentShader.removeShader();
}


// -------------------------- Seters -----------------------


// Int
void Program::setInt(const std::string &name, int value)
{ 
    glUniform1i(glGetUniformLocation(program, name.c_str()), value); 
}

// Float
void Program::setFloat(const std::string &name, float value)
{ 
    glUniform1f(glGetUniformLocation(program, name.c_str()), value); 
} 

// Bool
void Program::setBool(const std::string &name, bool value)
{         
    glUniform1i(glGetUniformLocation(program, name.c_str()), (int)value); 
}

// Array 3 float
void Program::setArrayf3(const std::string &name, float value[3]) {
    glUniform3f(glGetUniformLocation(program, name.c_str()), value[0], value[1], value[2]);
}


// --------------------------- Methods ----------------------


// Use our program
void Program::use() {
    glUseProgram(program);
}


// Used to free memory from the program
void Program::kill() {
    glDeleteProgram(program);
}