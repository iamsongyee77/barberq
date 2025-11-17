'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function SetAdminClaimForm() {
  const [uid, setUid] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSetAdminClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uid.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a user UID.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/set-admin-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: uid.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin claim');
      }

      setResult({
        success: true,
        message: data.message,
        user: data,
      });

      toast({
        title: 'Success',
        description: `${data.displayName || data.email} is now an admin.`,
      });

      setUid('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setResult({
        success: false,
        message: errorMessage,
      });

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSetAdminClaim} className="space-y-4">
        <div>
          <label htmlFor="uid" className="text-sm font-medium mb-2 block">
            User UID
          </label>
          <Input
            id="uid"
            placeholder="Enter the user's Firebase UID"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            The Firebase UID can be found in the Firebase Console under Authentication → Users.
            For the user "LIKIT SAENGOW" (iamsongyee@gmail.com), the UID is: <code className="bg-muted px-1 rounded">qqMeuklOatezgARAXca4zfBXVZC3</code>
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Setting Admin Claim...' : 'Set Admin Claim'}
        </Button>
      </form>

      {result && (
        <Card className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-4">
            <div className="flex gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Success' : 'Error'}
                </p>
                <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.success && result.user && (
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-green-800">
                      <strong>Email:</strong> {result.user.email}
                    </p>
                    <p className="text-green-800">
                      <strong>Name:</strong> {result.user.displayName || 'N/A'}
                    </p>
                    <p className="text-green-800">
                      <strong>UID:</strong> {result.user.uid}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>How to use:</strong>
        </p>
        <ol className="text-sm text-blue-800 mt-2 ml-4 list-decimal space-y-1">
          <li>Go to Firebase Console → Authentication → Users</li>
          <li>Find the user you want to make an admin</li>
          <li>Copy their UID</li>
          <li>Paste it in the field above and click "Set Admin Claim"</li>
          <li>The user will now have admin access to the application</li>
        </ol>
      </div>
    </div>
  );
}
