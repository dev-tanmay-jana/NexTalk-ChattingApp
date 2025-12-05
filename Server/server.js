import express from 'express';
import "dotenv/config";
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/connectdb.js';
import userroutes from './routes/userroute.js';
import meggaseroutes from './routes/meggaseroutes.js';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// initialize socket.io
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

export const userSocketMap = {};

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;
  io.emit('online-users', Object.keys(userSocketMap));

  socket.on('disconnect', () => {
    if (userId && userSocketMap[userId]) {
      delete userSocketMap[userId];
      io.emit('online-users', Object.keys(userSocketMap));
    }
  });
});

app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.get('/', (req, res) => {
  res.send('API is running....');
});
app.use('/user', userroutes);
app.use('/message', meggaseroutes);

// connect DB
connectDB();

// start server locally only
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// export for Vercel
export default server;