// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiaryEntry {
    pub date: String,
    pub title: String,
    pub content: String,
    pub mood: String,
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_path: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DiaryDatabase {
    pub diaries: HashMap<String, DiaryEntry>,
}

fn get_storage_path() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = home.join(".config").join("aurora-diary");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir.join("diary.json")
}

fn get_media_dir() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    let dir = home.join(".config").join("aurora-diary").join("images");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir
}

#[tauri::command]
fn load_diaries() -> Result<HashMap<String, DiaryEntry>, String> {
    let path = get_storage_path();
    if !path.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let db: DiaryDatabase = serde_json::from_str(&content).unwrap_or_default();
    Ok(db.diaries)
}

#[tauri::command]
fn save_diary(entry: DiaryEntry) -> Result<(), String> {
    let path = get_storage_path();
    let mut db: DiaryDatabase = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        DiaryDatabase::default()
    };

    db.diaries.insert(entry.date.clone(), entry);

    let serialized = serde_json::to_string_pretty(&db).map_err(|e| e.to_string())?;
    fs::write(&path, serialized).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_diary(date: String) -> Result<(), String> {
    let path = get_storage_path();
    if !path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut db: DiaryDatabase = serde_json::from_str(&content).unwrap_or_default();
    db.diaries.remove(&date);

    let serialized = serde_json::to_string_pretty(&db).map_err(|e| e.to_string())?;
    fs::write(&path, serialized).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn copy_image_to_storage(source_path: String) -> Result<String, String> {
    let src = Path::new(&source_path);
    if !src.exists() {
        return Err("Source file does not exist".into());
    }

    let file_name = src
        .file_name()
        .ok_or_else(|| "Invalid file name".to_string())?;
    let media_dir = get_media_dir();
    let timestamp = chrono::Utc::now().timestamp_millis();
    let dest_file_name = format!("{}_{}", timestamp, file_name.to_string_lossy());
    let dest_path = media_dir.join(dest_file_name);

    fs::copy(src, &dest_path).map_err(|e| e.to_string())?;
    Ok(dest_path.to_string_lossy().to_string())
}

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Fix for WebKitGTK / Wayland (Hyprland) Error 71 (protocol error)
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            load_diaries,
            save_diary,
            delete_diary,
            copy_image_to_storage
        ])
        .run(tauri::generate_context!())
        .expect("error while running aurora diary application");
}
