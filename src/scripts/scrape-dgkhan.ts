import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dns.setServers(['8.8.8.8']);
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected');

  const db = mongoose.connection.db!;
  const boardsCol = db.collection('boards');
  const classesCol = db.collection('classes');
  const subjectsCol = db.collection('subjects');
  const papersCol = db.collection('pastpapers');
  const usersCol = db.collection('users');

  const admin = await usersCol.findOne({ email: 'admin@aitutor.com' });
  const board = await boardsCol.findOne({ code: 'BISEDGKHAN' });
  console.log('Board:', board?.name);

  for (const grade of [9, 10]) {
    const url = `https://www.ilmkidunya.com/past_papers/deraGhaziKhan${grade}th-past-papers.aspx`;
    console.log(`Fetching ${grade}th: ${url}`);

    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();

    const links: string[] = [];
    const regex = /href="(\/past_papers\/past-paper-[^"]+\.aspx)"/g;
    let m;
    const seen = new Set<string>();
    while ((m = regex.exec(html)) !== null) {
      if (!seen.has(m[1]) && m[1].includes('past-paper-')) {
        seen.add(m[1]);
        links.push('https://www.ilmkidunya.com' + m[1]);
      }
    }
    console.log(`  Found ${links.length} links`);

    const cls = await classesCol.findOne({ board: board!._id, grade });
    if (!cls) { console.log('  Class not found'); continue; }

    let created = 0;

    for (const link of links) {
      try {
        const r = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const h = await r.text();
        const imgMatch = h.match(/src="(https:\/\/pastpapers\.ilmkidunya\.com\/past_papers\/Images\/[^"]+\.jpg)"/);
        if (!imgMatch) continue;

        const titleMatch = link.match(/past-paper-(.+)\.aspx/);
        const title = titleMatch ? 'Past Paper ' + titleMatch[1].replace(/-/g, ' ') : link;
        const yearMatch = title.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : 2024;

        const subjectMatch = title.match(/(?:Board|board)\s+(.+?)(?:\s+Group|\s*$)/i);
        const subjectName = subjectMatch ? subjectMatch[1].trim() : '';

        let subjectId = null;
        const allSubs = await subjectsCol.find({ class: cls._id }).toArray();
        const match = allSubs.find((s: any) =>
          subjectName.toLowerCase().includes(s.name.toLowerCase()) ||
          s.name.toLowerCase().includes(subjectName.toLowerCase())
        );
        if (match) subjectId = match._id;
        if (!subjectId) continue;

        const exists = await papersCol.findOne({ board: board!._id, class: cls._id, subject: subjectId, year, title });
        if (exists) continue;

        await papersCol.insertOne({
          title, board: board!._id, class: cls._id, subject: subjectId, year,
          fileUrl: imgMatch[1], fileName: `${title}.jpg`,
          uploadedBy: admin!._id, createdAt: new Date(), updatedAt: new Date(),
        });
        created++;
        await new Promise(r => setTimeout(r, 200));
      } catch { /* skip */ }
    }
    console.log(`  Created: ${created}`);
  }

  const total = await papersCol.countDocuments();
  console.log(`Total papers now: ${total}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
