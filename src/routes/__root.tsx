import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useEffect } from "react";

import Header from "../components/Header";
import { useAuth, type AuthContext } from "../contexts/AuthContext";
import { NotFound } from "@/components/NotFound";

export const Route = createRootRouteWithContext<AuthContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [isAuthenticated]);

  return (
    <div className="relative h-screen">
      {isAuthenticated && <Header />}
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  );
}
