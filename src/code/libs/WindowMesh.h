#pragma once

#include "../../includes/packs/windowImports.h"
#include "Program.h"

#include <vector>

class WindowMesh {
    public:
        WindowMesh();
        void draw();
        ~WindowMesh();

    private:
        unsigned int VBO, VAO, EBO;

        GLint mvp_location, vpos_location;
};