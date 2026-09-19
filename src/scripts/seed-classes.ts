import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import { Board } from '../modules/boards/board.model.js';
import { Class } from '../modules/classes/class.model.js';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: 'e:/AI Tuitor/backend/.env' });

const CLASSES = [
  { name: '9th Class', grade: 9 },
  {name: '10th Class', grade: 10 },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const boards = await Board.find({ province: 'Punjab' });
  console.log(`Found ${boards.length} Punjab boards`);

  let created = 0;
  let skipped = 0;

  for (const board of boards) {
    for (const cls of CLASSES) {
      const existing = await Class.findOne({ name: cls.name, board: board._id });
      if (existing) {
        skipped++;
        continue;
      }
      await Class.create({
        name: cls.name,
        board: board._id,
        grade: cls.grade,
        isActive: true,
      });
      console.log(`  Created: ${cls.name} under ${board.name}`);
      created++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
