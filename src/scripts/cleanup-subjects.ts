import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: 'e:/AI Tuitor/backend/.env' });

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const r = await mongoose.connection.db!.collection('subjects').deleteMany({});
  console.log('Deleted:', r.deletedCount, 'subjects');
  
  const remaining = await mongoose.connection.db!.collection('subjects').countDocuments();
  console.log('Remaining:', remaining);
  
  await mongoose.disconnect();
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
