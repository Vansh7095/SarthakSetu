import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";

import { Layout } from "./components/layout";
import Home from "./pages/home";
import Onboarding from "./pages/onboarding";
import Dashboard from "./pages/dashboard";
import Donate from "./pages/donate";
import Donations from "./pages/donations";
import DonationDetail from "./pages/donation-detail";
import MapView from "./pages/map";
import MyDonations from "./pages/my-donations";
import MyClaims from "./pages/my-claims";
import Profile from "./pages/profile";
import AdminRegistry from "./pages/admin-registry";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(28 90% 55%)",
    colorForeground: "hsl(20 14% 16%)",
    colorMutedForeground: "hsl(25 15% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(30 20% 88%)",
    colorInputForeground: "hsl(20 14% 16%)",
    colorNeutral: "hsl(30 20% 88%)",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "bg-card rounded-2xl w-full max-w-full overflow-hidden border border-border shadow-sm",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-serif font-bold text-2xl",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-secondary",
    alertText: "text-destructive",
  },
};

const impactStats = [
  { value: "2.4M+", label: "Plates shared" },
  { value: "340+", label: "NGOs onboard" },
  { value: "28", label: "Cities covered" },
];

function SignInPage() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[hsl(20,40%,12%)] p-12 text-white">
        <div>
          <div className="text-primary font-serif font-bold text-2xl mb-1">अन्नसेतु</div>
          <div className="text-white/50 text-sm">SarthakSetu — Bridge of Food</div>
        </div>
        <div>
          <blockquote className="text-3xl font-serif leading-snug mb-6 text-white/90">
            "Every meal you share<br />is hope on a plate."
          </blockquote>
          <div className="flex gap-8">
            {impactStats.map((s) => (
              <div key={s.label}>
                <div className="text-primary font-bold text-2xl">{s.value}</div>
                <div className="text-white/60 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/30 text-xs">Combating food waste across India, one donation at a time.</div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-serif font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to continue making a difference</p>
          </div>
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary to-orange-600 p-12 text-white">
        <div>
          <div className="font-serif font-bold text-2xl mb-1">अन्नसेतु</div>
          <div className="text-white/70 text-sm">SarthakSetu — Bridge of Food</div>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-serif font-bold leading-tight">
            Join thousands who<br />fight hunger every day
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Whether you're a restaurant with surplus food, an NGO serving communities, or a volunteer with wheels — SarthakSetu connects you to where you're needed most.
          </p>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {[
              { emoji: "🏪", title: "Donors", desc: "List surplus food in under 2 minutes" },
              { emoji: "🤝", title: "NGOs", desc: "Discover & claim nearby donations" },
              { emoji: "🚴", title: "Volunteers", desc: "Help transport food to those in need" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <span className="text-xl">{item.emoji}</span>
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-white/70 text-xs">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/40 text-xs">Free to join. No subscription required.</div>
      </div>

      <div className="flex flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-serif font-bold text-foreground">Create your account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              You'll set up your role after signing up
            </p>
          </div>
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Layout>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />

            <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
            <Route path="/onboarding"><ProtectedRoute component={Onboarding} /></Route>

            <Route path="/donate"><ProtectedRoute component={Donate} /></Route>
            <Route path="/donations"><ProtectedRoute component={Donations} /></Route>
            <Route path="/donations/:id"><ProtectedRoute component={DonationDetail} /></Route>
            <Route path="/map"><ProtectedRoute component={MapView} /></Route>
            <Route path="/my-donations"><ProtectedRoute component={MyDonations} /></Route>
            <Route path="/my-claims"><ProtectedRoute component={MyClaims} /></Route>
            <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
            <Route path="/admin-registry"><ProtectedRoute component={AdminRegistry} /></Route>

            <Route component={() => <div className="p-8 text-center">404 Not Found</div>} />
          </Switch>
        </Layout>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
