import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import { Board } from '../modules/boards/board.model.js';

dns.setServers(['8.8.8.8']);
dotenv.config({ path: 'e:/AI Tuitor/backend/.env' });

const PUNJAB_BOARDS = [
  {
    name: 'Bahawalpur Board',
    code: 'BISEBWP',
    province: 'Punjab',
    districts: ['Bahawalpur', 'Bahawalnagar', 'Rahim Yar Khan'],
  },
  {
    name: 'Dera Ghazi Khan Board',
    code: 'BISEDGKHAN',
    province: 'Punjab',
    districts: ['D.G. Khan', 'Layyah', 'Muzaffargarh', 'Rajanpur'],
  },
  {
    name: 'Faisalabad Board',
    code: 'BISEFSD',
    province: 'Punjab',
    districts: ['Faisalabad', 'Chiniot', 'Jhang', 'Toba Tek Singh'],
  },
  {
    name: 'Gujranwala Board',
    code: 'BISEGRW',
    province: 'Punjab',
    districts: ['Gujranwala', 'Mandi Bahauddin', 'Narowal', 'Hafizabad', 'Gujrat', 'Sialkot'],
  },
  {
    name: 'Lahore Board',
    code: 'BISELAHORE',
    province: 'Punjab',
    districts: ['Lahore', 'Kasur', 'Nankana Sahib', 'Sheikhupura'],
  },
  {
    name: 'Multan Board',
    code: 'BISEMULTAN',
    province: 'Punjab',
    districts: ['Multan', 'Vehari', 'Lodhran', 'Khanewal'],
  },
  {
    name: 'Rawalpindi Board',
    code: 'BISERWP',
    province: 'Punjab',
    districts: ['Rawalpindi', 'Attock', 'Chakwal', 'Jhelum'],
  },
  {
    name: 'Sahiwal Board',
    code: 'BISESAHIWAL',
    province: 'Punjab',
    districts: ['Sahiwal', 'Pakpattan', 'Okara'],
  },
  {
    name: 'Sargodha Board',
    code: 'BISESARGODHA',
    province: 'Punjab',
    districts: ['Sargodha', 'Khushab', 'Mianwali', 'Bhakkar'],
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const board of PUNJAB_BOARDS) {
    const existing = await Board.findOne({ code: board.code });
    if (existing) {
      console.log(`  Skipped (exists): ${board.name} (${board.code})`);
      skipped++;
      continue;
    }

    await Board.create({
      name: board.name,
      code: board.code,
      country: 'Pakistan',
      province: board.province,
      districts: board.districts,
      isActive: true,
    });
    console.log(`  Created: ${board.name} (${board.code}) — ${board.districts.join(', ')}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
