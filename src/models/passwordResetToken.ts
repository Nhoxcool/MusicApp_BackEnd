// interface (typescript)
import { Model, ObjectId, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";


interface PasswordResetTokenDocument {
    owner: ObjectId;
    token: string;
    createAt: Date;
}

interface Methods {
    compareToken(token: string): Promise<boolean>
}

// expired after 1 hours

const passwordResetTokenSchema = new Schema<PasswordResetTokenDocument, {}, Methods>({
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    token: {
        type: String,
        required: true,
    },
    createAt: {
        type: Date,
        expires: 3600, //remove after 1 hours
        default: Date.now(),
    }
});

passwordResetTokenSchema.pre("save", async function (next) {
    if (this.isModified("token")) {
      this.token = await hash(this.token, 10);
    }
    next();
  });
  
  passwordResetTokenSchema.methods.compareToken = async function (token) {
    const result = await compare(token, this.token);
    return result;
  };

export default model("PasswordResetToken", passwordResetTokenSchema) as Model<PasswordResetTokenDocument, {}, Methods>;