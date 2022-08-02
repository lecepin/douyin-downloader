use async_recursion::async_recursion;
use futures_util::StreamExt;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use tauri::regex::Regex;

#[derive(serde::Serialize)]
pub struct VideoInfo {
    title: String,
    ratio: String,
    cover: String,
    url: String,
    id: String,
}

#[derive(serde::Serialize)]
pub struct UserInfo {
    nick_name: String,
    video_count: u64,
    avatar: String,
    uid: String,
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    current: u64,
    total: u64,
    id: String,
}

// 取各种 url 的 id
#[tauri::command]
pub async fn get_url_id(addr: String) -> Result<String, String> {
    let mut _addr = addr;
    let mut result = "".to_string();
    let reg_get_share_url = Regex::new(r#"https://v.douyin.com/[^\s ]*"#).unwrap();
    let reg_get_id = Regex::new(r#"https://www.douyin.com/video/([^?&=\s]+)"#).unwrap();

    match reg_get_share_url.captures(&_addr) {
        Some(cap) => {
            let url = cap.get(0).map_or("", |value| value.as_str());

            if url.len() > 0 {
                _addr = reqwest::get(url)
                    .await
                    .map_err(|_| "网络错误")?
                    .url()
                    .as_str()
                    .to_string();
            }
        }
        _ => (),
    }

    if let Some(cap) = reg_get_id.captures(&_addr) {
        result = cap
            .get(1)
            .map_or("".to_string(), |value| value.as_str().to_string());
    }

    if result.len() > 0 {
        return Ok(result);
    }

    Err("解析失败".into())
}

// 取视频信息
#[tauri::command]
pub async fn get_video_info_by_id(id: &str) -> Result<VideoInfo, String> {
    let res_text = reqwest::get(
        "https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=".to_string() + id,
    )
    .await
    .map_err(|_| "网络错误")?
    .text()
    .await
    .map_err(|_| "网络错误")?;
    let raw_info = serde_json::from_str::<serde_json::Value>(&res_text).map_err(|_| "解析错误")?;
    let url = raw_info["item_list"][0]["video"]["play_addr"]["url_list"][0]
        .as_str()
        .unwrap_or("")
        .replace("playwm", "play");

    if url.len() == 0 {
        return Err("此视频地址无效".into());
    }

    Ok(VideoInfo {
        title: raw_info["item_list"][0]["desc"]
            .as_str()
            .unwrap_or("")
            .to_string(),
        ratio: raw_info["item_list"][0]["video"]["ratio"]
            .as_str()
            .unwrap_or("")
            .to_string(),
        cover: raw_info["item_list"][0]["video"]["cover"]["url_list"][0]
            .as_str()
            .unwrap_or("")
            .to_string(),
        id: raw_info["aweme_id"].as_str().unwrap_or("").to_string(),
        url,
    })
}

// 取完整视频信息
#[tauri::command]
pub async fn get_video_full_info_by_id(id: &str) -> Result<serde_json::Value, String> {
    let res_text = reqwest::get(
        "https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=".to_string() + id,
    )
    .await
    .map_err(|_| "网络错误")?
    .text()
    .await
    .map_err(|_| "网络错误")?;

    Ok(serde_json::from_str::<serde_json::Value>(&res_text).map_err(|_| "解析错误")?)
}

// 视频下载
#[tauri::command]
pub async fn download_video(
    url: &str,
    write_path: &str,
    file_name: &str,
    id: &str,
    window: tauri::Window,
) -> Result<String, String> {
    let file_path = Path::new(write_path).join(file_name.replace(
        |item: char| ['\\', '/', ':', '?', '*', '"', '<', '>', '|'].contains(&item),
        "_",
    ));
    let res = reqwest::Client::new()
        .get(url)
        .header("user-agent","Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36")
        .send()
        .await
        .map_err(|_| "网络错误")?;
    let res_len = res.content_length().unwrap_or(0);

    if res_len == 0 {
        return Err("视频长度为 0".into());
    }

    let mut downloaded_len = 0_u64;
    let mut stream = res.bytes_stream();
    let mut file = File::create(&file_path).map_err(|_| "文件创建失败")?;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|_| "网络错误")?;

        file.write_all(&chunk).map_err(|_| "文件写入失败")?;
        downloaded_len += chunk.len() as u64;

        window
            .emit(
                "e_download_progress",
                DownloadProgress {
                    current: downloaded_len,
                    total: res_len,
                    id: id.into(),
                },
            )
            .unwrap();
    }

    Ok(file_path.to_str().unwrap().into())
}

// 取用户信息
#[tauri::command]
pub async fn get_user_info_by_url(addr: &str) -> Result<UserInfo, String> {
    let reg_get_user_id = Regex::new(r#"https://www.douyin.com/user/([\w-]+)"#).unwrap();
    let uid = reg_get_user_id
        .captures(addr)
        .map_or(Err("地址错误"), |cap| {
            Ok(cap.get(1).map_or("", |value| value.as_str()))
        })?;
    let res_text =
        reqwest::get("https://www.iesdouyin.com/web/api/v2/user/info/?sec_uid=".to_string() + uid)
            .await
            .map_err(|_| "网络错误")?
            .text()
            .await
            .map_err(|_| "网络错误")?;
    let raw_info = serde_json::from_str::<serde_json::Value>(&res_text).map_err(|_| "解析错误")?;
    let video_count = raw_info["user_info"]["aweme_count"]
        .as_u64()
        .unwrap_or(0_u64);

    if video_count == 0 {
        return Err("用户视频数为 0".into());
    }

    Ok(UserInfo {
        nick_name: raw_info["user_info"]["nickname"]
            .as_str()
            .unwrap_or("")
            .to_string(),
        video_count,
        avatar: raw_info["user_info"]["avatar_larger"]["url_list"][0]
            .as_str()
            .unwrap_or("")
            .to_string(),
        uid: uid.into(),
    })
}

// 取完整用户信息
#[tauri::command]
pub async fn get_user_full_info_by_url(addr: &str) -> Result<serde_json::Value, String> {
    let reg_get_user_id = Regex::new(r#"https://www.douyin.com/user/(\w+)"#).unwrap();
    let uid = reg_get_user_id
        .captures(addr)
        .map_or(Err("地址错误"), |cap| {
            Ok(cap.get(1).map_or("", |value| value.as_str()))
        })?;
    let res_text =
        reqwest::get("https://www.iesdouyin.com/web/api/v2/user/info/?sec_uid=".to_string() + uid)
            .await
            .map_err(|_| "网络错误")?
            .text()
            .await
            .map_err(|_| "网络错误")?;

    Ok(serde_json::from_str::<serde_json::Value>(&res_text).map_err(|_| "解析错误")?)
}

// 取用户下的所有个人视频
#[tauri::command]
#[async_recursion]
pub async fn get_list_by_user_id(
    uid: &str,
    count: u64,
    max_cursor: u64,
) -> Result<Vec<VideoInfo>, String> {
    let mut res: Vec<VideoInfo> = vec![];
    let res_text =
        reqwest::get(format!("https://www.iesdouyin.com/web/api/v2/aweme/post/?sec_uid={uid}&count={count}&max_cursor={max_cursor}"))
            .await
            .map_err(|_| "网络错误")?
            .text()
            .await
            .map_err(|_| "网络错误")?;
    let raw_info = serde_json::from_str::<serde_json::Value>(&res_text).map_err(|_| "解析错误")?;
    let has_more = raw_info["has_more"].as_bool().unwrap_or(false);
    let max_cursor = raw_info["max_cursor"].as_u64().unwrap_or(0_u64);
    let video_list = match raw_info["aweme_list"].is_array() {
        true => raw_info["aweme_list"].as_array().unwrap(),
        _ => {
            return Err("用户视频数为 0".into());
        }
    };

    res.append(
        video_list
            .iter()
            .map(|item| VideoInfo {
                title: item["desc"].as_str().unwrap_or("").to_string(),
                ratio: item["video"]["ratio"].as_str().unwrap_or("").to_string(),
                cover: item["video"]["cover"]["url_list"][0]
                    .as_str()
                    .unwrap_or("")
                    .to_string(),
                url: item["video"]["play_addr"]["url_list"][0]
                    .as_str()
                    .unwrap_or("")
                    .replace("playwm", "play"),
                id: item["aweme_id"].as_str().unwrap_or("").to_string(),
            })
            .collect::<Vec<VideoInfo>>()
            .as_mut(),
    );

    if !has_more {
        return Ok(res);
    }

    res.append(get_list_by_user_id(uid, count, max_cursor).await?.as_mut());

    Ok(res)
}

// 取用户下的所有点赞视频
#[allow(dead_code)]
pub fn get_list_like_by_user_id() {}

// 取用户下的所有收藏视频
#[allow(dead_code)]
pub fn get_list_favorite_by_user_id() {}

// 取 #tag 下的所有视频
#[allow(dead_code)]
pub fn get_list_by_hash_tag() {}
