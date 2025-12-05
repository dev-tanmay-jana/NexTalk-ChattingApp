import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/connectdb.js';
import userroutes from './routes/userroute.js';
import meggaseroutes from './routes/meggaseroutes.js';
import { Server  } from 'socket.io';

//create express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

//initialize socket.io
export const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

//store online users
export const userSocketMap = {}; 

//socket.io connection
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);
    if (userId) {
        userSocketMap[userId] = socket.id;
    }
    //emit online users
    io.emit('online-users', Object.keys(userSocketMap));

    //handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
        if (userId && userSocketMap[userId]) {
            delete userSocketMap[userId];
            //emit online users
            io.emit('online-users', Object.keys(userSocketMap));
        }
        
    });
});

//server middlewares
app.use(cors());
app.use(express.json({limit: '4mb'}));

//routes
// root health-check should only respond to GET / so it doesn't intercept other routes
app.get('/', (req, res) => {
    res.send('API is running....');
});

app.use('/user', userroutes);
app.use('/message', meggaseroutes);

//connect to mongodb database
await connectDB();

//start server
if(process.env.NODE_ENV !== "production"){
    server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});
}

//Export server for vercel
export default server;


