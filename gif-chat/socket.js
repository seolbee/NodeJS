const SocketIO = require('socket.io');
const axios = require('axios');

module.exports = (server, app, sessionMiddleware) => {
    // const wss = new WebSocket.Server({server});
    // wss.on('connection', (ws, req) => {
    //     const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //     ws.on('message', (message) => {
    //         console.log(ip);
    //         console.log(message);
    //     });
    //     ws.on('error', (error) => {
    //         console.error(error);
    //     });
    //     ws.on('close', () => {
    //         clearInterval(ws.interval);
    //     });
    //     ws.interval = setInterval(()=> {
    //         if(ws.readState === ws.OPEN) {
    //             ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
    //         }
    //     }, 3000);
    // })

    // io.on('connection', (socket) => {
    //     const req = socket.request;
    //     const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //     console.log('새로운 클라이언트 접속 !', ip, socket.id, req.ip);
    //     socket.on('disconnect', () => {
    //         console.log('클라이언트 접속 해제', ip, socket.id);
    //         clearInterval(socket.interval);
    //     });
    //     socket.on('error', (error) => {
    //         console.error(error);
    //     });
    //     socket.on('reply', (data) => {
    //         console.log(data);
    //     });
    //     socket.interval = setInterval(() => {
    //         socket.emit('news', 'Hello Socket.IO');
    //     }, 3000);
    // })

    const io = SocketIO(server, {path:'/socket.io'});
    app.set('io', io);
    const room = io.of('/room');
    const chat = io.of('/chat');

    io.use((socket, next) => {
        sessionMiddleware(socket.request, socket.request.res, next);
    });

    room.on('connection', (socket) => {
        console.log('room 네임스페이스에 접속');
        socket.on('disconnect', () => {
            console.log('room 네임스페이스 접속 해제');
        });
    });

    chat.on('connection', (socket) => {
        console.log('chat 네임스페이스에 접속');
        const req = socket.request;
        const {headers:{referer}} = req;
        const roomId = referer.split('/')[referer.split('/').length - 1].replace(/\?.+/, '');
        socket.join(roomId);

        socket.on('disconnect', () => {
            socket.leave(roomId);
            const currentRoom = socket.adapter.rooms[roomId];
            const userCount = currentRoom ? currentRoom.length : 0;
            if(userCount === 0) {
                axios.delete(`http://localhost:8005/room/${roomId}`).then(()=> {
                    console.log('방 제거 요청 성공');
                }).catch((error) => {
                    console.error(error);
                });
            } else {
                socket.to(roomId).emit('exit', {
                    user:'system',
                    chat:`${req.session.color}님이 퇴장하셨습니다.`
                });
            }
        });
    });
};