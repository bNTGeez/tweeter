import { connectDB } from "@/backend/utils/mongoose";
import { connect } from "http2";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method == "GET") {
    try {
      await connectDB();
      res.status(200).json({ message: "connected to database" });
    } catch (error: any) {
      res.status(500).json({ message: "error connecting", error });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
