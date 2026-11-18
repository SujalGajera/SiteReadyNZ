import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { BrandMark } from './BrandMark'
import { NavLinks } from './NavLinks'
import { NotificationCard } from './NotificationCard'
import { UserCard } from './UserCard'

/**
 * Phone navigation: a Vaul bottom sheet (AGENT_RULES: Vaul for mobile drawers).
 * Vaul gives drag-to-dismiss and a native-feeling spring.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" strokeWidth={1.75} />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="space-y-4 px-4 pb-6 pt-2">
          <DrawerTitle asChild>
            <div className="px-1">
              <BrandMark />
            </div>
          </DrawerTitle>
          <DrawerDescription className="sr-only">Main navigation</DrawerDescription>
          <NavLinks group="drawer" onNavigate={() => setOpen(false)} />
          <NotificationCard />
          <UserCard />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
