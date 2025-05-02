function start_hot_reloader() {
  var ws = new WebSocket("ws://localhost:8000/ws");
  var successfully_opened = false;

  pinger_id = setInterval(() => {
    ws.send("ping");
  }, 5000);

  ws.onopen = function (even) {
    console.log("Hot reloader: websocket connection open");
    successfully_opened = true;
  };

  ws.onclose = function () {
    clearInterval(pinger_id);
    console.log("Hot reloader: websocket connection closed");
    if (successfully_opened) {
      // Try again after a brief pause.
      setTimeout(start_hot_reloader, 50);
    } else {
      // If a websocket closes without ever having opening then it
      // failed to connect/open in the first place.
      alert(
        "Hot reloader failed. Is the local server running?\n\nClose this window to try again.",
      );
      // Best to reload because the server content may have changed.
      window.location.reload(true);
    }
  };

  ws.onmessage = function (event) {
    if (event.data == "reload") {
      window.location.reload(true);
    } else {
      console.log(`Hot reloader websocket received: {event.data}`);
    }
  };
}

addEventListener("load", (event) => {
  if (window.location.hostname == "localhost") {
    start_hot_reloader();
  }
});
