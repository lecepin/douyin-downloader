import { Button } from "antd";
import { invoke } from "@tauri-apps/api/tauri";

import "./App.less";

function App() {
  return (
    <div className="App">
      <Button
        onClick={async () =>
          console.log(await invoke("greet", { name: "1234" }))
        }
      >
        234
      </Button>
    </div>
  );
}

export default App;
