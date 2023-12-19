import { PopulateFavList } from "#/@types/audio";
import Audio from "#/models/audio";
import Favorite from "#/models/favorite";
import { RequestHandler } from "express-serve-static-core";
import { isValidObjectId } from "mongoose";

export const toggleFavorite: RequestHandler = async (req,res) => {
    const audioId = req.query.audioId as String 
    let status : "added" | "removed";

    if(!isValidObjectId(audioId)) return res.status(422).json({error: "Audio không tồn tại!"})

    const audio = await Audio.findById(audioId);
    if(!audio) return res.status(404).json({error: 'Không tìm thấy tài nguyên!'})

    const alreadyExits = await Favorite.findOne({
        owner: req.user.id,
        items: audioId
    })
    if(alreadyExits){
        await Favorite.updateOne({
            owner: req.user.id,
        }, {
            // xóa cái đã tồn tại ra khỏi field
            $pull: {items: audioId}
        })

        status = "removed"
    }else {
        
       const favorite = await Favorite.findOne({owner: req.user.id})
       if(favorite){
        // thêm vào danh sách yêu thích đã có 
        await Favorite.updateOne({  
            owner: req.user.id
        }, {
            $addToSet : {items: audioId}
        })
       }else {
        // tạo một cái fresh list
        Favorite.create({owner: req.user.id, items: [audioId]})
       }

       status = "added"
    }

    if(status === 'added'){
        await Audio.findByIdAndUpdate(audioId, {
            $addToSet: {likes: req.user.id}
        })
    }

    if(status === 'removed') {
        await Audio.findByIdAndUpdate(audioId, {
            $pull: {likes: req.user.id}
        })
    }

    res.json({status})
} 

export const getFavorite: RequestHandler = async (req,res) => {
    const userID = req.user.id;

    const favorite = await Favorite.findOne({
        owner: userID
    }).populate<{items: PopulateFavList[]}>({
        path: "items",
        populate: {
            path: "owner",
        }
    })

    if(!favorite) return res.json({audios: []})

    const audio = favorite.items.map((item) => {
        return {
            id: item._id,
            title: item.title,
            file: item.file.url,
            poster: item.poster?.url,
            owner: {name: item.owner.name, id: item.owner._id}
        }
    })
    res.json({ audio })
} 

export const getIsFavorite: RequestHandler = async (req,res) => {
    const audioId = req.query.audioId as String

    if(!isValidObjectId(audioId)) res.status(422).json({error: "Invalid Audio Id!"})

    const favorite = await Favorite.findOne({
        owner: req.user.id, items: audioId
    })

    res.json({ result: favorite ? true : false })
} 



