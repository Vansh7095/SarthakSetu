import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Mail, 
  AlertCircle, 
  Heart, 
  Users, 
  ShieldCheck, 
  Zap, 
  Sprout
} from "lucide-react";

type CommunityType = "donor" | "ngo" | "volunteer" | "supporter" | "people" | "partner";
interface CommunitySpotlight {
  id: number;
  name: string;
  type: CommunityType;
  description: string | null;
  location: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<CommunityType, string> = {
  donor: "Donor",
  ngo: "NGO",
  volunteer: "Volunteer",
  supporter: "Supporter",
  people: "People",
  partner: "Partner",
};
const TYPE_COLORS: Record<CommunityType, string> = {
  donor: "bg-green-100 text-green-800",
  ngo: "bg-blue-100 text-blue-800",
  volunteer: "bg-orange-100 text-orange-800",
  supporter: "bg-purple-100 text-purple-800",
  people: "bg-pink-100 text-pink-800",
  partner: "bg-yellow-100 text-yellow-800",
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-50px" },
  transition: { staggerChildren: 0.15 }
};

const itemVariant = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: "easeOut" }
};

const features = [
  {
    icon: Sprout,
    title: "Reducing food waste",
    description: "Diverting edible surplus food from landfills to plates.",
    color: "text-secondary",
    bg: "bg-secondary/10"
  },
  {
    icon: Heart,
    title: "Helping NGOs",
    description: "Providing a reliable stream of resources to community organizations.",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    icon: Zap,
    title: "Fast and transparent",
    description: "Real-time listings and quick claims with clear traceability.",
    color: "text-accent",
    bg: "bg-accent/20"
  },
  {
    icon: ShieldCheck,
    title: "Secure authentication",
    description: "Verified accounts and secure OTP pickups ensure safety.",
    color: "text-secondary",
    bg: "bg-secondary/10"
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    description: "A secure platform designed to protect donor, NGO, and community data.",
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    icon: Users,
    title: "Community-driven",
    description: "Empowered by local volunteers, donors, and organizations working together.",
    color: "text-accent",
    bg: "bg-accent/20"
  }
];

function CommunitySection() {
  const { data: spotlights = [] } = useQuery<CommunitySpotlight[]>({
    queryKey: ["community-spotlights"],
    queryFn: async () => {
      const res = await fetch("/api/community/spotlights");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  return (
    <motion.section
      className="mb-24 md:mb-32"
      variants={staggerContainer}
      initial="initial"
      whileInView="whileInView"
    >
      <motion.div variants={itemVariant} className="bg-primary/5 rounded-3xl p-8 md:p-14 border border-primary/10 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3">One community, one mission</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Donors, NGOs, volunteers, and supporters — everyone is equal here. SarthakSetu is built by people who believe no meal should go to waste.
          </p>
        </div>

        {spotlights.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full text-left mt-2">
            {spotlights.map((s) => (
              <div key={s.id} className="bg-background/70 rounded-2xl p-5 border border-border/50 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{s.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type]}`}>
                    {TYPE_LABELS[s.type]}
                  </span>
                </div>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                {s.location && <p className="text-xs text-muted-foreground/70">{s.location}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 w-full max-w-2xl text-left mt-2">
            {[
              { label: "Donors", desc: "Restaurants, households & caterers sharing surplus food." },
              { label: "NGOs & Volunteers", desc: "On-the-ground teams collecting and delivering donations." },
              { label: "Supporters", desc: "Anyone who spreads the word or contributes to the cause." },
            ].map((item) => (
              <div key={item.label} className="bg-background/70 rounded-2xl p-5 border border-border/50">
                <p className="font-semibold text-foreground mb-1">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        <Button className="rounded-full px-8 gap-2 mt-2">
          <Mail className="w-4 h-4" /> Get involved
        </Button>
      </motion.div>
    </motion.section>
  );
}

export default function About() {
  return (
    <div className="flex flex-col pb-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary/5 border border-primary/10 mt-4 md:mt-8 mb-16 md:mb-24 py-16 md:py-24 px-6 md:px-12 text-center flex flex-col items-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>
        
        <motion.div 
          className="relative z-10 max-w-3xl flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border shadow-sm text-sm font-medium text-primary mb-2">
            <Heart className="w-4 h-4" />
            <span>Bridge of Food</span>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
            About SarthakSetu
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            SarthakSetu connects food providers with verified NGOs to reduce food waste and help communities.
          </p>
        </motion.div>
      </section>

      {/* 2. Our Mission */}
      <motion.section 
        className="max-w-4xl mx-auto text-center mb-24 md:mb-32 px-4"
        variants={fadeInUp}
        initial="initial"
        whileInView="whileInView"
      >
        <h2 className="text-sm font-bold tracking-widest uppercase text-secondary mb-4">Our Mission</h2>
        <h3 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-8">
          Ending hunger through <br className="hidden md:block"/> digital connection
        </h3>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
          We believe that food waste is a logistical problem, not a scarcity problem. Our mission is to reduce food waste by connecting restaurants, vendors, caterers, and individuals with verified NGOs through a transparent, seamless digital platform.
        </p>
      </motion.section>

      {/* 3. Why SarthakSetu? */}
      <motion.section 
        className="mb-24 md:mb-32"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="text-center mb-12">
          <motion.h2 variants={itemVariant} className="font-serif text-3xl md:text-4xl font-bold mb-4">Why SarthakSetu?</motion.h2>
          <motion.p variants={itemVariant} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A purpose-built platform designed to make sharing food as effortless as possible.
          </motion.p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div key={i} variants={itemVariant} className="group h-full">
              <Card className="h-full border-border/50 bg-background hover:border-primary/20 hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. Our Story */}
      <motion.section 
        className="mb-24 md:mb-32 bg-card rounded-3xl p-8 md:p-12 lg:p-16 border border-border/60 shadow-sm relative overflow-hidden"
        variants={fadeInUp}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="max-w-3xl relative z-10">
          <h2 className="text-sm font-bold tracking-widest uppercase text-accent mb-4">Our Story</h2>
          <h3 className="font-serif text-3xl md:text-4xl font-bold mb-6">From a student initiative to a community movement</h3>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              SarthakSetu began as a student initiative focused on solving real-world food waste and donation challenges. Walking past events with abundant leftover food, and simultaneously seeing hunger in local communities, the disconnect became impossible to ignore.
            </p>
            <p>
              What started as a simple idea to bridge this gap is evolving into a comprehensive open-source platform. We realized that to truly make an impact, the solution needed to be built in the open, allowing communities everywhere to adopt, adapt, and contribute to the mission.
            </p>
          </div>
        </div>
      </motion.section>

      {/* 5. Meet the Team */}
      <motion.section 
        className="mb-24 md:mb-32"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="text-center mb-12">
          <motion.h2 variants={itemVariant} className="font-serif text-3xl md:text-4xl font-bold mb-4">Meet the Team</motion.h2>
          <motion.p variants={itemVariant} className="text-muted-foreground text-lg">The people building the bridge.</motion.p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <motion.div variants={itemVariant}>
            <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300 text-center overflow-hidden h-full">
              <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20"></div>
              <CardContent className="pt-0 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center mb-4 text-3xl font-serif text-muted-foreground shadow-sm">
                  AC
                </div>
                <CardTitle className="text-2xl mb-1">Advay Chawla</CardTitle>
                <CardDescription className="text-primary font-medium mb-4">Founder</CardDescription>
                <p className="text-muted-foreground text-sm">
                  Leading the vision to connect surplus food with the communities that need it most.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariant}>
            <Card className="border-border/50 hover:shadow-lg transition-shadow duration-300 text-center overflow-hidden h-full">
              <div className="h-24 bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20"></div>
              <CardContent className="pt-0 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border-4 border-background bg-muted flex items-center justify-center mb-4 text-3xl font-serif text-muted-foreground shadow-sm">
                  V
                </div>
                <CardTitle className="text-2xl mb-1">Vansh Sharma</CardTitle>
                <CardDescription className="text-secondary font-medium mb-4">Co-Founder & Lead Developer</CardDescription>
                <p className="text-muted-foreground text-sm">
                  Building the platform and shaping the technology that powers SarthakSetu.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* 6. Unified Community */}
      <CommunitySection />

      {/* 8. Contact */}
      <motion.section 
        className="mb-24 md:mb-32"
        variants={staggerContainer}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="text-center mb-12">
          <motion.h2 variants={itemVariant} className="font-serif text-3xl md:text-4xl font-bold mb-4">Get in Touch</motion.h2>
          <motion.p variants={itemVariant} className="text-muted-foreground text-lg">We'd love to hear from you.</motion.p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <motion.div variants={itemVariant}>
            <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Email Us</h3>
                  <p className="text-sm text-muted-foreground">For general inquiries and partnerships.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariant}>
            <Card className="h-full hover:border-destructive/40 hover:shadow-md transition-all duration-300 cursor-pointer group">
              <CardContent className="p-6 text-center flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Report an Issue</h3>
                  <p className="text-sm text-muted-foreground">Found a bug or have feedback? Let us know.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* 9. Join the Mission */}
      <motion.section 
        className="mb-16 md:mb-24"
        variants={fadeInUp}
        initial="initial"
        whileInView="whileInView"
      >
        <div className="bg-foreground text-background rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 text-primary-foreground border border-background/20 text-xs font-medium mb-4">
              <Heart className="w-3 h-3" />
              <span>Join the Mission</span>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Be part of the change.</h2>
            <p className="text-background/70 text-lg leading-relaxed">
              SarthakSetu is a private platform dedicated to fighting food waste and hunger. Sign up today to start sharing surplus food with verified NGOs and volunteers.
            </p>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <Button size="lg" variant="secondary" className="rounded-full px-8 gap-2 bg-background text-foreground hover:bg-background/90 font-medium">
              <Users className="w-5 h-5" /> Join Now
            </Button>
          </div>
        </div>
      </motion.section>

      {/* 10. Footer */}
      <footer className="border-t border-border pt-8 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
          <div>© 2026 SarthakSetu</div>
          <div className="flex items-center gap-1.5">
            Made with <span className="text-destructive text-lg">❤️</span> in India
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Private Platform
          </div>
        </div>
      </footer>
    </div>
  );
}
