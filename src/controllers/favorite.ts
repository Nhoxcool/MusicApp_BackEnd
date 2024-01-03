import { PopulateFavList } from "#/@types/audio";
import { paginationQuery } from "#/@types/misc";
import Audio from "#/models/audio";
import Favorite from "#/models/favorite";
import { RequestHandler } from "express-serve-static-core";
import { isValidObjectId } from "mongoose";
import { ppid } from "process";

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

export const getFavorites: RequestHandler = async (req, res) => {
    const userID = req.user.id;
    const { limit = "20", pageNo = "0" } = req.query as paginationQuery;
  
    const favorites = await Favorite.aggregate([
      { $match: { owner: userID } },
      {
        $project: {
          audioIds: {
            $slice: [
              "$items",
              parseInt(limit) * parseInt(pageNo),
              parseInt(limit),
            ],
          },
        },
      },
      { $unwind: "$audioIds" },
      {
        $lookup: {
          from: "audios",
          localField: "audioIds",
          foreignField: "_id",
          as: "audioInfo",
        },
      },
      { $unwind: "$audioInfo" },
      {
        $lookup: {
          from: "users",
          localField: "audioInfo.owner",
          foreignField: "_id",
          as: "ownerInfo",
        },
      },
      { $unwind: "$ownerInfo" },
      {
        $project: {
          _id: 0,
          id: "$audioInfo._id",
          title: "$audioInfo.title",
          about: "$audioInfo.about",
          category: "$audioInfo.category",
          file: "$audioInfo.file.url",
          poster: "$audioInfo.poster.url",
          owner: { name: "$ownerInfo.name", id: "$ownerInfo._id" },
        },
      },
    ]);
  
    res.json({ audios: favorites });
  };
export const getIsFavorite: RequestHandler = async (req,res) => {
    const audioId = req.query.audioId as String

    if(!isValidObjectId(audioId)) res.status(422).json({error: "Invalid Audio Id!"})

    const favorite = await Favorite.findOne({
        owner: req.user.id, items: audioId
    })

    res.json({ result: favorite ? true : false })
} 



