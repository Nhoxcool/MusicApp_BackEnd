import nodemailer from "nodemailer";
import path from "path";

import User from "#/models/user";
import EmailVerificationToken from "#/models/emailVerificationToken";
import { MAILTRAP_PASSWORD, MAILTRAP_USER, VERIFICATION_EMAIL } from "#/utils/variables";
import { generateToken } from "#/utils/helper";
import { generateTemplate } from "#/mail/template";

const generateMailTransporter = () => {
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: MAILTRAP_USER,
          pass: MAILTRAP_PASSWORD
        }
      });
    
    return transport;
}

interface Profile {
    name: string,
    email: string,
    userId: string,
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
    const transport = generateMailTransporter();

    const {name, email, userId} = profile;

    const newToken = await EmailVerificationToken.create({
        owner: userId,
        token
    })
    
    const welcomeMessage = `Xin chào ${name}, Chào mừng bạn đến với NhacChill! Bạn hãy dành một chút thời gian để xác thực người dùng, Sử dụng mã OTP dưới đây để xác thực email của bạn `
    
    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL,
        subject: "Email chào mừng",
        html: generateTemplate({
          title: "Chào mừng đến với NhacChill",
          message: welcomeMessage,
          logo:"cid:logo",
          banner:"cid:welcome",
          link: "#",
          btnTitle: token
        }),
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, "../mail/logo.png"),
            cid: "logo"
          }, 
          {
            filename: "welcome.png",
            path: path.join(__dirname, "../mail/welcome.png"),
            cid: "welcome"
          }
        ]
    }) 
}

