## 抖音下载器

⚠ 接口挂了，暂时没时间更新软件了。着急下载的话，可以直接在 电脑 浏览器查看抖音，进入 Devtools，执行以下代码进行下载：

```js
open(
  document.querySelectorAll("video")[
    document.querySelectorAll("video").length == 1 ? 0 : 1
  ].children[0].src
);
```
---

> 在线解析版本：[https://apis.leping.fun/dy/](https://apis.leping.fun/dy/)，代码在 [php_ver.php](./php_ver.php) 中。

![image](https://user-images.githubusercontent.com/11046969/182412269-8ac2dee8-fb30-40b1-b4b3-190c99496759.png)

- 支持下载无水印视频
- 支持下载某个账号号的所有视频

## 下载软件

软件采用 Rust + Tauri 编写，安装包非常小，只有 5MB 左右。

- Windows 下载地址：[douyin-downloader_0.1.0_x64_en-US.msi](https://github.com/lecepin/douyin-downloader/releases/download/v0.1.0/douyin-downloader_0.1.0_x64_en-US.msi)
- Mac 下载地址：[douyin-downloader_0.1.0_x64.dmg](https://github.com/lecepin/douyin-downloader/releases/download/v0.1.0/douyin-downloader_0.1.0_x64.dmg)

> 国内访问速度慢，可以使用以下加速地址：
> - Windows 下载地址：[douyin-downloader_0.1.0_x64_en-US.msi](https://github.91chi.fun/https://github.com//lecepin/douyin-downloader/releases/download/v0.1.0/douyin-downloader_0.1.0_x64_en-US.msi)
> - Mac 下载地址：[douyin-downloader_0.1.0_x64.dmg](https://github.91chi.fun/https://github.com//lecepin/douyin-downloader/releases/download/v0.1.0/douyin-downloader_0.1.0_x64.dmg)


## 使用

如下方式使用。

### 下载单个视频

![image](https://user-images.githubusercontent.com/11046969/182413296-1a97050c-f7fd-4912-bf09-e064d67c888f.png)

手机端、网页端都可，点击分享按钮，把口令复制到本软件中，进行解析即可。

口令类似 `1.20 fBt:/ 拿好纸巾（有双倍福利呦） # 美女合集 # 气质美女 # 变装 @抖音小助手 https://v.douyin.com/23FsM5g/ 复制此链接，打开Dou音搜索，直接观看视频！`

![image](https://user-images.githubusercontent.com/11046969/182413713-7d540831-44cc-42ef-99d9-a30c54300da1.png)

### 下载某个账号号的所有视频

网页版，进入个人页，网址类似 `https://www.douyin.com/user/MS4wLjABAAAAWiOs23d6NtmiUg98zONd6wQhmPsy1WLwZn0jEaCbDL8`：

![image](https://user-images.githubusercontent.com/11046969/182414514-e2e15549-ec85-4dad-b821-3382b16f4abd.png)

复制网址，粘贴到 “用户所有视频” 类型下，解析即可：

![image](https://user-images.githubusercontent.com/11046969/182414926-10d4526d-fff3-495a-8b9b-e2949e3018e4.png)

点击 “全部下载” 按钮，就可以进行全部下载了：

![image](https://user-images.githubusercontent.com/11046969/182415286-851f802d-305b-4684-b6a2-c10976c1338d.png)


一键下载完成：

![image](https://user-images.githubusercontent.com/11046969/182416193-f009597e-9ee4-4c41-aca4-eecbfeafe76d.png)

