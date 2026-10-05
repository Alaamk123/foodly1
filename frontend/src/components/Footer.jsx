import { Facebook, Instagram, Twitter, Youtube, Github, ChefHat } from "lucide-react";

const SOCIALS = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com" },
  { name: "GitHub", icon: Github, href: "https://github.com" },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-primary-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2 font-display text-lg font-bold text-primary-700">
          <ChefHat size={20} /> Foodly
        </div>

        <div className="flex items-center gap-3">
          {SOCIALS.map(({ name, icon: Icon, href }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 transition-colors hover:bg-primary-500 hover:text-white"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        <p className="text-sm text-primary-400">
          © {new Date().getFullYear()} Foodly. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
