import { MongoClient } from 'mongodb';
import { env } from './config/env.js';
import { buildMongoUri, sanitizeDbName } from './config/database.js';

// Resolve connection URI either from built encoded Atlas parameters or direct configuration
const uri = buildMongoUri();
const safeDbName = sanitizeDbName(env.MONGODB_DB_NAME || 'AI_Task_Management_Platform');

console.log(`📡 Connecting to MongoDB Atlas database "${safeDbName}"...`);

const client = new MongoClient(uri);

export async function run() {
  try {
    await client.connect();
    console.log('✅ MongoClient successfully connected!');

    const database = client.db(safeDbName);
    const tasksCollection = database.collection('tasks');

    const count = await tasksCollection.countDocuments();
    console.log(`📊 Found ${count} documents in collection "${tasksCollection.collectionName}"`);

    const cursor = tasksCollection.find().limit(10);
    await cursor.forEach((doc) => console.dir(doc));
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
  } finally {
    await client.close();
    console.log('🔒 MongoClient closed.');
  }
}

// Execute when invoked directly
if (process.argv[1]?.endsWith('dbencode.js')) {
  run().catch(console.dir);
}
