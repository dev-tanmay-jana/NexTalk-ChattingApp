import Message from "../models/message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";
//get all messages between two users

export const getUserFromSidebar = async (req, res) => {
    try {
        const userId = req.user._id
        const filteruser = await User.find({ _id: { $ne: userId } }).select('-password');
        
        //count unread messages from each user
        const unSeenMessagesCount = {};
        const promises = filteruser.map(async (user) => {
            const messages = await Message.find({ sender: user._id, receiver: userId, seen: false });
            if (messages.length > 0) {
                unSeenMessagesCount[user._id] = messages.length;
            }
        });
        await Promise.all(promises);
        res.json({ success: true, users: filteruser, unSeenMessages: unSeenMessagesCount });
        
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

//get all messages for selected chat user
export const getMessages = async (req, res) => {
    try {
        const { id: chatUserId } = req.params;
        const userId = req.user._id;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: chatUserId },
                { sender: chatUserId, receiver: userId }
            ]
        })
        await Message.updateMany(
            { sender: chatUserId, receiver: userId, seen: false },
            { $set: { seen: true } }
        );
        res.json({ success: true, messages });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

//api to mark messages as seen message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({ success: true, message: "Message marked as seen" });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

//send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;

        if (image) {
            const uploadresponse = await cloudinary.uploader.upload(image, { folder: "NexTalk/Messages" });
            imageUrl = uploadresponse.secure_url;
        }
        // allow text to default to empty string for image-only messages
        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            text: text || '',
            image: imageUrl,
        });

        //emit message to receiver if online
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('new-message', newMessage);
        }
        res.json({ success: true, data: newMessage, message: "Message sent successfully" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};