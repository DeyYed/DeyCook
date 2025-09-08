export default function Tips({ minIngredients }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
      <h3 className="font-medium">Chef’s tips</h3>
      <ul className="mt-2 list-disc pl-5 text-sm text-neutral-600 space-y-1">
        <li>Be specific: “boneless skinless chicken thighs” beats “chicken”.</li>
        <li>Add at least {minIngredients} ingredients to unlock recipe generation.</li>
        <li>Seasonality and balance produce better results.</li>
      </ul>
    </div>
  )
}
