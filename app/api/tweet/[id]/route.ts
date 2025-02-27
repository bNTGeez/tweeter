import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/backend/utils/mongoose";
import Tweet from "@/backend/models/tweet.model";

export async function GET (req: NextRequest, {params}: {params: {id: string}}){

  try {
    await connectDB();

    const tweet = await Tweet.findById(params.id).populate({
      path: "author",
      select: "username profilePhoto",
    }).populate({
      path: "comments",
      populate: {
        path: "author", 
        select: "username profilePhoto",
      },
    });

    if(!tweet){
      return NextResponse.json({ error: "Tweet not found"}, {status: 404});
    }

    return NextResponse.json({tweet}, {status: 200});
  } catch (error) {
    return NextResponse.json({ error: "Error fetching tweet"}, {status: 500});
  }

}