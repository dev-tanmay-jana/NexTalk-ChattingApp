import express from "express";
import { authenticateUser } from "../middleware/auth.js";
import { getUserFromSidebar,getMessages,markMessagesAsSeen,sendMessage } from "../controllers/messageControler.js";

//set router
const meggaseroutes = express.Router();

meggaseroutes.get('/users', authenticateUser, getUserFromSidebar);
meggaseroutes.get('/:id', authenticateUser, getMessages);
meggaseroutes.put('/seen/:id', authenticateUser, markMessagesAsSeen);
meggaseroutes.post('/send/:id', authenticateUser, sendMessage);

export default meggaseroutes;
