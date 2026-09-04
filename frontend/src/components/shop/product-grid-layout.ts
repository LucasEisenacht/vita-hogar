export function getBalancedProductGridClassName(productCount: number) {
  if (productCount <= 1) {
    return "mx-auto grid w-full max-w-[300px] grid-cols-1 gap-5";
  }

  if (productCount === 2) {
    return "mx-auto grid w-full max-w-[660px] grid-cols-1 gap-5 min-[430px]:grid-cols-2 md:gap-6";
  }

  if (productCount === 3) {
    return "mx-auto grid w-full max-w-[980px] grid-cols-1 gap-5 min-[430px]:grid-cols-2 md:grid-cols-3 md:gap-6";
  }

  return "grid gap-5 min-[430px]:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4";
}
