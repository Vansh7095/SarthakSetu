import { Link, useLocation } from "wouter";
import { useAuth, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Map as MapIcon, Home, Heart, List, User } from "lucide-react";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useState } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { data: profile } = useGetMyProfile(!!isSignedIn ? undefined : { query: { enabled: false } as any });
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigation = isSignedIn ? [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    ...(profile?.role === "donor"
      ? [
          { name: "Donate Food", href: "/donate", icon: Heart },
          { name: "My Listings", href: "/my-donations", icon: List },
        ]
      : [
          { name: "Available Food", href: "/donations", icon: List },
          { name: "My Claims", href: "/my-claims", icon: Heart },
        ]
    ),
    { name: "Map View", href: "/map", icon: MapIcon },
    { name: "Profile", href: "/profile", icon: User },
  ] : [
    { name: "Home", href: "/", icon: Home },
  ];

  const handleNavClick = (href: string) => {
    setSheetOpen(false);
    setLocation(href);
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
                      onClick={() => handleNavClick(item.href)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </span>
                  ))}
                  {isSignedIn && (
                    <Button
                      variant="ghost"
                      className="justify-start px-0 text-lg font-medium text-destructive hover:text-destructive hover:bg-transparent"
                      onClick={() => {
                        setSheetOpen(false);
                        signOut({ redirectUrl: "/" });
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
              <span className="flex items-center gap-2 font-serif text-2xl font-bold text-primary cursor-pointer">
                SarthakSetu
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
              <Button variant="outline" size="sm" onClick={() => signOut({ redirectUrl: "/" })}>
                Sign Out
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">Sign In</Button>
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
    </div>
  );
}
