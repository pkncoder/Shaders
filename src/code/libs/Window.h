#pragma once

#include "../../includes/packs/windowImports.h"
#include "../../includes/packs/standardImports.h"

using namespace std;

class Window {

    private:
        // The GLFW window (the actual window)
        GLFWwindow* window;

        // If IMGUI is incorpriated
        bool imgui;

        // Setting the necissary window hints with versions spesified
        void setWindowHints(int majorGlVersion, int minorGlVersion);

        // Setup the window
        void setupWindow(int width, int height, string title);
        

        // Loads open gl
        void init(float width, float height);

    public:

        // Setup stuff
        // Constructor basic
        Window(int width, int height, string title, bool imgui);

        // Constructor advanced
        Window(int width, int height, string title, int majorGlVersion, int minorGlVersion, bool imgui);

        // Getters
        // Returns the actual glfw window
        GLFWwindow* getWindow() { return window; };

        // Setters
        // Set the screens clear color
        void setClearColor(float r, float g, float b, float a);


        // Methods

        // Returns true if the window should still be open
        bool windowOpen();

        // Runs the start window stuff
        void start();

        // Runs the end window stuff
        void end();

        // Terminates the glfw window
        void kill();

        Window() {};
};