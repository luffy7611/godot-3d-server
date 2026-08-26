const { WebSocketServer } = require('ws');

// استخدام البورت اللي توفره منصة Render تلقائياً، أو البورت 3000 محلياً
const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: PORT });

console.log(`Server is running on port ${PORT}`);

let players = {};

wss.on('connection', (ws) => {
    // إنشاء معرف فريد لكل لاعب يدخل
    const playerId = Math.random().toString(36.substring(2, 9));
    console.log(`Player connected: ${playerId}`);

    // إرسال رسالة ترحيبية للمتصل الجديد مع معرّفه
    ws.send(JSON.stringify({
        type: "WELCOME",
        id: playerId
    }));

    // استقبال البيانات من اللاعب (مثل الإحداثيات والحركة)
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === "MOVE") {
                // حفظ موقع اللاعب وتحديثه
                players[playerId] = {
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    rot: data.rot
                };

                // إعادة إرسال موقع اللاعب لكل اللاعبين الثانيين (بما فيهم البقية)
                const broadcastData = JSON.stringify({
                    type: "PLAYER_MOVE",
                    id: playerId,
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    rot: data.rot
                });

                wss.clients.forEach((client) => {
                    if (client.readyState === client.OPEN) {
                        client.send(broadcastData);
                    }
                });
            }
        } catch (e) {
            console.error("Error parsing message:", e);
        }
    });

    // عندما ينقطع اتصال اللاعب
    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`);
        delete players[playerId];

        // إبلاغ البقية أن اللاعب خرج
        const disconnectData = JSON.stringify({
            type: "PLAYER_DISCONNECT",
            id: playerId
        });

        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(disconnectData);
            }
        });
    });
});
