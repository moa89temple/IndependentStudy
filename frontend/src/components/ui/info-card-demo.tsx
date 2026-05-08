import {
  InfoCard,
  InfoCardContent,
  InfoCardTitle,
  InfoCardMedia,
  InfoCardDescription,
  InfoCardFooter,
  InfoCardDismiss,
  InfoCardAction,
} from "@/components/ui/info-card";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/blocks/sidebar";
import {
  ExternalLink,
  User,
  ChevronsUpDown,
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";

const items = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

export function InfoCardDemo() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <InfoCard>
            <InfoCardContent>
              <InfoCardTitle>Video Walkthrough</InfoCardTitle>
              <InfoCardDescription>
                Watch how the new dashboard works.
              </InfoCardDescription>
              <InfoCardMedia
                media={[
                  {
                    type: "image",
                    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80",
                    alt: "Laptop with code editor",
                  },
                  {
                    type: "image",
                    src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
                    alt: "Circuit board close-up",
                  },
                  {
                    type: "image",
                    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
                    alt: "Workspace with monitor",
                  },
                ]}
              />
              <InfoCardFooter>
                <InfoCardDismiss>Dismiss</InfoCardDismiss>
                <InfoCardAction>
                  <Link to="/" className="flex flex-row items-center gap-1 underline">
                    Learn more <ExternalLink size={12} />
                  </Link>
                </InfoCardAction>
              </InfoCardFooter>
            </InfoCardContent>
          </InfoCard>
          <SidebarGroup>
            <SidebarMenuButton className="h-12 w-full justify-between gap-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 rounded-md" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">KL</span>
                  <span className="text-xs text-muted-foreground">kl@example.com</span>
                </div>
              </div>
              <ChevronsUpDown className="h-5 w-5 rounded-md" />
            </SidebarMenuButton>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
      <div className="px-4 py-2">
        <SidebarTrigger />
      </div>
    </SidebarProvider>
  );
}
