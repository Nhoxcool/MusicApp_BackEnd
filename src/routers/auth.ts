import { create, generateForgetPasswordLink,  grantValid,  logOut,  sendProfile,  sendReVerificationToken, signIn, updatePassword, updateProfile, verifyEmail } from "#/controllers/auth";
import { isValidPasswordResetToken, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { CreateUserSchema, EmailValidationSchema, TokenAnhIdValidation, UpdatePasswordSchema } from "#/utils/validationSchema";
import { Router } from "express";
import fileParser from "#/middleware/fileParse";
const router = Router();

//User handle
//post method
router.post("/create", validate(CreateUserSchema) , create);
router.post("/verify-email", validate(TokenAnhIdValidation) ,verifyEmail);
router.post("/re-verify-email", sendReVerificationToken);
router.post("/forget-password", generateForgetPasswordLink);
router.post("/verify-pass-reset-token", validate(TokenAnhIdValidation), isValidPasswordResetToken, grantValid);
router.post("/update-password", validate(UpdatePasswordSchema), isValidPasswordResetToken, updatePassword)
router.post("/sign-in", validate(EmailValidationSchema), signIn)
//get method
router.get("/is-auth", mustAuth, sendProfile)



// Upload file
router.post('/update-profile', mustAuth, fileParser, updateProfile)

//logout
router.post("/log-out", mustAuth, logOut)


export default router;