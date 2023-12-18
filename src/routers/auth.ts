import { create, generateForgetPasswordLink,  grantValid,  sendReVerificationToken, signIn, updatePassword, verifyEmail } from "#/controllers/user";
import { isValidPasswordResetToken, mustAuth } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { CreateUserSchema, EmailValidationSchema, TokenAnhIdValidation, UpdatePasswordSchema } from "#/utils/validationSchema";
import { Router } from "express";
import fileParser, { RequestWithFiles } from "#/middleware/fileParse";
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
router.get("/is-auth", mustAuth, (req,res) => { res.json({ profile: req.user, }) })



// Upload file
router.post('/update-profile', fileParser, (req: RequestWithFiles, res) => {
    console.log(req.files)
    res.json({ok: true})
})

export default router;