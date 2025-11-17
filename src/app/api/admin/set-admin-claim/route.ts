'use server';
import { NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

const adminApp = initFirebaseAdmin();

/**
 * API Route to set admin custom claim for a user
 *
 * POST /api/admin/set-admin-claim
 * Body: { uid: "user-id" }
 *
 * This should only be called by existing admins or during setup
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'User UID is required.' },
        { status: 400 }
      );
    }

    // Set the admin custom claim
    const auth = getAuth(adminApp);
    await auth.setCustomUserClaims(uid, { admin: true });

    // Verify the claim was set
    const updatedUser = await auth.getUser(uid);
    const isAdmin = updatedUser.customClaims?.admin === true;

    return NextResponse.json({
      success: true,
      message: `User ${uid} is now an admin.`,
      admin: isAdmin,
      uid: updatedUser.uid,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
    });
  } catch (error) {
    console.error('Error setting admin claim:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: `Failed to set admin claim: ${errorMessage}` },
      { status: 500 }
    );
  }
}
