import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";

export async function withBrowserRenderedApp(options, callback) {
  const port = Number(options.port);
  const chromePort = Number(options.chromePort);
  const chromePath = findChrome();

  await assertPortFree(port);
  await assertPortFree(chromePort);

  const server = spawn(
    "npm",
    ["--workspace", "@nerdeus/web", "run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  let serverLog = "";
  server.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
  });

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-extensions",
      "--no-first-run",
      "--remote-debugging-address=127.0.0.1",
      `--remote-debugging-port=${chromePort}`,
      `--window-size=${options.width ?? 1440},${options.height ?? 1000}`,
      "about:blank"
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  try {
    await waitForHttp(`http://127.0.0.1:${port}`, 45_000);
    const cdp = await connectCdp(chromePort);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    if (options.initScript != null) {
      await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: options.initScript });
    }
    const result = await callback({
      cdp,
      baseUrl: `http://127.0.0.1:${port}`,
      screenshot: (path) => screenshot(cdp, path),
      navigate: (url, readyExpression) => navigate(cdp, url, readyExpression),
      evaluate: (expression) => evaluate(cdp, expression)
    });
    await cdp.close();
    return { result, serverLog };
  } finally {
    chrome.kill();
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      server.kill("SIGTERM");
    }
  }
}

export async function enterDemoPin(browser, pin) {
  return browser.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Access code"], input[aria-label="Demo PIN"]');
    if (input == null) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(pin)});
    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(pin)} }));
    document.querySelector('.demo-pin-gate form')?.requestSubmit();
    return true;
  })();`);
}

export async function waitForExpression(browser, expression, timeoutMs = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await browser.evaluate(expression)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

export async function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

export function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

export function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function assertBrowserPng(path) {
  if (!existsSync(path)) throw new Error(`missing screenshot: ${path}`);
  if (statSync(path).size < 5000) throw new Error(`placeholder-like screenshot: ${path}`);
}

async function connectCdp(debugPort) {
  await waitForHttp(`http://127.0.0.1:${debugPort}/json/list`, 20_000);
  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const page = pages.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl != null);
  if (page == null) throw new Error("Chrome DevTools page target was not available");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id != null && pending.has(message.id)) {
      const { resolveMessage, rejectMessage } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectMessage(new Error(JSON.stringify(message.error)));
      else resolveMessage(message.result ?? {});
    }
  });
  return {
    send(method, params = {}) {
      const requestId = ++id;
      socket.send(JSON.stringify({ id: requestId, method, params }));
      return new Promise((resolveMessage, rejectMessage) =>
        pending.set(requestId, { resolveMessage, rejectMessage })
      );
    },
    close() {
      socket.close();
    }
  };
}

async function navigate(cdp, url, readyExpression = "document.body != null") {
  await cdp.send("Page.navigate", { url });
  const start = Date.now();
  while (Date.now() - start < 15_000) {
    if (await evaluate(cdp, readyExpression)) return;
    await delay(250);
  }
  throw new Error(`Timed out waiting for app route: ${url}`);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result?.value;
}

async function screenshot(cdp, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true
  });
  writeFileSync(outputPath, Buffer.from(result.data, "base64"));
  assertBrowserPng(outputPath);
}

async function waitForHttp(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry until timeout
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function assertPortFree(portNumber) {
  return new Promise((resolveFree, rejectFree) => {
    const server = createServer();
    server.once("error", rejectFree);
    server.once("listening", () => server.close(resolveFree));
    server.listen(portNumber, "127.0.0.1");
  });
}

function findChrome() {
  const candidates = process.platform === "win32"
    ? [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
      ]
    : [
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found == null) throw new Error("Chrome or Edge executable is required for browser proof");
  return found;
}
