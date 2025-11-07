import { Scissors } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} SnipQueue. All rights reserved.
            </p>
        </div>
        <p className="text-sm text-muted-foreground">
            Built with Style.
        </p>
      </div>
    </footer>
  )
}
