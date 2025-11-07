"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Bot, Loader2, Sparkles } from "lucide-react";
import type { OptimizeQueueOutput } from "@/ai/flows/intelligent-queue-management";
import { runQueueOptimizer } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appointments } from "@/lib/data";


export function QueueOptimizerClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizeQueueOutput | null>(null);
  const { toast } = useToast();

  const handleOptimize = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await runQueueOptimizer();
      if (response.success && response.data) {
        setResult(response.data);
        toast({
          title: "Optimization Complete",
          description: "The appointment queue has been successfully optimized.",
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: "An error occurred while optimizing the queue.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOriginalAppointmentTime = (id: string) => {
    const appt = appointments.find(a => a.id === id);
    return appt ? appt.startTime : null;
  }

  return (
    <div className="grid gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <Button onClick={handleOptimize} disabled={isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Run Optimizer
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="flex flex-col items-center gap-4">
            <Bot className="h-16 w-16 text-primary animate-pulse" />
            <p className="text-lg font-medium text-muted-foreground">
              Our AI is analyzing the schedule... Please wait.
            </p>
          </div>
        </div>
      )}

      {result && (
        <div className="grid gap-4 md:gap-8">
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Optimization Summary</AlertTitle>
            <AlertDescription>
              {result.optimizationSummary}
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Rescheduled Appointments</CardTitle>
              <CardDescription>
                The following appointments have been rescheduled for optimal placement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment ID</TableHead>
                    <TableHead>Original Time</TableHead>
                    <TableHead>New Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rescheduledAppointments.length > 0 ? (
                    result.rescheduledAppointments.map((appt) => {
                      const originalTime = getOriginalAppointmentTime(appt.appointmentId);
                      return (
                        <TableRow key={appt.appointmentId}>
                          <TableCell className="font-mono">{appt.appointmentId}</TableCell>
                          <TableCell className="text-muted-foreground line-through">
                            {originalTime ? format(originalTime, "PPp") : 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold text-primary">
                            {format(parseISO(appt.newStartTime), "PPp")}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No appointments were rescheduled. The queue is already optimal.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
