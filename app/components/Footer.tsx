"use client";
import React from "react";
import Link from "next/link";

const Footer = () => {
  const footerSections = {
    company: {
      title: "Company",
      links: [
        { text: "About", href: "/about" },
        { text: "Careers", href: "/careers" },
        { text: "Brand Center", href: "/brand" },
        { text: "Blog", href: "/blog" },
      ],
    },
    resources: {
      title: "Resources",
      links: [
        { text: "Status", href: "/status" },
        { text: "Help Center", href: "/help" },
        { text: "Developers", href: "/developers" },
        { text: "Advertising", href: "/ads" },
      ],
    },
    policies: {
      title: "Policies",
      links: [
        { text: "Terms of Service", href: "/terms" },
        { text: "Privacy Policy", href: "/privacy" },
        { text: "Cookie Policy", href: "/cookies" },
        { text: "Accessibility", href: "/accessibility" },
      ],
    },
  };

  return (
    <footer className="px-4 py-8 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key} className="flex flex-col gap-3">
              <h3 className="font-bold text-gray-900">{section.title}</h3>
              <div className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-500 hover:text-gray-700 hover:underline text-sm"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Tweeter. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Privacy
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
