const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

let players = {};

wss.on('connection', (ws) => {
    let playerId = Math.random().toString(36).substring(7);
    console.log(`Player connected: `${playerId}`);

    ws.send(JSON.stringify({ type: 'WELCOME', id: playerId }));

    ws.on('message', (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return;
        }

        if (data.type === 'MOVE') {
            players[playerId] = { 
                x: data.x, 
                y: data.y, 
                z: data.z,
                rot: data.rot 
            };

            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'PLAYER_MOVE',
                        id: playerId,
                        x: data.x,
                        y: data.y,
                        z: data.z,
                        rot: data.rot
                    }));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`);
        delete players[playerId];
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'PLAYER_DISCONNECTED', id: playerId }));
            }
        });
    });
});

console.log('Godot 3D Game Server is running...');
