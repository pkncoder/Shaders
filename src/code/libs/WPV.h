#pragma once

#include "../../includes/packs/windowImports.h"

#include "./Window.h"
#include "./Program.h"
#include "./WindowMesh.h"

class WPV {

    private:

        // The Window Program Mesh part of WPV
        Window window; // W
        Program program; // P
        WindowMesh* viewport; // V

    public:

        // Constructor(s)
        WPV(Window window, Program program, WindowMesh* viewport);


        // Getters
        Window getWindow() { return window; }; // Window
        Program getProgram() { return program; }; // Program
        WindowMesh* getViewport() { return viewport; }; // Mesh


        // Setters
        void setProgram(Program program); // Updating to a new program


        // Methods
        void start(); // During your run loop, run this at the start
        void end(); // During your run loop, run this at the end

};