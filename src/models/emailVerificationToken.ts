// interface (typescript)
import { Model, ObjectId, Schema, model } from "mongoose";
import { hash, compare } from "bcrypt";
interface EmailVerificationTokenDocument {
    owner: ObjectId;
    token: string;
    createAt: Date;
}

interface Methods {
    compareToken(token: string): Promise<boolean>
}

// expired after 1 hours

const emailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument, {}, Methods>({
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

emailVerificationTokenSchema.pre('save', async function(next){
    if(this.isModified('token')){
        this.token = await hash(this.token, 10);
    }
    next();
})

emailVerificationTokenSchema.methods.compareToken = async function(token) {
    const result = await compare(token, this.token)
    return result;
}

export default model("EmailVerificationToken", emailVerificationTokenSchema) as Model<EmailVerificationTokenDocument, {}, Methods>;