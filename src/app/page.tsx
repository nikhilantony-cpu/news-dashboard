import React from 'react';

// Using dummy data until the college site URL is provided.
const DUMMY_NEWS = [
  {
    id: 1,
    title: "Annual Tech Symposium Dates Announced",
    summary: "The much awaited annual technology symposium will be held next month. Registration begins this Friday.",
    date: "Sep 30, 2026",
    category: "Events"
  },
  {
    id: 2,
    title: "Library Extends Reading Hours",
    summary: "As finals are approaching, the central library will remain open 24/7 starting next Monday to assist student preparation.",
    date: "Sep 29, 2026",
    category: "Campus"
  },
  {
    id: 3,
    title: "Varsity Team Wins Regionals",
    summary: "Our college basketball team secured a thrilling victory at the regional finals yesterday evening.",
    date: "Sep 28, 2026",
    category: "Sports"
  }
];

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Header section */}
      <header className="mb-12 border-b border-slate-700/50 pb-8 animate-fade-in-down">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Live College News
            </h1>
            <p className="mt-3 text-slate-400 text-lg">
              24/7 read-only board streaming the latest updates directly from the campus site.
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-400 tracking-wide uppercase">Live Connection</span>
          </div>
        </div>
      </header>

      {/* Grid Layout for News */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DUMMY_NEWS.map((news) => (
          <article
            key={news.id}
            className="group block relative overflow-hidden rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 transition-all duration-300 hover:bg-slate-800/80 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-900/20"
          >
            {/* Ambient Background Gradient for Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {news.category}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {news.date}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 mb-3 leading-snug group-hover:text-blue-300 transition-colors">
                {news.title}
              </h2>

              <p className="text-slate-400 text-sm flex-grow line-clamp-3">
                {news.summary}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <span className="text-sm font-medium text-cyan-400 group-hover:text-cyan-300 flex items-center transition-colors shadow-inner">
                  Read full story
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>Automated Read-Only Feed • Syncing constantly • Built for Performance</p>
      </footer>
    </main>
  );
}
