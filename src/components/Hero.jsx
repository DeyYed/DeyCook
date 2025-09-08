import { ChefHat } from './Icons'

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
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-neutral-100 absolute -top-4 -right-6" aria-hidden />
            <div className="relative">
              <ChefHat className="h-14 w-14 text-neutral-400 chef-hat-float" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
