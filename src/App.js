import { Button, Input, Progress } from "antd";
import { useEffect, useState } from "react";
import { throttle } from "lodash";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";

import "./App.less";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPersion, setIsLoadingPersion] = useState(false);
  const [videoInfo, setVideoInfo] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    listen(
      "e_download_progress",
      throttle(({ payload }) => {
        setProgress({
          ...progress,
          [payload.id]: ~~((payload.current / payload.total) * 100),
        });
      }, 300)
    );
  }, []);

  return (
    <div className="App">
      <Input className="url" />
      <Button
        loading={isLoading}
        onClick={async () => {
          setIsLoading(true);
          const url = document.querySelector(".url").value;

          try {
            const id = await invoke("get_url_id", { addr: url });
            const info = await invoke("get_video_info_by_id", { id });

            setVideoInfo([info]);
          } catch (error) {
            alert(JSON.stringify(error));
          }

          setIsLoading(false);
        }}
      >
        取ID
      </Button>

      <Button
        loading={isLoadingPersion}
        onClick={async () => {
          const url = document.querySelector(".url").value;
          setIsLoadingPersion(true);
          try {
            const { video_count, uid } = await invoke("get_user_info_by_url", {
              addr: url,
            });

            try {
              const info = await invoke("get_list_by_user_id", {
                uid,
                count: video_count,
                maxCursor: 0,
              });
              console.log(info);
              setVideoInfo(info);
            } catch (error) {
              alert(JSON.stringify(error));
            }
          } catch (error) {
            alert(JSON.stringify(error));
          }

          setIsLoadingPersion(false);
        }}
      >
        取个人视频
      </Button>
      <Button>取个人点赞视频</Button>
      <Button>取个人收藏视频</Button>
      <Button>取 tag 视频</Button>

      {videoInfo.map((videoInfo) => (
        <div key={videoInfo.id}>
          <h3>视频信息</h3>
          <div>{videoInfo.title}</div>
          <img
            style={{ maxWidth: 150, maxHeight: 150 }}
            src={videoInfo?.cover}
          />
          <div>{videoInfo.ratio}</div>
          <a href={videoInfo.url} target="_blank">
            {videoInfo.url}
          </a>
          <Button
            onClick={async () => {
              const dir = await open({ directory: true });

              if (!dir) {
                return;
              }
              const fileName = `${videoInfo.title}${Date.now()}.mp4`;
              try {
                setIsDownloading(true);
                const info = await invoke("download_video", {
                  url: videoInfo.url,
                  writePath: dir,
                  fileName,
                  id: videoInfo.id,
                });
              } catch (error) {
                alert(JSON.stringify(error));
              }

              setTimeout(() => {
                // setProgress({
                //   ...progress,
                //   [fileName]: 0,
                // });
                // setIsDownloading(false);
              }, 400);
            }}
          >
            下载
          </Button>
          <Progress type="circle" percent={progress[videoInfo.id] ?? 0} />
          <hr />
        </div>
      ))}
    </div>
  );
}
