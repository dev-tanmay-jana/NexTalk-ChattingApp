import express from 'express';
import { updateProfile,singup,login,getAuthenticatedUser } from '../controllers/userController.js';
import { authenticateUser } from '../middleware/auth.js';


const userroutes = express.Router();

userroutes.post('/signup', singup);
userroutes.post('/login', login);
userroutes.put('/updateprofile', authenticateUser, updateProfile);
userroutes.get('/getuser', authenticateUser, getAuthenticatedUser);

export default userroutes;