const app = require('express')();
const { createServer } = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const server = createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"]
    }
});

// for cors setting
var whitelist = ['http://localhost:5500', 'http://127.0.0.1:5500/client']
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

app.use(cors(corsOptions))

app.get('/', (req, res) => {
    res.send('you are in localhost:3050')
})
let chatIdList = []

io.on('connection', async (socket) => {
    socket.join('room1')
    // console.log(socket.rooms)
    chatIdList.push(socket.id) //紀錄進入socket所有id
    await socket.to('room1').emit("init", { msg: "hi everyone I'm " + socket.id, name: socket.id, lists: chatIdList })
    console.log(chatIdList)

    socket.emit('allChatIdlist', { lists: chatIdList })

    socket.on("sendMessage", function ({ msg, id }) {
        console.log('傳入的msg:',msg)
        socket.to(id).emit("message", { msg: msg, name: socket.id })
    })

    socket.on("join", function (id) {
        socket.join(id)
        console.log(socket.rooms)
        socket.to(id).emit("init", { msg: "hi everyone I'm " + socket.id, lists: chatIdList })
    })

    socket.on("disconnect", (reason) => {

        socket.emit('changeChatIdlist', { id: socket.id })
        console.log('要離開的socket.id:' + socket.id)
        chatIdList = chatIdList.filter((id) => id !== socket.id)
        socket.leave(socket.rooms)
        console.log(chatIdList)
        // 聊天人數list修正
        // socket.disconnect(true)
    })
})


io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});

server.listen(3050, () => {
    console.log('you are in port:3050')
})