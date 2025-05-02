"use client";

import { useState } from 'react';
import Link from "next/link";
// Import specific icons
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Wand2, 
  FileText, 
  Image as ImageIcon, // Rename to avoid conflict with Next Image 
} from "lucide-react"; 
import { Button } from "@/components/ui/button";

// Update navItems with icon components
const navItems = [
  { name: "Generate", href: "/generate", icon: Wand2 }, 
  { name: "Prompts", href: "/prompts", icon: FileText },
  { name: "Images", href: "/images", icon: ImageIcon },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen">
      {/* Sidebar Navigation */}
      <aside 
        className={`border-r bg-background flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-48 p-4' : 'w-16 p-2 items-center'}`}
      >
        <h2 className={`font-semibold mb-4 ${isSidebarOpen ? 'text-lg' : 'sr-only'}`}>AI Studio</h2>
        
        <nav className="flex flex-col space-y-2 flex-grow">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              // Adjust padding/size for collapsed state if needed
              className={`justify-start ${isSidebarOpen ? '' : 'justify-center p-0 w-10 h-10'}`} 
              title={item.name}
              asChild
            >
              <Link href={item.href} className="flex items-center">
                {/* Render the icon */}
                {item.icon && <item.icon className={`h-4 w-4 ${isSidebarOpen ? '' : 'mx-auto'}`} />} 
                <span className={isSidebarOpen ? 'ml-2' : 'sr-only'}>{item.name}</span>
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto border-t pt-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-full justify-center"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </Button>
         </div>
      </aside>

      {/* Main Content Area */}
      <div 
         className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-48' : 'ml-16'}`}
      >
        {/* Move Toggle Button to bottom-right, fixed position */}
        <Button 
          variant="secondary" // Use secondary or ghost?
          size="icon" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          // Position fixed to bottom right
          className="fixed bottom-4 right-4 z-50 h-9 w-9 rounded-full shadow-lg" 
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
        </Button>

         {/* Inner padding div - remove extra top padding */}
         <div className="p-4 md:p-8">
           {children}
         </div>
      </div>
    </div>
  );
} 