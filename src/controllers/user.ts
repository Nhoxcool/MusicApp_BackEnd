import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import { RequestHandler } from "express";

import User from "#/models/user";
import { generateToken } from "#/utils/helper";
import { sendForgetPasswordlink, sendVerificationMail } from "#/utils/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import PasswordResetToken from "#/models/passwordResetToken";
import { isValidObjectId } from "mongoose";
import crypto from 'crypto'
import { PASSWORD_RESET_LINK } from "#/utils/variables";

// Tạo tài khoản
export const create: RequestHandler = async (req: CreateUser, res) => {
    const {email, password, name} = req.body;

    const user = await User.create({email, password, name});
    // send verification email
    const token = generateToken();

    const newToken = await EmailVerificationToken.create({
      owner: user._id,
      token
    })

    sendVerificationMail(token, {name, email, userId:  user._id.toString() })

    res.status(201).json({ user: {id: user._id, name, email} })
};

// Gửi mail xác thực
export const verifyEmail: RequestHandler = async (req: VerifyEmailRequest, res) => {
  const { userId, token } = req.body;

  const verificationToken = await EmailVerificationToken.findOne({
    owner: userId,
  });

  if (!verificationToken)
    return res.status(403).json({ error: "Invalid token!" });

  const matched = await verificationToken.compareToken(token);
  if (!matched) return res.status(403).json({ error: "Invalid token!" });

  await User.findByIdAndUpdate(userId, {
    verified: true,
  });
  await EmailVerificationToken.findByIdAndDelete(verificationToken._id);

  res.json({ message: "Email của bạn đã được xác thực." });
};

//Gửi lại mail xác thực
export const sendReVerificationToken: RequestHandler = async (req , res) => {
  const { userId } = req.body;

  if(!isValidObjectId(userId)) return res.status(403).json({error: "Invalid request!"})

  const user = await User.findById(userId)
  if(!user) return res.status(403).json({error: "Invalid request!"})

  await EmailVerificationToken.findOneAndDelete({
    owner: userId,
  })

  const token = generateToken();

  await EmailVerificationToken.create({
    owner: userId,
    token
  })

 sendVerificationMail(token,{
  name: user?.name,
  email: user?.email,
  userId: user?._id.toString()
 })

 res.json({message: "Vui lòng kiểm tra email của bạn!"})
};


//Gửi link reset password
export const generateForgetPasswordLink: RequestHandler = async (req , res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email
  })
  if(!user) return res.status(404).json({error: 'Không tìm thấy tài khoản!'})

  await PasswordResetToken.findOneAndDelete({
    owner: user._id,
  })

  const token = crypto.randomBytes(36).toString('hex')
  //generate the link
  await PasswordResetToken.create({
    owner: user._id,
    token
  })

  const resetLink = `${PASSWORD_RESET_LINK}?token=${token}&userId=${user._id}`

  sendForgetPasswordlink({email: user.email, link: resetLink})

  res.json({message:"Kiểm tra ở mail đã đăng ký của bạn!"})
};

