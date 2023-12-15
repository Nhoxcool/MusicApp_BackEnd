import * as yup from "yup"
import { isValidObjectId } from "mongoose";
export const CreateUserSchema = yup.object().shape({
    name: yup.string().trim().required("Tên đang thiếu!").min(3, "Tên quá ngắn!").max(40, "Tên quá dài!"),
    email: yup.string().trim().required("Email đang thiếu!").email("Email không hợp lệ!"),
    password: yup.string().trim().required("Mật khẩu đang thiếu!").min(8, "Mật khẩu quá ngắn!").matches(
      /^(?=.*[a-z])/,
      "Cần ít nhất một chữ cái thường trong mật khẩu!"
    )
    .matches(
      /^(?=.*[A-Z])/,
      "Cần ít nhất một chữ cái in hoa trong mật khẩu!"
    )
    .matches(/^(?=.*\d)/, "Cần ít nhất một chữ số trong mật khẩu!")
    .matches(
      /^(?=.*[@$!%*?&])/,
      "Cần ít nhất một ký tự đặc biệt trong mật khẩu!"
    )
    .matches(
      /^[A-Za-z\d@$!%*?&]{8,}$/,
      "Mật khẩu phải có ít nhất 8 ký tự và chỉ chứa chữ cái, chữ số và ký tự đặc biệt!"
    ),
});

export const EmailVerificationBody = yup.object().shape({
  token: yup.string().trim().required("invalid token!"),
  userId: yup.string().transform(function(value){
    if(this.isType(value) && isValidObjectId(value)){
      return value
    } 
      return ""
  }).required("Invalid userId!")
})

