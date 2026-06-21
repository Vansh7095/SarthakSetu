import { useGetPlatformStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Heart, Users, MapPin, ArrowRight } from "lucide-react";

export default function Home() {
  const { data: stats } = useGetPlatformStats();

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary/5 border border-border">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}hero.png`} 
            alt="People sharing food" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        </div>
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center p-8 md:p-16">
          <div className="flex flex-col gap-6 max-w-xl">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
              Share food.<br />
              <span className="text-primary">Spread hope.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              AnnSetu connects surplus food from restaurants, events, and households with NGOs and volunteers who can deliver it to those in need.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                  Join the Mission <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full bg-background/50 backdrop-blur">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        <div className="bg-card border border-border rounded-2xl p-6 text-center flex flex-col gap-2 hover-elevate">
          <span className="text-4xl md:text-5xl font-bold text-primary">
            {stats?.totalPlatesSaved?.toLocaleString() || "0"}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Plates Saved</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center flex flex-col gap-2 hover-elevate">
          <span className="text-4xl md:text-5xl font-bold text-secondary">
            {stats?.totalDonations?.toLocaleString() || "0"}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Donations</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center flex flex-col gap-2 hover-elevate">
          <span className="text-4xl md:text-5xl font-bold text-accent">
            {stats?.totalDonors?.toLocaleString() || "0"}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Donors</span>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center flex flex-col gap-2 hover-elevate">
          <span className="text-4xl md:text-5xl font-bold text-primary">
            {stats?.totalNgos?.toLocaleString() || "0"}
          </span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">NGO Partners</span>
        </div>
      </section>

      {/* How it works */}
      <section className="flex flex-col gap-12 items-center">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-4">
          <h2 className="font-serif text-3xl md:text-4xl font-bold">How AnnSetu Works</h2>
          <p className="text-muted-foreground text-lg">A simple, transparent process to ensure surplus food reaches those who need it most.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 w-full">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">1. List Surplus Food</h3>
            <p className="text-muted-foreground">Donors quickly list available food, quantity, and pickup location.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-2">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">2. NGOs Claim</h3>
            <p className="text-muted-foreground">Verified NGOs and volunteers see nearby listings and claim them for pickup.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-2">
              <Heart className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">3. Food Delivered</h3>
            <p className="text-muted-foreground">Secure OTP verification at pickup ensures food goes to the right hands safely.</p>
          </div>
        </div>
      </section>
      
      {/* Community Image */}
      <section className="rounded-3xl overflow-hidden border border-border">
        <img 
          src={`${import.meta.env.BASE_URL}community.png`} 
          alt="Community sharing" 
          className="w-full h-auto md:h-[400px] object-cover"
        />
      </section>
    </div>
  );
}
