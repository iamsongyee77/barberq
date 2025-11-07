import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <div className="flex items-center space-x-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          404
        </h1>
        <Separator orientation="vertical" className="h-12" />
        <h2 className="text-lg text-muted-foreground">
          This page could not be found.
        </h2>
      </div>
      <Button asChild className="mt-8">
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  );
}
