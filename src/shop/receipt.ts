import type { Order } from '@/payload-types'

export type ReceiptView = {
  orderNumber: string | null
  status: string
  paidLate: boolean
  items: { title: string | null; option: string | null; quantity: number | null; unitPriceNGN: number | null }[]
  itemsNGN: number | null
  deliveryNGN: number | null
  totalNGN: number | null
  paystackFeeNGN: number | null
  chargedNGN: number | null
  delivery: { method: string | null; carrierName: string | null; estimate: string | null }
  city: string | null
  state: string | null
}

/**
 * What the page a customer returns to may show. The reference sits in a web address that can be
 * shared, so there is no street address, phone number, postcode or email here.
 */
export function receiptView(order: Order): ReceiptView {
  return {
    orderNumber: order.orderNumber ?? null,
    status: order.status,
    paidLate: Boolean(order.payment?.paidLate),
    items: (order.items ?? []).map((item) => ({
      title: item.title ?? null,
      option: item.optionName ?? null,
      quantity: item.quantity ?? null,
      unitPriceNGN: item.unitPriceNGN ?? null,
    })),
    itemsNGN: order.itemsNGN ?? null,
    deliveryNGN: order.deliveryNGN ?? null,
    totalNGN: order.totalNGN ?? null,
    paystackFeeNGN: order.paystackFeeNGN ?? null,
    chargedNGN: order.chargedNGN ?? null,
    delivery: {
      method: order.delivery?.method ?? null,
      carrierName: order.delivery?.carrierName ?? null,
      estimate: order.delivery?.estimate ?? null,
    },
    city: order.address?.city ?? null,
    state: order.address?.state ?? null,
  }
}
