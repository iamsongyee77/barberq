'use server';
import { NextResponse } from 'next/server';
import { initFirebaseAdmin } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { ADMIN_EMAILS } from '@/lib/types';

const adminApp = initFirebaseAdmin();

/**
 * API Route to check if a user's email is in ADMIN_EMAILS
 * and automatically set the admin custom claim if needed.
 *
 * POST /api/auth/check-and-set-admin
 * Body: { uid: "user-id" }
 *
 * This is called during login to synchronize email-based admin status
 * with custom claims that Firestore rules require.
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

    const auth = getAuth(adminApp);
    const user = await auth.getUser(uid);

    console.log(`[check-and-set-admin] User: ${user.email} (${uid}), ADMIN_EMAILS: ${ADMIN_EMAILS.join(', ')}`);

    // Check if user's email is in the admin list
    const isAdminByEmail = user.email && ADMIN_EMAILS.includes(user.email);

    // Check if user already has admin claim
    const hasAdminClaim = user.customClaims?.admin === true;

    console.log(`[check-and-set-admin] isAdminByEmail: ${isAdminByEmail}, hasAdminClaim: ${hasAdminClaim}`);

    // If email-based admin but no claim, set the claim
    if (isAdminByEmail && !hasAdminClaim) {
      console.log(`[check-and-set-admin] Setting admin claim for ${user.email}`);
      await auth.setCustomUserClaims(uid, { admin: true });
    }

    // If not email-based admin but has claim, remove it
    if (!isAdminByEmail && hasAdminClaim) {
      console.log(`[check-and-set-admin] Removing admin claim for ${user.email}`);
      await auth.setCustomUserClaims(uid, { admin: false });
    }

    // Get updated user info
    const updatedUser = await auth.getUser(uid);

    console.log(`[check-and-set-admin] Final admin status: ${updatedUser.customClaims?.admin === true}`);

    return NextResponse.json({
      success: true,
      uid: updatedUser.uid,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      isAdmin: updatedUser.customClaims?.admin === true,
      message: `User ${updatedUser.email} admin status: ${updatedUser.customClaims?.admin === true ? 'Admin' : 'User'}`,
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
