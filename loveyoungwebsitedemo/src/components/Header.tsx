import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, User, ShoppingCart, ChevronDown } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/routes';
import routes from '@/lib/routes';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { IMAGES } from '@/assets/images';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-white/80 backdrop-blur-md border-border py-2 shadow-sm'
          : 'bg-transparent border-transparent py-4'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to={ROUTE_PATHS.HOME} className="flex items-center gap-2">
          <img
            src={IMAGES.MAIN_LOGO}
            alt="Love Young"
            className="h-10 w-auto object-contain"
          />
          <span className="text-xl font-serif font-bold text-primary hidden sm:block">
            Love Young
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <NavigationMenu>
            <NavigationMenuList>
              {routes.map((route) => (
                <NavigationMenuItem key={route.path}>
                  <NavLink
                    to={route.path}
                    className={({ isActive }) =>
                      cn(
                        navigationMenuTriggerStyle(),
                        'bg-transparent hover:bg-secondary/10 transition-colors text-sm font-medium',
                        isActive ? 'text-secondary font-bold' : 'text-foreground/80'
                      )
                    }
                  >
                    {route.name}
                  </NavLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        {/* Action Area */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-foreground/70 hover:text-secondary"
            asChild
          >
            <Link to={ROUTE_PATHS.ORDER_SYSTEM}>
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-foreground/70 hover:text-secondary"
            asChild
          >
            <Link to={ROUTE_PATHS.MEMBER_CENTER}>
              <User className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-white rounded-full px-6"
            asChild
          >
            <Link to={ROUTE_PATHS.LOGIN}>登录</Link>
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border animate-in fade-in slide-in-from-top-4">
          <nav className="flex flex-col p-4 space-y-2">
            {routes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                    'px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-secondary/10 text-secondary'
                      : 'text-foreground/80 hover:bg-muted'
                  )
                }
              >
                {route.name}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-border mt-2">
              <Button className="w-full bg-primary mb-2" asChild>
                <Link to={ROUTE_PATHS.LOGIN} onClick={() => setIsMobileMenuOpen(false)}>登录</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to={ROUTE_PATHS.REGISTER} onClick={() => setIsMobileMenuOpen(false)}>注册</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
