"use client";

import Link from "next/link";
import { Scissors, Menu, X, LogIn, User } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { getAuth, signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/booking", label: "Book Now" },
  { href: "/profile", label: "My Profile" },
];

const adminLink = { href: "/admin/dashboard", label: "Admin" };

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    if (auth) {
      signOut(auth);
    }
  };

  const getFallbackName = () => {
    if (!user) return "";
    return (user.displayName || user.email || "U").charAt(0).toUpperCase();
  }

  const renderAuthButtons = () => {
    if (isUserLoading) {
      return <div className="h-10 w-24 rounded-md animate-pulse bg-muted" />;
    }
    if (user) {
      // Assuming isAdmin can be determined from a custom claim
      const isAdmin = (user as any).customClaims?.admin === true;
      const finalNavLinks = isAdmin ? [...navLinks, adminLink] : navLinks;

      return (
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {finalNavLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "transition-colors hover:text-primary",
                  pathname === href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                   <AvatarImage src={user.photoURL || `https://avatar.vercel.sh/${user.uid}.png`} alt={user.displayName || user.email || ''} />
                  <AvatarFallback>{getFallbackName()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                 <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/login">Sign Up</Link>
        </Button>
      </div>
    );
  };

   const renderMobileAuth = () => {
    if (isUserLoading) return null;
    if (user) {
       const isAdmin = (user as any).customClaims?.admin === true;
       const finalNavLinks = isAdmin ? [...navLinks, adminLink] : navLinks;
       return (
         <>
          {finalNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "text-lg",
                pathname === href ? "text-primary font-semibold" : "text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
          <div className="border-t pt-4">
             <Button onClick={() => { handleSignOut(); setIsOpen(false); }} className="w-full">
                Log Out
            </Button>
          </div>
         </>
       )
    }
    return (
       <>
        {navLinks.filter(l => l.href !== '/profile').map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setIsOpen(false)}
            className={cn(
              "text-lg",
              pathname === href ? "text-primary font-semibold" : "text-foreground"
            )}
          >
            {label}
          </Link>
        ))}
         <div className="border-t pt-4 flex flex-col gap-2">
            <Button asChild onClick={() => setIsOpen(false)}>
                <Link href="/login">Sign Up</Link>
            </Button>
             <Button variant="outline" asChild onClick={() => setIsOpen(false)}>
                <Link href="/login">Sign In</Link>
            </Button>
         </div>
       </>
    )

   }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline">
          <Scissors className="h-6 w-6 text-primary" />
          <span>SnipQueue</span>
        </Link>
        
        <div className="flex items-center">
          {renderAuthButtons()}

          <div className="md:hidden ml-2">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 p-6">
                  <Link href="/" className="flex items-center gap-2 font-bold text-lg font-headline" onClick={() => setIsOpen(false)}>
                    <Scissors className="h-6 w-6 text-primary" />
                    <span>SnipQueue</span>
                  </Link>
                  <nav className="flex flex-col gap-4">
                    {renderMobileAuth()}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
