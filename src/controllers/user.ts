import { CreateUser } from "#/@types/user";
import { RequestHandler } from "express";
import nodemailer from "nodemailer";
import User from "#/models/user";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { MAILTRAP_PASSWORD, MAILTRAP_USER } from "#/utils/variables";
import { generateToken } from "#/utils/helper";

export const create: RequestHandler = async (req: CreateUser, res) => {
    const {email, password, name} = req.body;

    

    const user = await User.create({email, password, name});
    // send verification email
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: MAILTRAP_USER,
          pass: MAILTRAP_PASSWORD
        }
      });

    const token = generateToken();
    const verificationToken = EmailVerificationToken.create({
        owner: user._id,
        token
    })


    transport.sendMail({
        to: user.email,
        from: "NhaChill@gmail.com",
        html: `<h1>Mã OTP của bạn là: ${verificationToken}<h1>`,
    })
    res.status(201).json({ user })
}