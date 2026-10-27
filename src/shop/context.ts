/**
 * Server code passes `context: { [SHOP_SERVER]: true }` when it changes an order itself. The order's
 * staff rules (address only while unbooked, "set by hand" history entries) then stand aside.
 */
export const SHOP_SERVER = 'shopServer'
