cmake_minimum_required(VERSION 3.0.0)
project(my_open_gl_project VERSION 0.1.0)
cmake_policy(SET CMP0072 NEW)

find_package(OpenGL REQUIRED)

add_executable(my_open_gl_project 
    src/code/main.cpp

    src/code/libs/Shader.cpp
    src/code/libs/Program.cpp
    src/code/libs/Window.cpp
    src/code/libs/WindowMesh.cpp
    src/code/libs/WPV.cpp

    src/includes/imgui/imgui.cpp
    src/includes/imgui/imgui_draw.cpp
    src/includes/imgui/imgui_demo.cpp
    src/includes/imgui/imgui_widgets.cpp
    src/includes/imgui/imgui_tables.cpp

    src/includes/imgui/imgui_impl_glfw.cpp
    src/includes/imgui/imgui_impl_opengl3.cpp
    
    src/includes/glad/glad.c
)

target_link_libraries(my_open_gl_project
    OpenGL::GL
    glfw
    /home/pkner/code/Shaders/src/includes/imgui/
)