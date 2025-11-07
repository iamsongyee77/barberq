"use client";

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Scissors, Calendar, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { placeholderImages } from "@/lib/placeholder-images.json"
import { services, barbers } from "@/lib/data"
import type { Service, Barber } from "@/lib/types";
import { useEffect, useState } from "react";

export default function HomePage() {
  const heroImage = placeholderImages.find(p => p.id === 'hero');
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoadingServices(false);
      setIsLoadingBarbers(false);
    }, 500); // Simulate network delay
    return () => clearTimeout(timer);
  }, []);


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
            className="object-cover opacity-30"
          />
          <div className="relative z-10 text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-4 tracking-tight">
              Style, Simplified.
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Experience seamless appointment booking with SnipQueue. Your next great haircut is just a few clicks away.
            </p>
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
                <div className="bg-primary text-primary-foreground rounded-full p-4 mb-4">
                  <Scissors className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">Expert Barbers</h3>
                <p className="text-muted-foreground">Choose from our team of professional and experienced barbers.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground rounded-full p-4 mb-4">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">Easy Booking</h3>
                <p className="text-muted-foreground">Book your appointment anytime, anywhere in just a few steps.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-primary text-primary-foreground rounded-full p-4 mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-2">AI-Powered Queue</h3>
                <p className="text-muted-foreground">Our smart system optimizes schedules to minimize your wait time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-card border-y">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">Our Services</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isLoadingServices && Array.from({ length: 3 }).map((_, i) => <Card key={i}><CardHeader className="p-0 h-48 w-full bg-muted animate-pulse" /><CardContent className="p-6 space-y-2"><div className="h-6 w-3/4 bg-muted animate-pulse rounded" /><div className="h-4 w-full bg-muted animate-pulse rounded" /><div className="h-4 w-1/2 bg-muted animate-pulse rounded" /></CardContent></Card>)}
              {!isLoadingServices && services?.slice(0, 3).map((service) => (
                <Card key={service.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="p-0">
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      data-ai-hint={service.imageHint}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold font-headline mb-2">{service.name}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <div className="flex justify-between items-center font-semibold">
                      <span>${service.price.toFixed(2)}</span>
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
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">Meet Our Barbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {isLoadingBarbers && Array.from({ length: 4 }).map((_, i) => <div key={i} className="text-center flex flex-col items-center gap-4"><div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-muted animate-pulse" /><div className="h-6 w-24 bg-muted animate-pulse rounded" /></div>)}
              {!isLoadingBarbers && barbers?.map((barber) => (
                <div key={barber.id} className="text-center flex flex-col items-center">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 mb-4 ring-2 ring-primary ring-offset-4 ring-offset-background">
                    <AvatarImage src={barber.imageUrl} alt={barber.name} data-ai-hint={barber.imageHint} />
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
