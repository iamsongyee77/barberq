import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Application settings and configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page is intended for future application settings. Currently, most critical configurations are managed directly in the code or via the Firebase Console for security reasons.
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
                Information on how to manage admin roles and user passwords.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Admin & Security Note</AlertTitle>
                <AlertDescription>
                    <p className="mb-2">
                        For security reasons, managing administrative roles (i.e., adding or removing admins) and resetting user passwords must be done directly through the <strong>Firebase Console</strong>.
                    </p>
                    <p>
                        This application's UI does not have the capability to perform these sensitive actions. This ensures that only authorized project owners can manage user permissions and data.
                    </p>
                </AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
