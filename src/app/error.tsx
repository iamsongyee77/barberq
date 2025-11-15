'use client'
 
import { useEffect } from 'react'
import { ServerCrash, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-background">
             <div className="text-center p-8">
                <div className="flex justify-center mb-6">
                    <ServerCrash className="h-16 w-16 text-destructive" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline mb-4">
                    Service Temporarily Unavailable
                </h1>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    We're currently experiencing higher than normal traffic and are working to resolve the issue. Please try again in a few moments.
                </p>
                <Button
                    onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                    }
                    size="lg"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                </Button>
            </div>
        </main>
        <Footer />
    </div>
  )
}