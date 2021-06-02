import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import { SignupMiddleware } from '../Middleware/signup-middleware.js';
import { RegisterModel } from '../Models/register-model.js';

const router = express.Router();

const HashPassword = async(Password) => {
    const HashedPassword = await bcrypt.hash(Password, 10);
    return HashedPassword;
};

export const GenerateAuthToken = data => {
    const token = jwt.sign(data, process.env.JWT_AUTH_TOKEN);
    return token;
}

router.post('/', SignupMiddleware, async(req, res) => {
    const { Username, Password, Phone } = req.body;
    const response = await RegisterModel.find({Username});
    if (response.length === 0) {
        Password = HashPassword(Password);
        const data = {Username, Password, Phone};
        const RegisterData = new RegisterModel(data);
        await RegisterData.save();
        const token = GenerateAuthToken(data);
        return res.json({auth_token: token});
    }
});

export default router;