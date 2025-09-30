// Replaced ChefHat icon with static logo image

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <img
              src="/chef-icon-logo.png"
              alt="Chef logo"
              className="h-8 w-8 object-contain select-none app-logo-pulse"
              draggable={false}
              loading="lazy"
            />
          </span>
          <div>
            <div className="text-base font-semibold tracking-tight">DeyCook</div>
            <div className="text-xs text-neutral-500">Private Chef Assistant</div>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-600">
          <a href="#ingredients" className="hover:text-neutral-900">Ingredients</a>
          <a href="#recipe" className="hover:text-neutral-900">Recipe</a>
        </nav>
      </div>
    </header>
  )
}
