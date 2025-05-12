function start_hot_reloader() {
  var ws = new WebSocket("ws://localhost:8000/ws");

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
  if (window.location.hostname == "localhost") {
    start_hot_reloader();
  }
});
