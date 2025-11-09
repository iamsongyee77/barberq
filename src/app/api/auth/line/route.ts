'use server';
import { NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import axios from 'axios';

// Initialize Firebase Admin SDK
const adminApp = initFirebaseAdmin();

const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;

if (!LINE_CHANNEL_ID) {
  console.warn("LINE_CHANNEL_ID is not set in environment variables.");
}

/**
 * API Route ที่รับ ID Token จาก LIFF, ตรวจสอบความถูกต้อง,
 * และสร้าง Firebase Custom Token กลับไป
 */
export async function POST(request: Request) {
  if (!LINE_CHANNEL_ID) {
    return NextResponse.json({ error: 'Server configuration error: LINE_CHANNEL_ID is not set.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    // 1. ตรวจสอบ ID Token กับ LINE Platform
    const lineProfile = await verifyLineToken(idToken);
    const lineUserId = lineProfile.sub; // `sub` คือ User ID ของ LINE

    // 2. สร้างหรือดึงข้อมูลผู้ใช้ใน Firebase Authentication
    const userRecord = await getOrCreateFirebaseUser(lineUserId, {
      displayName: lineProfile.name,
      picture: lineProfile.picture,
    });

    // 3. สร้าง Firebase Custom Token
    const firebaseToken = await getAuth(adminApp).createCustomToken(userRecord.uid);

    // 4. ส่ง Token กลับไปให้ Client
    return NextResponse.json({ firebaseToken });

  } catch (error) {
    console.error("Error creating custom token:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Unauthorized: ${errorMessage}` }, { status: 401 });
  }
}

/**
 * ตรวจสอบ ID Token กับ LINE's API endpoint
 * @param {string} idToken The ID Token from LIFF client
 * @return {Promise<any>} The decoded profile from LINE
 */
async function verifyLineToken(idToken: string): Promise<any> {
  const params = new URLSearchParams();
  params.append("id_token", idToken);
  params.append("client_id", LINE_CHANNEL_ID!);

  const response = await axios.post(
    "https://api.line.me/oauth2/v2.1/verify",
    params,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  return response.data;
}

/**
 * ดึงข้อมูลผู้ใช้จาก Firebase ถ้ามีอยู่แล้ว, หรือสร้างใหม่ถ้ายังไม่มี
 * @param {string} uid The UID for the user (we use LINE User ID)
 * @param {object} metadata Additional user data like name and picture
 * @return {Promise<import('firebase-admin/auth').UserRecord>} The user record.
 */
async function getOrCreateFirebaseUser(
  uid: string,
  metadata: { displayName?: string; picture?: string }
): Promise<import('firebase-admin/auth').UserRecord> {
  const auth = getAuth(adminApp);
  try {
    return await auth.getUser(uid);
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      console.log(`Creating new Firebase user for UID: ${uid}`);
      return await auth.createUser({
        uid: uid,
        displayName: metadata.displayName,
        photoURL: metadata.picture,
      });
    }
    throw error;
  }
}
