#include "../../includes/packs/gui.h"

#include "Window.h"


// ----------------------------------- Constructor(s) -------------------------------
// Base / recomended constructor
Window::Window(int width, int height, string title, bool imgui) {

    // Set our imgui variable
    this->imgui = imgui;

    // Initialize glfw
    if (!glfwInit()) {
        cout << "Error initializing GLFW" << endl;
    } else {
        cout << "Initialized GLFW" << endl;
    }

    // Set the window hints with the recomended values
    setWindowHints(3, 3); 

    // Setup our window
    setupWindow(width, height, title);

    // Initialize it
    init(width, height);
}

// More advanced constructor
Window::Window(int width, int height, string title, int majorGlVersion, int minorGlVersion, bool imgui) {

    // Set our imgui variable
    this->imgui = imgui;

    if (!glfwInit()) {
        cout << "Error initializing GLFW" << endl;
        return;
    } else {
        cout << "Initialized GLFW" << endl;
    }

    // Set the window hints with the customized values
    setWindowHints(majorGlVersion, minorGlVersion); 

    // Setup our window
    setupWindow(width, height, title);

    // Initialize it
    init(width, height);
}


// ------------------------------------- Setters -----------------------------------


// Setters
void Window::setClearColor(float r, float g, float b, float a) {
    glClearColor(r, g, b, a);
}

// Setting our window hints
void Window::setWindowHints(int majorGlVersion, int minorGlVersion) {
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, majorGlVersion);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, minorGlVersion);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
}

// -------------------------------------- Methods ----------------------------------


// Setting up our window
void Window::setupWindow(int width, int height, string title) {

    // Create our window
    window = glfwCreateWindow(
        width,
        height,
        title.c_str(),
        NULL, NULL
    );

    // Make our context current for open gl
    glfwMakeContextCurrent(window);
}


// Loading open gl
void Window::init(float width, float height) {

    // Initialize open gl
    // If there is an an error print that out and break
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return;
    }    

    // If there were no errors
    else {
        // Print out a succsess line
        cout << "OpenGl loaded successfully" << endl;
    }

    if (imgui) {
        // Setup Dear ImGui context
        IMGUI_CHECKVERSION();
        ImGui::CreateContext();
        ImGuiIO& io = ImGui::GetIO();
        io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;     // Enable Keyboard Controls

        // Setup Platform/Renderer backends
        ImGui_ImplGlfw_InitForOpenGL(window, true);          // Second param install_callback=true will install GLFW callbacks and chain to existing ones.
        ImGui_ImplOpenGL3_Init();
    }

    // Set our shader's gl veiwport
    glViewport(0, 0, width, height);
}

// If the window should still be open
// True if it shouldn't close
// False if it should
bool Window::windowOpen() {
    return !glfwWindowShouldClose(window);
}

// Run when starting the run loop
void Window::start() {

    // Clears the screen
    glClear(GL_COLOR_BUFFER_BIT);

    // If imgui is used
    if (imgui) {

        // Create a new frame in open gl / glfw
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();

        // Create a new frame
        ImGui::NewFrame();
    }
}

// Run when finished with the run loop
void Window::end() {

    // If im gui is used
    if (imgui) {

        // Render the draw data
        ImGui::Render();

        // Render the draw data in open gl
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
    }

    // Swap the window buffers
    glfwSwapBuffers(window);

    // Poll events
    glfwPollEvents();
}

// Kills the window and frees memory
void Window::kill() {

    // Destoy the window
    glfwDestroyWindow(window);

    // Terminate glfw
    glfwTerminate();

    // If imgui was used
    if (imgui) {

        // Kill imgui
        ImGui_ImplOpenGL3_Shutdown();
        ImGui_ImplGlfw_Shutdown();

        // kill imgui's content
        ImGui::DestroyContext();
    }
}