#include "../includes/packs/standardImports.h"
#include "../includes/packs/gui.h"
#include "./libs/Shader.h"
#include "./libs/Window.h"
#include "./libs/Program.h"
#include "./libs/WindowMesh.h"
#include "./libs/WPV.h"

#define WIDTH 3000
#define HEIGHT 2000

using namespace std;

int main() {  

    // ------------------- Window -------------------------


    // Create a window
    Window window(WIDTH, HEIGHT, "Hello, Window!", true);


    // ----------------- Shader & Program -----------------


    // Create our vertex and fragment shaders
    Shader vertex("/home/pkner/code/Shaders/src/shaders/vertex.vert", GL_VERTEX_SHADER);
    Shader fragment("/home/pkner/code/Shaders/src/shaders/fragment.frag", GL_FRAGMENT_SHADER);

    // Create our shader program that holds everything to be ran
    Program shaderProgram(vertex, fragment);


    // ---------------------- Viewport ---------------------


    // Create our viewport triangles
    WindowMesh* viewport = new WindowMesh();


    // ------------------- Pre-Run loop ---------------------


    // Set a clear color in our window
    window.setClearColor(1.0, 0.0, 1.0, 1.0);


    // -------------------------- WPV -----------------------


    WPV wpv = WPV(window, shaderProgram, viewport);

    
    // --------------------- Run Loop -----------------------

    float fov = 30.0;
    int u_time = 0;
    int raysPerPixel = 1;

    while(window.windowOpen()) {

        // Start proccess
        wpv.start();

        if (ImGui::Button("Compile", ImVec2(100, 50))) {

            shaderProgram.kill();

            Shader vertex("/home/pkner/code/Shaders/src/shaders/vertex.vert", GL_VERTEX_SHADER);
            Shader fragment("/home/pkner/code/Shaders/src/shaders/fragment.frag", GL_FRAGMENT_SHADER);

            shaderProgram = Program(vertex, fragment);

            wpv.setProgram(shaderProgram);
        }

        ImGui::SliderInt("Rays Per Pixel", &raysPerPixel, 1.0, 100.0);
        wpv.getProgram().setInt("u_raysPerPixel", raysPerPixel);

        bool mouseMove;
        ImGui::Checkbox("Mouse", &mouseMove);

        wpv.getProgram().setBool("u_mouseMove", mouseMove);


        ImGui::SliderFloat("FOV", &fov, 1.0, 179.0);

        wpv.getProgram().setFloat("u_fov", fov);

        double mouseXPos;
        double mouseYPos;

        glfwGetCursorPos(wpv.getWindow().getWindow(), &mouseXPos, &mouseYPos);

        wpv.getProgram().setFloat("u_mousePosX", mouseXPos);
        wpv.getProgram().setFloat("u_mousePosY", mouseYPos);

        wpv.getProgram().setInt("u_time", u_time);

        // End proccess
        wpv.end();

        u_time++;
    }

    // -------------------- Post-Run loop --------------------


    // Kill our shader program
    shaderProgram.kill();

    // Kill our window
    window.kill();
}