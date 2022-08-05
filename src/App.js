import { Button, Input, Space, Select, Popover, Table, message, BackTop } from "antd";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { open as openFile } from "@tauri-apps/api/shell";
import { QuestionCircleOutlined, PlaySquareOutlined, GithubFilled, EyeOutlined, DownloadOutlined, CloudDownloadOutlined } from "@ant-design/icons";
import imgLogo from "./logo.png";
import "./App.less";

export default function App() {
  const [parseType, setParseType] = useState("video");
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState([]);
  const [isParseLoading, setIsParseLoading] = useState(false);
  const [status, setStatus] = useState({});
  const [allDownloading, setAllDownloading] = useState(false);

  return (
    <div className="App">
      <Space className="App-topbar">
        <span>类型</span>
        <Popover
          placement="bottomLeft"
          content={
            <div style={{ maxWidth: 520, wordBreak: "break-all" }}>
              <p>单个视频：如 “9.94 Eho:/ 我把事情拖到最后一分钟做不是因为我懒而是那个时候我更老了 做事情也更成熟了# 叮叮当当舞 # 杰星编舞 https://v.douyin.com/2vLYnCp/ 复制此链接，打开Dou音搜索，直接观看视频！”</p>
              <hr />
              <p>用户所有视频：如“https://www.douyin.com/user/MS4wLjABAAAABsXrboCFzZqd2HrqUMBCUmMWRHDqjMdrW0WndNDaFAbO924AWWF7fk8YJUdZYmjk”</p>
            </div>
          }
          trigger="hover"
        >
          <QuestionCircleOutlined />
        </Popover>
        <Select
          value={parseType}
          disabled={false}
          onChange={(value) => setParseType(value)}
        >
          <Select.Option key="video">单 个 视 频</Select.Option>
          <Select.Option key="userVideo">用户所有视频</Select.Option>
        </Select>
        <Input
          placeholder={ parseType === "video" ? "请填入分享的视频链接" : "请填入用户的页面网址" }
          disabled={false}
          value={url}
          onChange={({ target }) => { setUrl(target.value); }}
        ></Input>
        <Button
          type="primary"
          loading={isParseLoading}
          onClick={async () => {
            setIsParseLoading(true);

            try {
              if (parseType === "video") {
                const id = await invoke("get_url_id", { addr: url });
                const info = await invoke("get_video_info_by_id", { id });

                setVideoInfo([info]);
              } else {
                const { video_count, uid } = await invoke("get_user_info_by_url", { addr: url, });
                const info = await invoke("get_list_by_user_id", { uid, count: video_count, maxCursor: 0 });

                setVideoInfo(info);
              }
            } catch (error) {
              message.error(error);
            }

            setIsParseLoading(false);
          }}
        >
          解析{parseType === "video" ? "单个视频" : "所有视频"}
        </Button>
        <Button
          icon={<GithubFilled />}
          onClick={() => open_url("https://github.com/lecepin/douyin-downloader") }
        >
          <b> Star</b>
        </Button>
      </Space>

      {videoInfo?.length > 0 ? (
        <>
          <div>
            <Button
              loading={allDownloading}
              icon={<CloudDownloadOutlined />}
              type="primary"
              ghost
              onClick={async () => {
                const dir = await open({ directory: true });

                if (!dir) {
                  return;
                }

                setAllDownloading(true);

                for (let _index = 0; _index < videoInfo.length; _index++) {
                  const { id, title, url } = videoInfo[_index];
                  const fileName = `${title}${Date.now()}.mp4`;

                  try {
                    setStatus((status) => ({
                      ...status,
                      [id]: {
                        status: "downloading",
                      },
                    }));

                    const filePath = await invoke("download_video", {
                      url,
                      writePath: dir,
                      fileName,
                      id: id,
                    });

                    setStatus((status) => ({
                      ...status,
                      [id]: {
                        status: "done",
                        filePath,
                      },
                    }));
                  } catch (error) {
                    message.error(error);
                    setStatus({
                      ...status,
                      [id]: null,
                    });
                  }
                }

                setAllDownloading(false);
              }}
            >
              全部下载
            </Button>
          </div>
          <Table
            sticky
            rowKey="id"
            dataSource={videoInfo}
            columns={[
              {
                title: "序号",
                dataIndex: "index",
                key: "index",
                ellipsis: true,
                width: 80,
                render: (_a, _b, index) => index + 1,
              },
              {
                title: "封面",
                dataIndex: "cover",
                key: "cover",
                render: (value) =>
                  value ? (
                    <img
                      style={{ maxHeight: 100, maxWidth: 100 }}
                      src={value}
                    />
                  ) : null,
                width: 100,
              },
              {
                title: "标题",
                dataIndex: "title",
                key: "title",
                ellipsis: true,
              },
              {
                title: "分辨率",
                dataIndex: "ratio",
                key: "ratio",
                width: 100,
                ellipsis: true,
              },
              {
                title: "操作",
                dataIndex: "action",
                key: "action",
                width: "180px",
                render: (_, { url, title, id }) => (
                  <div>
                    {status[id]?.status == "done" ? (
                      <Button
                        icon={<EyeOutlined />}
                        type="primary"
                        onClick={() => {
                          status[id].filePath &&
                            openFile(status[id].filePath).catch(() => {});
                        }}
                        size="small"
                        ghost
                      >
                        查看
                      </Button>
                    ) : (
                      <Button
                        icon={<DownloadOutlined />}
                        loading={
                          status[id]?.status == "downloading" || allDownloading
                        }
                        type="primary"
                        size="small"
                        onClick={async () => {
                          const fileName = `${title}${Date.now()}.mp4`;
                          const dir = await open({ directory: true });

                          if (!dir) {
                            return;
                          }

                          try {
                            setStatus({
                              ...status,
                              [id]: {
                                status: "downloading",
                              },
                            });

                            const filePath = await invoke("download_video", {
                              url,
                              writePath: dir,
                              fileName,
                              id: id,
                            });

                            setStatus({
                              ...status,
                              [id]: {
                                status: "done",
                                filePath,
                              },
                            });
                          } catch (error) {
                            message.error(error);
                            setStatus({
                              ...status,
                              [id]: null,
                            });
                          }
                        }}
                      >
                        下载
                      </Button>
                    )}
                    &nbsp; &nbsp;
                    <Button
                      icon={<PlaySquareOutlined />}
                      onClick={() => open_url(url)}
                      size="small"
                    >
                      预览
                    </Button>
                  </div>
                ),
              },
            ]}
            pagination={false}
          ></Table>
        </>
      ) : (
        <div className="App-logo">
          <img src={imgLogo} />
          <Button
            icon={<GithubFilled />}
            size="large"
            onClick={() =>
              open_url("https://github.com/lecepin/douyin-downloader")
            }
          >
            <b> Star</b>
          </Button>
        </div>
      )}
      <BackTop style={{ left: 50 }} />
    </div>
  );
}

function open_url(url) {
  const el = document.createElement("a");
  el.style.display = "none";
  el.setAttribute("target", "_blank");
  el.href = url;
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
}
