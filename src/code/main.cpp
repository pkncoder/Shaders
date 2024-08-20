#include "../includes/packs/standardImports.h"
#include "../includes/packs/gui.h"
#include "./libs/Shader.h"
#include "./libs/Window.h"
#include "./libs/Program.h"
#include "./libs/WindowMesh.h"
#include "./libs/WPV.h"

#define WIDTH 1200
#define HEIGHT 650

using namespace std;

int main() {  

    // ------------------- Window -------------------------


    // Create a window
    Window window(WIDTH, HEIGHT, "Hello, Window!", true);


    // ----------------- Shader & Program -----------------

    // Variable for the fragment shader
    std::string fragmentShader = "fragment.frag";
    std::string filePath = "/home/pkner/code/Shaders/src/shaders/";

    // Create our vertex and fragment shaders
    Shader vertex("/home/pkner/code/Shaders/src/shaders/vertex.vert", GL_VERTEX_SHADER);
    Shader fragment((filePath + fragmentShader).c_str(), GL_FRAGMENT_SHADER);

    // Create our shader program that holds everything to be ran
    Program shaderProgram(vertex, fragment);


    // ---------------------- Viewport ---------------------


    // Create our viewport triangles
    WindowMesh* viewport = new WindowMesh();


    // ------------------- Pre-Run loop ---------------------


    // Set a clear color in our window
    window.setClearColor(0.0, 0.0, 0.0, 1.0);


    // -------------------------- WPV -----------------------


    WPV wpv = WPV(window, shaderProgram, viewport);

    
    // --------------------- Run Loop -----------------------

    int selected = 0;
    
    bool mouseMove = false;
    int time = 0;

    float albedo[3];
    albedo[0] = 0.0;
    albedo[1] = 0.0;
    albedo[2] = 1.0;

    float roughness = 1.0;
    float metallic = 0.0;
    float ambient = 0.0;

    while(window.windowOpen()) {

        // Start proccess
        wpv.start();


        /* BASE */

        if (ImGui::Button("Compile", ImVec2(100, 50))) {

            shaderProgram.kill();

            Shader vertex("/home/pkner/code/Shaders/src/shaders/vertex.vert", GL_VERTEX_SHADER);
            Shader fragment((filePath + fragmentShader).c_str(), GL_FRAGMENT_SHADER);

            shaderProgram = Program(vertex, fragment);

            wpv.setProgram(shaderProgram);
        }

        const char* fragmentShaders[] {
            "fragment.frag",
            "oldFragment.frag",
            "oldFragmentPBR.frag"
        };

        ImGui::ListBox("Fragment Shader File", &selected, fragmentShaders, 3);

        fragmentShader = fragmentShaders[selected];

        
        ImGui::Checkbox("Mouse", &mouseMove);
        wpv.getProgram().setBool("u_mouseMove", mouseMove);

        double mouseXPos;
        double mouseYPos;
        glfwGetCursorPos(wpv.getWindow().getWindow(), &mouseXPos, &mouseYPos);

        wpv.getProgram().setFloat("u_mousePosX", mouseXPos);
        wpv.getProgram().setFloat("u_mousePosY", mouseYPos);

        wpv.getProgram().setInt("u_time", time);

        /* BASE */


        /* EXTRA */

        ImGui::ColorEdit3("Albedo", albedo);
        wpv.getProgram().setArrayf3("u_albedo", albedo);

        ImGui::SliderFloat("Roughness", &roughness, 0.0, 1.0);
        wpv.getProgram().setFloat("u_roughness", roughness);

        ImGui::SliderFloat("Metallic", &metallic, 0.0, 1.0);
        wpv.getProgram().setFloat("u_metallic", metallic);

        ImGui::SliderFloat("Ambient", &ambient, 0.0, 1.0);
        wpv.getProgram().setFloat("u_ambient", ambient);






        // End proccess
        wpv.end();

        time++;
    }

    // -------------------- Post-Run loop --------------------


    // Kill our shader program
    shaderProgram.kill();

    // Kill our window
    window.kill();
}