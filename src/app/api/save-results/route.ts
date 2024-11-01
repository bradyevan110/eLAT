// src/app/api/save-results/route.ts

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This directory is temporary in Vercel but we can still write to it
const TEMP_DIR = path.join(process.cwd(), 'tmp/data');

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create directory if it doesn't exist
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    // Create filename with timestamp and participant ID
    const filename = `participant_${data.participant.id}_${Date.now()}.json`;
    const filePath = path.join(TEMP_DIR, filename);
    
    // Save the data
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error('Error saving results:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save results' },
      { status: 500 }
    );
  }
}

// Add an endpoint to retrieve all data
export async function GET() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const allData = [];
    
    for (const file of files) {
      const content = await fs.readFile(path.join(TEMP_DIR, file), 'utf8');
      allData.push(JSON.parse(content));
    }
    
    return NextResponse.json({ success: true, data: allData });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve data' },
      { status: 500 }
    );
  }
}