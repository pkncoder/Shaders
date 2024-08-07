#include "./WPV.h"


// Constructor(s)
WPV::WPV(Window window, Program program, WindowMesh* viewport) {
    this->window = window;
    this->program = program;
    this->viewport = viewport;
}

// Setters
void WPV::setProgram(Program program) {
    this->program = program;
}


// Loop settings
void WPV::start() {
    // Start window proccess
    window.start();

    // Use our shader program
    program.use();

    // Draw our viewport
    viewport->draw();
}

void WPV::end() {
    // End window proccess
    window.end();
}