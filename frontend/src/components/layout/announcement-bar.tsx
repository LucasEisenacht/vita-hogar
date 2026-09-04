import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function AnnouncementBar() {
  return (
    <div className="bg-secondary text-foreground">
      <Container className="flex min-h-9 items-center justify-center py-2 text-center text-xs font-medium tracking-[0.08em] text-muted-foreground sm:text-sm">
        {siteConfig.coverage} &middot; Entregas en AMBA por motomensajeria
      </Container>
    </div>
  );
}
