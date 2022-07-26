import { Button } from "antd";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";

import "./App.less";

export default function App() {
  useEffect(() => {
    listen("c_event", (event) => {
      console.log(event);
    });
  }, []);

  return (
    <div className="App">
      <Button
        onClick={async () => {
          console.log(await invoke("greet", { name: "1234" }));
        }}
      >
        调用命令 & 监听传来的消息
      </Button>
    </div>
  );
}
