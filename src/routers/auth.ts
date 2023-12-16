import { create, generateForgetPasswordLink,  grantValid,  sendReVerificationToken, updatePassword, verifyEmail } from "#/controllers/user";
import { isValidPasswordResetToken } from "#/middleware/auth";
import { validate } from "#/middleware/validator";
import { CreateUserSchema, TokenAnhIdValidation, UpdatePasswordSchema } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/create", validate(CreateUserSchema) , create);
router.post("/verify-email", validate(TokenAnhIdValidation) ,verifyEmail);
router.post("/re-verify-email", sendReVerificationToken);
router.post("/forget-password", generateForgetPasswordLink);
router.post("/verify-pass-reset-token", validate(TokenAnhIdValidation), isValidPasswordResetToken, grantValid);
export default router;
router.post("/update-password", validate(UpdatePasswordSchema), isValidPasswordResetToken, updatePassword)