import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/connectDB.js';
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
        credentials: true
    },
});

//store online users
export const userSocketMap = {}; 

//socket.io connection
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    // console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);
    if (userId) {
        userSocketMap[userId] = socket.id;
    }
    //emit online users
    io.emit('online-users', Object.keys(userSocketMap));

    //handle disconnection
    socket.on('disconnect', () => {
        // console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);
        if (userId && userSocketMap[userId]) {
            delete userSocketMap[userId];
            //emit online users
            io.emit('online-users', Object.keys(userSocketMap));
        }
        
    });

    // WebRTC signaling handlers
    // Caller sends an offer to a specific user
    socket.on('call-user', ({ to, offer }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incoming-call', { from: userId, offer });
        }
    });

    // Callee sends answer back to caller
    socket.on('make-answer', ({ to, answer }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit('call-answered', { from: userId, answer });
        }
    });

    // Exchanging ICE candidates
    socket.on('ice-candidate', ({ to, candidate }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('ice-candidate', { from: userId, candidate });
        }
    });

    // End call
    socket.on('end-call', ({ to }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('call-ended', { from: userId });
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
    server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});



//Export server for vercel
export default server;


