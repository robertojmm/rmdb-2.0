use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct AppConfig {
    db_path: String,
    data_dir: String,
}

fn config_file_path<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("failed to resolve app data dir")
        .join("config.json")
}

fn default_config<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> AppConfig {
    let data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    AppConfig {
        db_path: data_dir.join("rmdb.sqlite").to_string_lossy().into_owned(),
        data_dir: data_dir.to_string_lossy().into_owned(),
    }
}

fn read_config<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> AppConfig {
    let path = config_file_path(app);
    if path.exists() {
        if let Ok(raw) = std::fs::read_to_string(&path) {
            if let Ok(cfg) = serde_json::from_str::<AppConfig>(&raw) {
                return cfg;
            }
        }
    }
    default_config(app)
}

fn init_config<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    let config_path = config_file_path(app);
    if config_path.exists() {
        let cfg = read_config(app);
        println!("[config] Loaded from config file: {}", config_path.display());
        println!("[config] DB path: {}", cfg.db_path);
        println!("[config] Data dir: {}", cfg.data_dir);
    } else {
        let cfg = default_config(app);
        match write_config(app, &cfg) {
            Ok(_) => println!("[config] Created default config at: {}", config_path.display()),
            Err(e) => eprintln!("[config] Failed to create default config: {}", e),
        }
        println!("[config] DB path: {}", cfg.db_path);
        println!("[config] Data dir: {}", cfg.data_dir);
    }
}

fn write_config<R: tauri::Runtime>(app: &tauri::AppHandle<R>, cfg: &AppConfig) -> Result<(), String> {
    let path = config_file_path(app);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(cfg).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_config(app: tauri::AppHandle) -> AppConfig {
    read_config(&app)
}

#[tauri::command]
fn set_data_dir(app: tauri::AppHandle, new_dir: String, move_files: bool, current_db_path: Option<String>) -> Result<(), String> {
    let new_dir_path = PathBuf::from(&new_dir);
    std::fs::create_dir_all(&new_dir_path).map_err(|e| e.to_string())?;

    let new_db_path = new_dir_path.join("rmdb.sqlite");
    let mut old_db_to_delete: Option<PathBuf> = None;

    if move_files {
        // Prefer the path provided by the frontend (actual Bun DB path) over the stored config
        let old_db_str = current_db_path.unwrap_or_else(|| read_config(&app).db_path);
        let old_db = PathBuf::from(&old_db_str);
        if old_db.exists() {
            std::fs::copy(&old_db, &new_db_path).map_err(|e| e.to_string())?;
            // Verify the copy landed correctly before removing the original
            let original_size = std::fs::metadata(&old_db).map_err(|e| e.to_string())?.len();
            let copied_size = std::fs::metadata(&new_db_path).map_err(|e| e.to_string())?.len();
            if copied_size != original_size {
                return Err("Copy verification failed: file sizes do not match".into());
            }
            old_db_to_delete = Some(old_db);
        }
    }

    // Write config before attempting deletion — on Windows, Bun may hold the file
    // open, causing remove_file to fail. Config must be saved regardless.
    let new_config = AppConfig {
        db_path: new_db_path.to_string_lossy().into_owned(),
        data_dir: new_dir,
    };
    write_config(&app, &new_config)?;

    // Best-effort deletion of the original file (may fail if still in use)
    if let Some(old_db) = old_db_to_delete {
        if let Err(e) = std::fs::remove_file(&old_db) {
            eprintln!("[config] Warning: could not delete original DB (may be in use, safe to delete manually): {}", e);
        }
    }

    Ok(())
}

#[tauri::command]
fn restart_app(app: tauri::AppHandle) {
    app.restart();
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            init_config(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_config,
            set_data_dir,
            restart_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
