"use client";

import Link from "next/link";
import { Scissors, Menu, LogOut, User, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

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
import { Skeleton } from "../ui/skeleton";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/booking", label: "Book Now" },
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
  
  // This is a placeholder. In a real app, you'd get this from custom claims.
  const isAdmin = user && (user as any).customClaims?.admin === true;
  const currentNavLinks = isAdmin ? [...navLinks, adminLink] : navLinks;


  const renderAuthButtons = () => {
    if (isUserLoading) {
      return <Skeleton className="h-10 w-24" />;
    }
    if (user) {
      return (
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
            {isAdmin && (
               <DropdownMenuItem asChild>
                 <Link href="/admin/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4"/>
            Sign In
            </Link>
        </Button>
        <Button asChild>
          <Link href="/login">
            <UserPlus className="mr-2 h-4 w-4"/>
            Sign Up
            </Link>
        </Button>
      </div>
    );
  };

   const renderMobileAuth = () => {
     const mobileNavLinks = user ? [...currentNavLinks, { href: "/profile", label: "My Profile" }] : navLinks;
    
     return (
       <>
        {mobileNavLinks.map(({ href, label }) => (
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

        <div className="border-t pt-4 mt-4 space-y-2">
        {user ? (
            <Button onClick={() => { handleSignOut(); setIsOpen(false); }} className="w-full">
                <LogOut className="mr-2 h-4 w-4"/>
                Log Out
            </Button>
        ) : (
           <>
             <Button asChild onClick={() => setIsOpen(false)} className="w-full">
                <Link href="/login">
                    <UserPlus className="mr-2 h-4 w-4"/>
                    Sign Up
                </Link>
            </Button>
             <Button variant="outline" asChild onClick={() => setIsOpen(false)} className="w-full">
                <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4"/>
                    Sign In
                </Link>
            </Button>
           </>
        )}
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
        
        <div className="flex items-center gap-4">
           <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {currentNavLinks.map(({ href, label }) => (
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

          {renderAuthButtons()}

          <div className="md:hidden">
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
