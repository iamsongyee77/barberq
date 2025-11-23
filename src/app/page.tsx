
"use client";

import { useEffect } from "react";
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Scissors, Calendar, Users } from "lucide-react"
import { collection, query, limit, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { placeholderImages } from "@/lib/placeholder-images.json"
import type { Service, Barber, PageContent } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";


export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const heroImage = placeholderImages.find(p => p.id === 'hero');
  const firestore = useFirestore();

  useEffect(() => {
    // Wait until user loading is complete before making a decision
    if (!isUserLoading) {
      // If loading is finished and there's still no user, then redirect.
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  const servicesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'services'), limit(3));
  }, [firestore]);

  const barbersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'barbers'), limit(4));
  }, [firestore]);
  
  const contentRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'pageContent', 'home');
  }, [firestore]);

  const { data: services, isLoading: isLoadingServices } = useCollection<Service>(servicesQuery);
  const { data: barbers, isLoading: isLoadingBarbers } = useCollection<Barber>(barbersQuery);
  const { data: content, isLoading: isLoadingContent } = useDoc<PageContent>(contentRef);

  // While loading or if user is not yet confirmed, show a loading state.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] w-full bg-gray-900 text-white flex items-center justify-center">
          <Image
            src={heroImage?.imageUrl || "https://picsum.photos/seed/hero/1200/800"}
            alt={heroImage?.description || "Barber cutting hair"}
            data-ai-hint={heroImage?.imageHint || "barber shop"}
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-20"
          />
          <div className="relative z-10 text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tight">
              {isLoadingContent ? <Skeleton className="h-12 w-96 mx-auto bg-white/20" /> : (content?.heroHeadline || "Style, Simplified.")}
            </h1>
            <div className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-white/80">
               {isLoadingContent ? <div className="animate-pulse rounded-md bg-white/20 h-6 w-80 mx-auto mt-2" /> : (content?.heroSubheadline || "Experience seamless appointment booking with SnipQueue. Your next great haircut is just a few clicks away.")}
            </div>
            <Button size="lg" asChild>
              <Link href="/booking">
                Book an Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                  <Scissors className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">{isLoadingContent ? <Skeleton className="h-6 w-32 mx-auto" /> : (content?.feature1Title || "Expert Barbers")}</h3>
                <div className="text-muted-foreground">{isLoadingContent ? <div className="animate-pulse rounded-md bg-muted h-4 w-48 mx-auto mt-2" /> : (content?.feature1Description || "Choose from our team of professional and experienced barbers.")}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">{isLoadingContent ? <Skeleton className="h-6 w-32 mx-auto" /> : (content?.feature2Title || "Easy Booking")}</h3>
                <div className="text-muted-foreground">{isLoadingContent ? <div className="animate-pulse rounded-md bg-muted h-4 w-48 mx-auto mt-2" /> : (content?.feature2Description || "Book your appointment anytime, anywhere in just a few steps.")}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">{isLoadingContent ? <Skeleton className="h-6 w-32 mx-auto" /> : (content?.feature3Title || "AI-Powered Queue")}</h3>
                <div className="text-muted-foreground">{isLoadingContent ? <div className="animate-pulse rounded-md bg-muted h-4 w-48 mx-auto mt-2" /> : (content?.feature3Description || "Our smart system optimizes schedules to minimize your wait time.")}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-card border-y">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{isLoadingContent ? <Skeleton className="h-9 w-64 mx-auto" /> : (content?.servicesTitle || "Our Services")}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoadingServices && Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardHeader className="p-0 h-48 w-full bg-muted animate-pulse" /><CardContent className="p-6 space-y-2"><div className="h-6 w-3/4 bg-muted animate-pulse rounded" /><div className="h-4 w-full bg-muted animate-pulse rounded" /><div className="h-4 w-1/2 bg-muted animate-pulse rounded" /></CardContent></Card>)}
              {!isLoadingServices && services?.map((service) => (
                <Card key={service.id} className="overflow-hidden transition-shadow duration-300 group">
                  <CardHeader className="p-0 relative h-48 w-full">
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      data-ai-hint={service.imageHint}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </CardHeader>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold font-headline mb-2">{service.name}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-primary">฿{service.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{service.duration} min</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
             <div className="text-center mt-12">
                <Button variant="outline" asChild>
                    <Link href="/booking">View All Services <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
          </div>
        </section>

        {/* Barbers Section */}
        <section id="barbers" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{isLoadingContent ? <Skeleton className="h-9 w-64 mx-auto" /> : (content?.barbersTitle || "Meet Our Barbers")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {isLoadingBarbers && Array.from({ length: 4 }).map((_, i) => <div key={i} className="text-center flex flex-col items-center gap-4"><Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-muted animate-pulse" /><div className="h-6 w-24 bg-muted animate-pulse rounded" /></div>)}
              {!isLoadingBarbers && barbers?.map((barber) => (
                <div key={barber.id} className="text-center flex flex-col items-center">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 mb-4 ring-2 ring-primary/50 ring-offset-4 ring-offset-background">
                    <AvatarImage src={barber.imageUrl || `https://avatar.vercel.sh/${barber.id}.png`} alt={barber.name} data-ai-hint={barber.imageHint} />
                    <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg font-headline">{barber.name}</h3>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {barber.specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

    

    