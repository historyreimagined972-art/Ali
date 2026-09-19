import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';

dns.setServers(['8.8.8.8']);
dotenv.config();

const BOARDS = [
  { name: 'Lahore Board', slug: 'lahore', bise: 'BISELAHORE' },
  { name: 'Gujranwala Board', slug: 'gujranwala', bise: 'BISEGRW' },
  { name: 'Multan Board', slug: 'multan', bise: 'BISEMULTAN' },
  { name: 'Faisalabad Board', slug: 'faisalabad', bise: 'BISEFSD' },
  { name: 'Sargodha Board', slug: 'sargodha', bise: 'BISESARGODHA' },
  { name: 'Rawalpindi Board', slug: 'rawalpindi', bise: 'BISERWP' },
  { name: 'Bahawalpur Board', slug: 'bahawalpur', bise: 'BISEBWP' },
  { name: 'DG Khan Board', slug: 'deraGhaziKhan', bise: 'BISEDGKHAN' },
  { name: 'Sahiwal Board', slug: 'sahiwal', bise: 'BISESAHIWAL' },
];

const CLASS_GRADES = [9, 10];

interface PaperLink {
  url: string;
  title: string;
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) return '';
  return res.text();
}

function extractPaperLinks(html: string): PaperLink[] {
  const links: PaperLink[] = [];
  const regex = /href="(\/past_papers\/past-paper-[^"]+\.aspx)"/g;
  const titleRegex = /<h[23][^>]*>([^<]*Past Paper[^<]*)<\/h[23]>/gi;
  
  let match;
  const urls = new Set<string>();
  
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (!urls.has(url) && url.includes('past-paper-')) {
      urls.add(url);
      // Extract title from nearby text
      const idx = match.index;
      const nearby = html.substring(Math.max(0, idx - 500), idx + 500);
      const titleMatch = nearby.match(/<a[^>]*>([^<]*Past Paper[^<]*)<\/a>/i) ||
                         nearby.match(/<h[23][^>]*>([^<]*Past Paper[^<]*)<\/h[23]>/i);
      links.push({
        url: 'https://www.ilmkidunya.com' + url,
        title: titleMatch ? titleMatch[1].trim() : url.split('/').pop()?.replace('.aspx', '') || '',
      });
    }
  }
  
  return links;
}

function extractImageUrls(html: string): string[] {
  const urls: string[] = [];
  const regex = /src="(https:\/\/pastpapers\.ilmkidunya\.com\/past_papers\/Images\/[^"]+\.jpg)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (!urls.includes(match[1])) {
      urls.push(match[1]);
    }
  }
  return urls;
}

function parsePaperTitle(title: string): { year: number; subject: string; group: string; type: string } {
  // Parse "Past Paper 2024 9th Class Lahore Board Biology Group II Subjective"
  const yearMatch = title.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2024;
  
  const subjectMatch = title.match(/(?:Board|board)\s+(.+?)(?:\s+Group|\s*$)/i);
  let subject = subjectMatch ? subjectMatch[1].trim() : '';
  
  const groupMatch = title.match(/Group\s+(I{1,3}|IV|V)/i);
  const group = groupMatch ? groupMatch[1] : 'I';
  
  const typeMatch = title.match(/(Subjective|Objective)/i);
  const type = typeMatch ? typeMatch[1] : 'Subjective';
  
  return { year, subject, group, type };
}

async function scrapeBoard(board: typeof BOARDS[0], grade: number) {
  const pageSlug = `${board.slug}${grade}th-past-papers.aspx`;
  const url = `https://www.ilmkidunya.com/past_papers/${pageSlug}`;
  
  console.log(`Scraping ${board.name} ${grade}th: ${url}`);
  
  const html = await fetchPage(url);
  if (!html) {
    console.log(`  Failed to fetch page`);
    return [];
  }
  
  const paperLinks = extractPaperLinks(html);
  console.log(`  Found ${paperLinks.length} paper links`);
  
  const papers: any[] = [];
  
  for (const link of paperLinks) {
    try {
      const detailHtml = await fetchPage(link.url);
      if (!detailHtml) continue;
      
      const imageUrls = extractImageUrls(detailHtml);
      if (imageUrls.length === 0) continue;
      
      const parsed = parsePaperTitle(link.title);
      
      papers.push({
        title: link.title,
        year: parsed.year,
        subject: parsed.subject,
        group: parsed.group,
        type: parsed.type,
        imageUrl: imageUrls[0],
        detailUrl: link.url,
      });
      
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
      console.log(`  Error fetching ${link.url}: ${err.message}`);
    }
  }
  
  return papers;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');
  
  const db = mongoose.connection.db!;
  const papersCol = db.collection('pastpapers');
  const boardsCol = db.collection('boards');
  const classesCol = db.collection('classes');
  const subjectsCol = db.collection('subjects');
  const usersCol = db.collection('users');
  
  // Get admin user
  const admin = await usersCol.findOne({ email: 'admin@aitutor.com' });
  if (!admin) {
    console.log('Admin user not found');
    process.exit(1);
  }
  
  let totalCreated = 0;
  
  for (const board of BOARDS) {
    // Get board from DB
    const dbBoard = await boardsCol.findOne({ name: board.name });
    if (!dbBoard) {
      console.log(`Board not found in DB: ${board.name}`);
      continue;
    }
    
    for (const grade of CLASS_GRADES) {
      // Get class from DB
      const dbClass = await classesCol.findOne({ board: dbBoard._id, grade });
      if (!dbClass) {
        console.log(`Class ${grade} not found for ${board.name}`);
        continue;
      }
      
      const papers = await scrapeBoard(board, grade);
      
      for (const paper of papers) {
        // Find matching subject
        const subjectRegex = new RegExp(paper.subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const dbSubject = await subjectsCol.findOne({ class: dbClass._id, name: subjectRegex });
        
        if (!dbSubject) {
          // Try partial match
          const allSubjects = await subjectsCol.find({ class: dbClass._id }).toArray();
          const match = allSubjects.find(s => 
            paper.subject.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(paper.subject.toLowerCase())
          );
          if (!match) continue;
          paper._subjectId = match._id;
        } else {
          paper._subjectId = dbSubject._id;
        }
        
        // Check if already exists
        const exists = await papersCol.findOne({
          board: dbBoard._id,
          class: dbClass._id,
          subject: paper._subjectId,
          year: paper.year,
          title: paper.title,
        });
        
        if (exists) continue;
        
        await papersCol.insertOne({
          title: paper.title,
          board: dbBoard._id,
          class: dbClass._id,
          subject: paper._subjectId,
          year: paper.year,
          fileUrl: paper.imageUrl,
          fileName: `${paper.title}.jpg`,
          uploadedBy: admin._id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        totalCreated++;
      }
      
      console.log(`  ${board.name} ${grade}th: ${papers.length} papers found`);
    }
  }
  
  console.log(`\nDone! Total papers created: ${totalCreated}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
