import { Link, useLocation } from "wouter";
import { useAuth, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  Map as MapIcon,
  Home,
  Heart,
  List,
  User,
  Info,
  Users,
  Mail,
  Github,
  Twitter,
} from "lucide-react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { data: profile } = useGetMyProfile(
    !!isSignedIn ? undefined : { query: { enabled: false } as any },
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigation = isSignedIn
    ? [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        ...(profile?.role === "donor" || profile?.roles?.includes("donor")
          ? [
              { name: "Donate Food", href: "/donate", icon: Heart },
              { name: "My Listings", href: "/my-donations", icon: List },
            ]
          : []),
        ...(profile?.role === "ngo" ||
        profile?.role === "volunteer" ||
        profile?.roles?.includes("ngo") ||
        profile?.roles?.includes("volunteer")
          ? [
              { name: "Available Food", href: "/donations", icon: List },
              { name: "My Claims", href: "/my-claims", icon: Heart },
            ]
          : []),
        { name: "Map View", href: "/map", icon: MapIcon },
        { name: "Profile", href: "/profile", icon: User },
        ...(profile?.role === "admin" ||
        profile?.roles?.includes("admin")
          ? [{ name: "User Management", href: "/admin-users", icon: Users }]
          : []),
        { name: "About", href: "/about", icon: Info },
      ]
    : [
        { name: "Home", href: "/", icon: Home },
        { name: "About", href: "/about", icon: Info },
      ];

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setSheetOpen(false);
    setTimeout(() => setLocation(href), 350);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 pr-0">
                <nav className="flex flex-col gap-4 mt-8">
                  {navigation.map((item) => (
                    <span
                      key={item.href}
                      className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      onClick={handleNavClick(item.href)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </span>
                  ))}
                  {isSignedIn && (
                    <Button
                      variant="ghost"
                      className="justify-start px-0 text-lg font-medium text-destructive hover:text-destructive hover:bg-transparent"
                      onClick={(e) => {
                        e.preventDefault();
                        setSheetOpen(false);
                        setTimeout(() => signOut({ redirectUrl: "/" }), 350);
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Sign Out
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href={isSignedIn ? "/dashboard" : "/"}>
              <span className="flex items-center gap-2 cursor-pointer">
                <img src="/logo-icon.png" alt="SarthakSetu" className="h-8 w-8 object-contain" />
                <span className="font-serif text-2xl font-bold text-primary hidden sm:inline">SarthakSetu</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {item.name}
                </span>
              </Link>
            ))}
            {isSignedIn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                Sign Out
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8">
        {children}
      </main>

      <footer className="border-t border-border/40 bg-[hsl(20,40%,10%)] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <img
                src="/logo-full.png"
                alt="SarthakSetu"
                className="h-24 w-auto object-contain mb-3 -ml-1"
              />
              <p className="text-white/60 text-sm leading-relaxed">
                Connecting surplus food with those who need it most — across
                restaurants, events, and households in India.
              </p>
              <div className="flex gap-3 mt-5">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary/80 transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary/80 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-3.5 w-3.5" />
                </a>
                <a
                  href="mailto:hello@sarthaksetu.org"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary/80 transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-white/90 font-semibold text-sm mb-4 uppercase tracking-wide">
                Platform
              </h3>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li>
                  <Link href="/donations">
                    <span className="hover:text-primary cursor-pointer transition-colors">
                      Browse Donations
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/map">
                    <span className="hover:text-primary cursor-pointer transition-colors">
                      Live Map
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/donate">
                    <span className="hover:text-primary cursor-pointer transition-colors">
                      Donate Food
                    </span>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard">
                    <span className="hover:text-primary cursor-pointer transition-colors">
                      Dashboard
                    </span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-white/90 font-semibold text-sm mb-4 uppercase tracking-wide">
                Account
              </h3>
              <ul className="space-y-2.5 text-sm text-white/60">
                {isSignedIn ? (
                  <>
                    <li>
                      <Link href="/profile">
                        <span className="hover:text-primary cursor-pointer transition-colors">
                          My Profile
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/my-donations">
                        <span className="hover:text-primary cursor-pointer transition-colors">
                          My Listings
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/my-claims">
                        <span className="hover:text-primary cursor-pointer transition-colors">
                          My Claims
                        </span>
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => signOut({ redirectUrl: "/" })}
                        className="hover:text-primary transition-colors"
                      >
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/sign-in">
                        <span className="hover:text-primary cursor-pointer transition-colors">
                          Sign In
                        </span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/sign-up">
                        <span className="hover:text-primary cursor-pointer transition-colors">
                          Create Account
                        </span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="text-white/90 font-semibold text-sm mb-4 uppercase tracking-wide">
                About
              </h3>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li>
                  <Link href="/about">
                    <span className="hover:text-primary cursor-pointer transition-colors">
                      Our Mission
                    </span>
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:hello@sarthaksetu.org"
                    className="hover:text-primary transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>

              {/* Impact stats */}
              <div className="mt-6 space-y-1">
                <div className="text-white/30 text-xs uppercase tracking-wide mb-3">
                  Impact so far
                </div>
                <div className="flex gap-6">
                  <div>
                    <div className="text-primary font-bold text-lg leading-none">
                      2.4M+
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">Plates</div>
                  </div>
                  <div>
                    <div className="text-primary font-bold text-lg leading-none">
                      340+
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">NGOs</div>
                  </div>
                  <div>
                    <div className="text-primary font-bold text-lg leading-none">
                      28
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">Cities</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/30 text-xs">
            <span>
              © {new Date().getFullYear()} SarthakSetu. Built to reduce food
              waste in India.
            </span>
            <span className="flex gap-4">
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
