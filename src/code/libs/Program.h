#pragma once

#include "../../includes/packs/windowImports.h"
#include "../../includes/packs/fileImports.h"

#include <vector>

#include "./Shader.h"

class Program {
    
    private:
        // Hold our Shaders
        Shader fragmentShader;
        Shader vertexShader;

        // Hold our main program
        GLint program;

    public:

        // Constructor
        // Takes in two shaders
        Program(Shader vertexShader, Shader fragmentShader);

        // Setters
        void setBool(const std::string &name, bool value);
        void setInt(const std::string &name, int value);
        void setFloat(const std::string &name, float value);
        void setArrayf3(const std::string &name, float value[3]);

        // Getters
        GLuint getProgram() { return program; };


        // Uses our program
        void use();


        // Kills our program and frees memory
        void kill();

        Program() {};
};