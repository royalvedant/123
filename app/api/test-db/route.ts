import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const dbUrlResolved = process.env.TURSO_DATABASE_URL || 'not set (using fallback)';
    const dbTokenResolved = process.env.TURSO_AUTH_TOKEN ? 'set (length: ' + process.env.TURSO_AUTH_TOKEN.length + ')' : 'not set';
    
    let queryResult = null;
    let queryError = null;
    
    try {
      const res = await db.execute('SELECT 1 + 1 AS result');
      queryResult = res.rows;
    } catch (err: any) {
      queryError = {
        message: err.message,
        stack: err.stack,
        code: err.code,
      };
    }

    let usersCount = null;
    let usersError = null;
    try {
      const res = await db.execute('SELECT COUNT(*) AS count FROM Users');
      usersCount = res.rows[0];
    } catch (err: any) {
      usersError = {
        message: err.message,
        stack: err.stack,
        code: err.code,
      };
    }

    return NextResponse.json({
      env: {
        TURSO_DATABASE_URL: dbUrlResolved,
        TURSO_AUTH_TOKEN: dbTokenResolved,
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
      },
      dbTest: {
        success: !queryError,
        result: queryResult,
        error: queryError,
      },
      usersTableTest: {
        success: !usersError,
        result: usersCount,
        error: usersError,
      }
    });
  } catch (e: any) {
    return NextResponse.json({
      error: 'Diagnostic API failed completely',
      message: e.message,
      stack: e.stack
    }, { status: 500 });
  }
}
