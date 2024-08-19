import { fs } from "memfs";

export function loadFs() {
  fs.mkdirSync("/tmp", { recursive: true });
  fetch("chat.ts").then(response => {
    response.text().then(content => {
      fs.writeFileSync("/tmp/chat.ts", content);
    })
  })
}
