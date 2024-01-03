import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import User from "#/models/user";
import { formatProfile, generateToken } from "#/utils/helper";
import { sendForgetPasswordlink, sendReSetSuccessEmail, sendVerificationMail } from "#/utils/mail";
import EmailVerificationToken from "#/models/emailVerificationToken";
import PasswordResetToken from "#/models/passwordResetToken";
import { isValidObjectId } from "mongoose";
import crypto from 'crypto'
import { JWT_SECRET, PASSWORD_RESET_LINK } from "#/utils/variables";
import { RequestWithFiles } from "#/middleware/fileParse";
import cloudinary from "#/cloud";
import formidable from "formidable";

// Tạo tài khoản
export const create: RequestHandler = async (req: CreateUser, res) => {
    const {email, password, name} = req.body;

    const oldUser = await User.findOne({email})
    if(oldUser) return res.status(403).json({error: "Email đã được sử dụng!"})

    const user = await User.create({email, password, name});
    // send verification email
    const token = generateToken();

    await EmailVerificationToken.create({
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

  if(user.verified) return res.status(422).json({ error: "Tài khoản email của bạn đã được xác thực từ trước!"})

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


// check request thay đổi mật khẩu
export const grantValid: RequestHandler = async (req , res) => {
  res.json({valid: true})
};

// Thay đổi mật khẩu
export const updatePassword: RequestHandler = async (req, res) => {
  const { password, userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Unauthorized access!" });

  const matched = await user.comparePassword(password);
  if (matched)
    return res
      .status(422)
      .json({ error: "Mật khẩu mới phải khác với mật khẩu cũ!" });

  user.password = password;
  await user.save();

  await PasswordResetToken.findOneAndDelete({ owner: user._id });
  // send the success email

  sendReSetSuccessEmail(user.name, user.email);
  res.json({ message: "Mật khẩu Được thay đổi thành công!." });
};

// Đăng nhập
export const signIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email
  })

  if(!user) return res.status(403).json({error: "Email hoặc mật khẩu không đúng!"})

  const matched = await user.comparePassword(password)
  if(!matched) return res.status(403).json({error: "Email hoặc mật khẩu không đúng!"})

  //Tạo Jason Web Token
  const token = jwt.sign({userId: user._id}, JWT_SECRET);
  user.tokens.push(token)

  await user.save();

  res.json({profile: {id: user._id, name: user.name, email: user.email, verified: user.verified, avatar: user.avatar?.url, followers: user.followers.length, followings: user.followings.length}, token})
};

//Cập nhật Profile
export const updateProfile: RequestHandler = async (
  req: RequestWithFiles,
  res
) => {
  const { name } = req.body;
  const avatar = req.files?.avatar as formidable.File;

  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");

  if (typeof name !== "string")
    return res.status(422).json({ error: "Invalid name!" });

  if (name.trim().length < 3)
    return res.status(422).json({ error: "Invalid name!" });

  user.name = name;

  if (avatar) {
    // if there is already an avatar file, we want to remove that
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar?.publicId);
    }

    // upload new avatar file
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      {
        width: 300,
        height: 300,
        crop: "thumb",
        gravity: "face",
      }
    );

    user.avatar = { url: secure_url, publicId: public_id };
  }

  await user.save();

  res.json({ profile: formatProfile(user) });
};

//Gửi profile
export const sendProfile: RequestHandler = (req, res) => {
  res.json({profile: req.user})
}

//Đăng xuất
export const logOut: RequestHandler = async (req, res) => {
  // Đăng xuất 
  const {fromAll} = req.query
  const token = req.token

  const user = await User.findById(req.user.id)
  if(!user) throw new Error ("Có gì đó không đúng, không tìm thấy người dùng!")

  // Đăng xuất khỏi tất cả thiết bị
  if(fromAll === "yes") user.tokens = []
  else user.tokens = user.tokens.filter((t) => t !== token)

  await user.save();
  res.json({success: true})
}

