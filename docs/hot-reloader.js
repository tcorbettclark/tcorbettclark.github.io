function start_hot_reloader() {
  const host = window.location.host;
  const protocol = window.location.protocol == "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${protocol}://${host}/ws`);

  ws.onclose = function close_without_having_opened() {
    // We will replace this function after successfully opening the connection.
    // Hence if we reach here, the websocket closed without ever having opened
    // and so failed to connect/open in the first place.
    alert(
      "Hot reloader failed. Is the local server running?\n\nClose this window to try again.",
    );
    // Best to reload because the server content may have changed in the interim.
    window.location.reload(true);
  };

  ws.onopen = function on_open() {
    console.log("Hot reloader: websocket connection open");
    // Start a keep-alive pinger to encourage the browser to keep the websocket open.
    var pinger_id = setInterval(() => {
      ws.send("keep-alive-ping");
    }, 5000);
    // Now that we have opened the connection, replace the onclose function.
    ws.onclose = function close_after_opened_ok() {
      clearInterval(pinger_id);
      console.log("Hot reloader: websocket connection closed");
      setTimeout(start_hot_reloader, 50);
    };
  };

  ws.onmessage = function on_message(event) {
    if (event.data == "reload") {
      window.location.reload(true);
    } else {
      console.log(`Hot reloader websocket received: {event.data}`);
    }
  };
}

addEventListener("load", (event) => {
  // Only start the hot reloader if this page is being served by AWG (the local
  // dev server). AWG marks every response with the `X-Served-By: awg` header,
  // so we probe the current URL and check for it. In production (e.g. GitHub
  // Pages) the header is absent, so the reloader stays inactive and no
  // websocket is ever attempted (no blocking alert, no console noise).
  //
  // This is same-origin, so all response headers are readable without any
  // Access-Control-Expose-Headers configuration, and CSP `connect-src 'self'`
  // already permits the fetch.
  fetch(window.location.href, { method: "HEAD", cache: "no-store" })
    .then((response) => {
      if (response.headers.get("X-Served-By") === "awg") {
        start_hot_reloader();
      }
    })
    .catch(() => {
      // Network error probing for the dev server: safest to do nothing. If the
      // page actually loaded, a fetch of its own URL failing entirely is
      // unlikely, and we must never assume the dev server is present.
    });
});
