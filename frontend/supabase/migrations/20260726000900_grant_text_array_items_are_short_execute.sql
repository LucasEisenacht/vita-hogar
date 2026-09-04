-- Allow authenticated catalog writes to evaluate the products array constraint.
-- The function is used by products_included_accessories_lengths.
revoke execute on function public.text_array_items_are_short(text[], integer) from public;
revoke execute on function public.text_array_items_are_short(text[], integer) from anon;
grant execute on function public.text_array_items_are_short(text[], integer) to authenticated;
