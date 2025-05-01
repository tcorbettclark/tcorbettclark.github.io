function start_hot_reloader() {
  var ws = new WebSocket("ws://localhost:8000/ws");

  pinger_id = setInterval(() => {
    ws.send("ping");
  }, 5000);

  ws.onopen = function (even) {
    console.log("Hot reloader websocket connection open");
  };

  ws.onclose = function () {
    clearInterval(pinger_id);
    console.log("Hot reloader websocket connection closed");
    alert("Hot reloading stopped. Is the dev server running?");
    window.location.reload(true);
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
