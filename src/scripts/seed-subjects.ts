import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import { Class } from '../modules/classes/class.model.js';
import { Subject } from '../modules/subjects/subject.model.js';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: 'e:/AI Tuitor/backend/.env' });

const SUBJECTS = [
  { name: 'Pakistan Studies', code: 'PST' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Urdu', code: 'URD' },
  { name: 'Islamiyat', code: 'ISL' },
  { name: 'Tarjama Tul Quran', code: 'TTQ' },
  { name: 'English', code: 'ENG' },
  { name: 'Computer Science', code: 'CS' },
  { name: 'Biology', code: 'BIO' },
  { name: 'Physics', code: 'PHY' },
  { name: 'Chemistry', code: 'CHEM' },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Delete ALL existing subjects
  const deleteResult = await Subject.deleteMany({});
  console.log(`Deleted ${deleteResult.deletedCount} existing subjects`);

  // Get all 9th and 10th classes
  const classes = await Class.find({ grade: { $in: [9, 10] } });
  console.log(`Found ${classes.length} classes (9th & 10th)`);

  let created = 0;

  for (const cls of classes) {
    for (const sub of SUBJECTS) {
      await Subject.create({
        name: sub.name,
        class: cls._id,
        code: sub.code,
        isActive: true,
      });
      created++;
    }
    console.log(`  Added ${SUBJECTS.length} subjects to ${cls.name}`);
  }

  console.log(`\nDone: ${created} subjects created`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
