import { categories, categoriesTypes } from "#/utils/audio_category";
import { Model, ObjectId, Schema, model, models } from "mongoose";

export interface AudioDocument<Type = ObjectId> {
    _id: ObjectId,
    title: string;
    about: string;
    owner: Type;
    file: {
        url: string;
        publicId: string;
    }
    poster?: {
        url: string;
        publicId: string;
    }
    likes: ObjectId[];
    category: categoriesTypes;
    createdAt: Date;
}

const AudioSchema = new Schema<AudioDocument>({
    title: {
        type: String,
        required: true,
    },
    owner: {
        type: Schema.ObjectId,
        ref: "User"
    },
    about: {
        type: String,
        required: true,
    },
    file: {
        type: Object,
        url: String,
        publicId: String,
        required: true,
    },
    poster: {
        type: Object,
        url: String,
        publicId: String,
    },
    likes: [{
        type: Schema.ObjectId,
        ref: "User"
    }],
    category: {
        type: String,
        enum: categories,
        default: 'Others'
    }
}, {
    timestamps: true,
})

const Audio = models.Audio || model("Audio", AudioSchema) 

export default Audio as Model<AudioDocument>