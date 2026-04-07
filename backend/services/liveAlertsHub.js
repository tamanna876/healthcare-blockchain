const { WebSocketServer } = require('ws');

const clients = new Set();

function attachLiveAlertsHub(server) {
  const wss = new WebSocketServer({ server, path: '/ws/alerts' });

  wss.on('connection', (socket) => {
    clients.add(socket);

    socket.send(
      JSON.stringify({
        type: 'connected',
        ts: Date.now(),
        message: 'Live alerts socket connected',
      })
    );

    socket.on('close', () => {
      clients.delete(socket);
    });
  });

  return wss;
}

function publishLiveAlert(event) {
  const message = JSON.stringify({
    ts: Date.now(),
    ...event,
  });

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

module.exports = {
  attachLiveAlertsHub,
  publishLiveAlert,
};
