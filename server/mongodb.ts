import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();

let db: Db;
let logsCollection: Collection;
let nftCollection: Collection;

export function initMongoDB() {
    return new Promise((resolve) => {
    // MongoDB setup
    console.log(process.env.MONGOURI);
    const uri = process.env.MONGOURI as string;
    const dbName = 'flexmarket_db';
    const client = new MongoClient(uri);
    client.connect().then(() => {
        db = client.db(dbName);
        nftCollection = db.collection('nfts');
        logsCollection = db.collection('logs');
        console.log('Connected to MongoDB');
        resolve ( { nftCollection, logsCollection });
    }).catch((err: any) => console.error(err));
    });
}

export async function updateLogs(db: any, id: string) {
    // If topic does not exists, create a new one and store the latest version
    const currentDate = new Date();
    const log = await db.logsCollection.insertOne({
        id,
        date: currentDate
    })
    console.log(log);
}

export async function insertTx(db: any, transactionId: string, dropId: string, casterId, requesterId) {
  // If topic does not exists, create a new one and store the latest version
  const currentDate = new Date();
  let tx = await db.nftCollection.findOne({transactionId});
  if (!tx) {
    tx = await db.nftCollection.insertOne({
      transactionId,
      dropId,
      casterId,
      requesterId,
      date: currentDate
    })
  } else {
    await db.nftCollection.updateOne(
        { transactionId },
        { $set: { dropId, minted: currentDate, casterId, requesterId } }
    );
}
}

export async function updateTx(db: any, transactionId: string, tokenId: string) {
    const currentDate = new Date();
    let tx = await db.nftCollection.findOne({transactionId})
    if (!tx) {
        tx = await db.nftCollection.insertOne({
            transactionId,
            tokenId,
            date: currentDate,
            minted: currentDate
        })
    } else {
        await db.nftCollection.updateOne(
            { transactionId },
            { $set: { tokenId, minted: currentDate } }
        );
    }
}