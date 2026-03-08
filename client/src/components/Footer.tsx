/**
 * Footer — Global footer for all public pages
 * Minimal single-line design matching the Apple Minimal theme
 */

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#F0F0F5] bg-white">
      <div className="max-w-5xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[#8E8E93]">
          © {year} PromptFit. All rights reserved.
        </p>
        <nav className="flex items-center gap-5">
          <a href="/about" className="text-xs text-[#8E8E93] hover:text-[#1D1D1F] transition-colors">
            About
          </a>
          <a href="/privacy" className="text-xs text-[#8E8E93] hover:text-[#1D1D1F] transition-colors">
            Privacy
          </a>
          <a href="/terms" className="text-xs text-[#8E8E93] hover:text-[#1D1D1F] transition-colors">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
