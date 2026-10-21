"use client";

import { ViewProvider, useView } from "@/context/ViewContext";
import { viewRegistry } from "@/views";
import Nav from "./Nav";
import Footer from "./Footer";

function ActiveView() {
  const { view } = useView();
  const ViewComponent = viewRegistry[view];
  return (
    <div className="min-w-0 w-full">
      <ViewComponent />
    </div>
  );
}

export default function AppShell() {
  return (
    <ViewProvider>
      <Nav />
      <ActiveView />
      <Footer />
    </ViewProvider>
  );
}
