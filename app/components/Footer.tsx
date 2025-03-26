"use client";
import React, { useState, useEffect } from "react";
import { Mail } from "lucide-react";

const Footer = () => {
  const [year, setYear] = useState("");

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="px-4 py-6 bg-white border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <a
            href="mailto:tangbenjamin123@gmail.com"
            className="text-gray-500 hover:text-gray-700 hover:underline text-sm"
          >
            tangbenjamin123@gmail.com
          </a>
        </div>
        <div className="mt-2 text-center">
          <div className="text-sm text-gray-500">
            © {year} Tweeter. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
