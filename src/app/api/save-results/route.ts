// src/app/api/save-results/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TEMP_DIR = path.join(process.cwd(), 'tmp/data');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    const filename = `participant_${data.participant.id}_${Date.now()}.json`;
    const filePath = path.join(TEMP_DIR, filename);
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, filename });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to save results' },
      { status: 500 }
    );
  }
}