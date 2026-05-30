// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|arg| arg == xi_io_emulator_lib::game_session::SESSION_RUN_ARG) {
        xi_io_emulator_lib::game_session::session_run_main();
    }
    xi_io_emulator_lib::run();
}
