import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { WorkingHoursForm } from "@/components/admin/working-hours-form";
import { HomeContentEditor } from "@/components/admin/home-content-editor";
import { SetAdminClaimForm } from "@/components/admin/set-admin-claim-form";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Home Page Content</CardTitle>
          <CardDescription>
            Edit the text content displayed on the public-facing home page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomeContentEditor />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
          <CardDescription>
            Set the default opening and closing times for the shop. This will be used for the "Auto" schedule feature.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkingHoursForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
                Manage admin roles and user permissions.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SetAdminClaimForm />
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            General application settings and configurations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This section is intended for future application settings. Currently, most critical configurations are managed directly in the code or via the Firebase Console for security reasons.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
