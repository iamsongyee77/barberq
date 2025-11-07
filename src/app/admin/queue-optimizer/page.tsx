import { QueueOptimizerClient } from "@/components/admin/queue-optimizer-client";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QueueOptimizerPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">AI Queue Optimizer</CardTitle>
          <CardDescription>
            Use our intelligent AI to optimize the appointment queue. The system will reschedule appointments to maximize barber utilization and minimize customer wait times, respecting customer and barber preferences.
          </CardDescription>
        </CardHeader>
      </Card>
      <QueueOptimizerClient />
    </div>
  );
}
