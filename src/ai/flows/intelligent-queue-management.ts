'use server';

/**
 * @fileOverview AI-powered intelligent queue management flow for barber shops.
 *
 * - optimizeQueue - A function to optimize the appointment queue.
 * - OptimizeQueueInput - The input type for the optimizeQueue function.
 * - OptimizeQueueOutput - The return type for the optimizeQueue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeQueueInputSchema = z.object({
  appointments: z
    .array(
      z.object({
        appointmentId: z.string(),
        customerId: z.string(),
        barberId: z.string(),
        serviceId: z.string(),
        startTime: z.string().datetime(),
        durationMinutes: z.number(),
      })
    )
    .describe('An array of appointment objects.'),
  barberSchedules: z
    .array(
      z.object({
        barberId: z.string(),
        availability: z.array(z.object({
          startTime: z.string().datetime(),
          endTime: z.string().datetime(),
        }))
      })
    )
    .describe('An array of barber schedules.'),
  serviceDurations: z
    .array(
      z.object({
        serviceId: z.string(),
        durationMinutes: z.number(),
      })
    )
    .describe('An array of service durations.'),
  customerPreferences: z
    .array(
      z.object({
        customerId: z.string(),
        preferredBarberIds: z.array(z.string()).optional(),
        availability: z.array(z.object({
          startTime: z.string().datetime(),
          endTime: z.string().datetime(),
        })).optional()
      })
    )
    .describe('An array of customer preferences.'),
});

export type OptimizeQueueInput = z.infer<typeof OptimizeQueueInputSchema>;

const OptimizeQueueOutputSchema = z.object({
  rescheduledAppointments: z
    .array(
      z.object({
        appointmentId: z.string(),
        newStartTime: z.string().datetime(),
      })
    )
    .describe('An array of rescheduled appointment objects with new start times.'),
  optimizationSummary: z.string().describe('A summary of the queue optimization process.'),
});

export type OptimizeQueueOutput = z.infer<typeof OptimizeQueueOutputSchema>;

export async function optimizeQueue(input: OptimizeQueueInput): Promise<OptimizeQueueOutput> {
  return optimizeQueueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeQueuePrompt',
  input: {schema: OptimizeQueueInputSchema},
  output: {schema: OptimizeQueueOutputSchema},
  prompt: `You are an AI assistant designed to optimize a barber shop's appointment queue.

  Given the following information about appointments, barber schedules, service durations, and customer preferences, reschedule appointments to maximize barber utilization and minimize customer wait times.

  Appointments:
  {{#each appointments}}
  - Appointment ID: {{appointmentId}}, Customer ID: {{customerId}}, Barber ID: {{barberId}}, Service ID: {{serviceId}}, Start Time: {{startTime}}, Duration: {{durationMinutes}} minutes
  {{/each}}

  Barber Schedules:
  {{#each barberSchedules}}
  - Barber ID: {{barberId}}, Availability: 
    {{#each availability}}
      {{startTime}} - {{endTime}}
    {{/each}}
  {{/each}}

  Service Durations:
  {{#each serviceDurations}}
  - Service ID: {{serviceId}}, Duration: {{durationMinutes}} minutes
  {{/each}}

  Customer Preferences:
  {{#each customerPreferences}}
  - Customer ID: {{customerId}}, Preferred Barbers: {{preferredBarberIds}}, Availability:
   {{#each availability}}
      {{startTime}} - {{endTime}}
    {{/each}}
  {{/each}}

  Consider the following constraints:
  - Appointments cannot be scheduled outside of barber availability.
  - Customer preferences for specific barbers should be respected when possible.
  - Minimize the number of rescheduled appointments.
  - Prioritize minimizing customer wait times and maximizing barber utilization.

  Output the rescheduled appointments with new start times and a summary of the optimization process.
  Ensure that the output is valid JSON matching the OptimizeQueueOutputSchema schema.`, // Make sure this schema exists and matches the desired output
});

const optimizeQueueFlow = ai.defineFlow(
  {
    name: 'optimizeQueueFlow',
    inputSchema: OptimizeQueueInputSchema,
    outputSchema: OptimizeQueueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
