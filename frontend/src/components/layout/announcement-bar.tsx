import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function AnnouncementBar() {
  return <div className="vita-announcement-bar border-b border-border bg-background-alt text-secondary"><Container className="vita-announcement-bar__content flex min-h-9 items-center justify-center py-2 text-center text-xs font-semibold tracking-[0.08em]">{siteConfig.coverage}</Container></div>;
}