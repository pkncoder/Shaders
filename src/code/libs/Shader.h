#pragma once

#include "../../includes/packs/windowImports.h"
#include "../../includes/packs/fileImports.h"
#include <filesystem>

using namespace std;

class Shader {
    private:

        // The actual compiled shader
        GLint shader;

        // The shaders code
        const char* shaderText;

        // The function to compile said shader
        GLint compileShader(const char* shaderPath, GLint openGlShader);

    public:

        // Some random stuff idk something with function params
        Shader() {};

        // The main constructor with the path to file and the type of shader
        Shader(const char* shaderPath, GLint openGlShader);

        // Returns the compiled shader
        GLint getShader() { return shader; };

        // Returns the shader's code
        const char* getShaderText() { return shaderText; };

        // Memory freeage
        void removeShader();
};