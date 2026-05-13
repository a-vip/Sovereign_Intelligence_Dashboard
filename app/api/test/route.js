import { NextResponse } from 'next/server';

export async function GET() {
  const hasDb = !!process.env.POSTGRES_URL;
  const envVars = Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('CRON'));
  
  return NextResponse.json({ 
    status: 'ok', 
    hasDb,
    envVars,
    message: 'System connectivity test' 
  });
}
