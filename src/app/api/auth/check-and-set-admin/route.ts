'use server';
import { NextResponse } from 'next/server';

/**
 * API Route to check if a user's email is in ADMIN_EMAILS
 * This is a client-side only approach - no server-side Firebase Admin needed
 *
 * POST /api/auth/check-and-set-admin
 * Body: { uid: "user-id", email: "user-email" }
 *
 * Since setting custom claims requires Firebase Admin SDK with service account,
 * and we don't have SERVICE_ACCOUNT env var set, we return the admin status
 * based on email and let the Firestore rules be updated to match.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, email } = body;

    if (!uid || !email) {
      return NextResponse.json(
        { error: 'User UID and email are required.' },
        { status: 400 }
      );
    }

    // Import here to avoid top-level server-side dependency issues
    const { ADMIN_EMAILS } = await import('@/lib/types');

    console.log(`[check-and-set-admin] User: ${email} (${uid}), ADMIN_EMAILS: ${ADMIN_EMAILS.join(', ')}`);

    // Check if user's email is in the admin list
    const isAdmin = ADMIN_EMAILS.includes(email);

    console.log(`[check-and-set-admin] User ${email} admin status: ${isAdmin}`);

    return NextResponse.json({
      success: true,
      uid,
      email,
      isAdmin,
      message: `User ${email} admin status: ${isAdmin ? 'Admin' : 'User'}`,
      note: 'Custom claims require SERVICE_ACCOUNT env var. Use admin settings panel to set claims manually.',
    });
  } catch (error) {
    console.error('[check-and-set-admin] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to check admin status: ${errorMessage}` },
      { status: 500 }
    );
  }
}
