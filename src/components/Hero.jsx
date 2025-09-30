// Replaced ChefHat icon with static logo asset

export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-10 pb-6">
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Cook Book in your device
          </h1>
          <p className="mt-3 text-neutral-600">
            Enter ingredients individually or in bulk and let the AI chef compose a refined recipe.
          </p>
        </div>
        <div className="hidden sm:block justify-self-end">
          <div className="relative h-40 w-40">
            <div className="absolute inset-0 rounded-full bg-neutral-100" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="/chef-icon-logo.png"
                alt="Chef logo"
                className="h-28 w-28 object-contain select-none app-logo-float"
                draggable={false}
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
