const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const keyPath = path.join(
  process.env.USERPROFILE || "C:\\Users\\Lenovo",
  ".ssh",
  "id_rsa.pub"
);
const key = fs.readFileSync(keyPath, "utf8");

console.log("Connecting to server...");

const ssh = spawn(
  "ssh",
  [
    "-o",
    "StrictHostKeyChecking=no",
    "-o",
    "PreferredAuthentications=password",
    "ubuntu@124.222.230.80",
    "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo KEY_ADDED",
  ],
  { stdio: ["pipe", "pipe", "pipe"], shell: true }
);

let stage = 0;
ssh.stdout.on("data", (d) => {
  process.stdout.write(d);
});
ssh.stderr.on("data", (d) => {
  const s = d.toString();
  process.stderr.write(s);
  if (
    (s.includes("password:") || s.includes("Password:")) &&
    stage === 0
  ) {
    ssh.stdin.write("Wyx82308257\n");
    stage = 1;
    // Write key after password is sent
    setTimeout(() => {
      ssh.stdin.write(key + "\n");
      ssh.stdin.end();
    }, 500);
  }
});

ssh.on("close", (code) => {
  console.log("SSH exited with code:", code);
  process.exit(code);
});

// Fallback timeout
setTimeout(() => {
  console.log("Timeout - closing");
  ssh.stdin.end();
  process.exit(1);
}, 15000);
