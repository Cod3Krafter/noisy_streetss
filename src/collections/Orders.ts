import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig, FieldAccess } from 'payload'

import { isShop, nobody, shopOnlyInAdmin } from '@/access'
import { rejectField } from '@/rules/validation'
import { BOOKING_CLAIM_LAPSES_MS } from '@/shop/claims'
import { SHOP_SERVER } from '@/shop/context'
import { orderEndpoints } from '@/shop/endpoints'
import { appendHistory, type HistoryRow, keepsHistory } from '@/shop/history'
import { NIGERIAN_PHONE_PROBLEM, normaliseNigerianPhone } from '@/shop/phone'
import { isNigerianPostcode, NIGERIAN_POSTCODE_PROBLEM, NIGERIAN_STATES } from '@/shop/states'
import { ORDER_STATUSES, orderNumberFor } from '@/shop/statuses'

/** Only server code (which overrides access) writes these. A value staff send is dropped. */
const neverByHand: FieldAccess = () => false
const serverOnly = { update: neverByHand }

const ADDRESS_KEYS = ['line1', 'line2', 'city', 'state', 'postcode'] as const
type AddressLike = Partial<Record<(typeof ADDRESS_KEYS)[number], string | null>> | null | undefined

// An empty text and no text are the same thing: the admin form sends '' for a field left empty.
const sameAddress = (a: AddressLike, b: AddressLike) => ADDRESS_KEYS.every((key) => (a?.[key] || null) === (b?.[key] || null))

/** A booking claim (7.1) that is still holding the order: started, not finished, and not yet lapsed. */
function bookingInProgress(shipment: { bookingStartedAt?: string | null; terminalShipmentId?: string | null } | null | undefined): boolean {
  if (!shipment?.bookingStartedAt || shipment.terminalShipmentId) return false
  return Date.now() - Date.parse(shipment.bookingStartedAt) < BOOKING_CLAIM_LAPSES_MS
}

/**
 * The rules for changes staff make. The history only ever grows, and only server code adds to it:
 * a staff save must send it back unchanged (the admin does). The phone and address can only be
 * corrected while the order is Paid, no courier is booked and no booking is in progress (a booking
 * would otherwise go out to the old address). A changed phone must pass checkout's rule and is
 * stored as +234, and a postcode must be six digits or empty. A status set by hand is written to
 * the history with the staff member's name.
 */
const staffChangeRules: CollectionBeforeChangeHook = ({ context, data, operation, originalDoc, req }) => {
  if (operation !== 'update' || !originalDoc) return data
  const before = originalDoc.history as HistoryRow[] | undefined
  if ('history' in data && !keepsHistory(before, data.history)) {
    const sent = (data.history ?? []) as HistoryRow[]
    const stale = !context[SHOP_SERVER] && sent.length > 0 && sent.length < (before ?? []).length && keepsHistory(sent, before)
    rejectField(
      req,
      'orders',
      'history',
      stale ? 'This order changed while it was open. Reload it and try again.' : 'The history can only be added to, never changed.',
    )
  }
  if (context[SHOP_SERVER]) return data
  if ('history' in data && (data.history ?? []).length !== (before ?? []).length) {
    rejectField(req, 'orders', 'history', 'The history can only be added to by the shop itself.')
  }

  const phoneChanged = 'customerPhone' in data && (data.customerPhone || null) !== (originalDoc.customerPhone || null)
  const addressChanged = 'address' in data && !sameAddress(data.address, originalDoc.address)
  const waitingToBook = originalDoc.status === 'paid' && !originalDoc.shipment?.terminalShipmentId
  if ((phoneChanged || addressChanged) && !waitingToBook) {
    rejectField(
      req,
      'orders',
      phoneChanged ? 'customerPhone' : 'address',
      'The phone and address can only be changed while the order is Paid and no courier is booked.',
    )
  }
  if ((phoneChanged || addressChanged) && bookingInProgress(originalDoc.shipment)) {
    rejectField(req, 'orders', phoneChanged ? 'customerPhone' : 'address', 'A booking is in progress. Wait for it to finish, then change the address.')
  }

  const checked: Record<string, unknown> = { ...data, createdAt: originalDoc.createdAt }
  if (phoneChanged) {
    const phone = normaliseNigerianPhone(data.customerPhone)
    if (!phone) rejectField(req, 'orders', 'customerPhone', NIGERIAN_PHONE_PROBLEM)
    checked.customerPhone = phone
  }
  const postcode = typeof data.address?.postcode === 'string' ? data.address.postcode.trim() : ''
  if (addressChanged && postcode !== (originalDoc.address?.postcode || '') && postcode && !isNigerianPostcode(postcode)) {
    rejectField(req, 'orders', 'address.postcode', NIGERIAN_POSTCODE_PROBLEM)
  }
  if (addressChanged && typeof data.address?.postcode === 'string') checked.address = { ...data.address, postcode }

  if ('status' in data && data.status !== originalDoc.status) {
    const by = (req.user as { name?: string } | null)?.name ?? 'Staff'
    return {
      ...checked,
      history: appendHistory((data.history as HistoryRow[] | undefined) ?? before, { from: originalDoc.status, to: data.status, by, note: 'Set by hand' }),
    }
  }
  return checked
}

/** The order number comes from the id, which only exists once the order is saved. */
const assignOrderNumber: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || doc.orderNumber) return doc
  const orderNumber = orderNumberFor(Number(doc.id))
  await req.payload.update({
    collection: 'orders',
    id: doc.id,
    data: { orderNumber },
    overrideAccess: true,
    context: { [SHOP_SERVER]: true },
    depth: 0,
    req,
  })
  return { ...doc, orderNumber }
}

const dateTime = { date: { pickerAppearance: 'dayAndTime' as const, displayFormat: 'd MMM yyyy, HH:mm' } }

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    group: 'Shop and services',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'customerName', 'totalNGN', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customerName', 'customerEmail'],
    hidden: shopOnlyInAdmin,
    description: 'Orders are made by checkout. Paid orders are waiting to be packed and booked.',
  },
  access: { create: nobody, read: isShop, update: isShop, delete: nobody },
  endpoints: orderEndpoints,
  hooks: {
    beforeChange: [staffChangeRules],
    afterChange: [assignOrderNumber],
  },
  fields: [
    { name: 'orderNumber', label: 'Order number', type: 'text', unique: true, index: true, access: serverOnly, admin: { readOnly: true } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'awaiting-payment',
      options: [...ORDER_STATUSES],
      admin: {
        position: 'sidebar',
        description: 'Changes on its own as the order is paid and delivered. Set it by hand only when an update has gone missing.',
      },
    },
    {
      name: 'courierPanel',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/components/admin/CourierPanel#CourierPanel' } },
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', label: 'Customer', type: 'text', access: serverOnly, admin: { readOnly: true } },
        { name: 'customerEmail', label: 'Email', type: 'email', access: serverOnly, admin: { readOnly: true } },
        { name: 'customerPhone', label: 'Phone', type: 'text' },
      ],
    },
    {
      name: 'address',
      type: 'group',
      admin: { description: 'The phone and address can be corrected while the order is Paid and no courier is booked.' },
      fields: [
        { name: 'line1', label: 'Street address', type: 'text' },
        { name: 'line2', label: 'Address line 2', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text' },
            { name: 'state', type: 'select', options: NIGERIAN_STATES },
            { name: 'postcode', type: 'text', admin: { description: 'Needed to book a courier.' } },
          ],
        },
        { name: 'country', type: 'text', defaultValue: 'Nigeria', access: serverOnly, admin: { readOnly: true } },
      ],
    },
    {
      name: 'items',
      type: 'array',
      access: serverOnly,
      admin: { readOnly: true },
      fields: [
        // Deleting the product empties this link; the copied details below stay.
        { name: 'product', type: 'relationship', relationTo: ['books', 'merch'], custom: { deleteGuard: 'skip' } },
        {
          type: 'row',
          fields: [
            { name: 'title', type: 'text' },
            { name: 'optionName', label: 'Format or size', type: 'text' },
          ],
        },
        { name: 'optionId', type: 'text', admin: { hidden: true } },
        {
          type: 'row',
          fields: [
            { name: 'unitPriceNGN', label: 'Price each (₦)', type: 'number' },
            { name: 'quantity', type: 'number' },
            { name: 'weightGrams', label: 'Weight each (grams)', type: 'number' },
          ],
        },
      ],
    },
    {
      name: 'delivery',
      type: 'group',
      access: serverOnly,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'method',
              type: 'select',
              options: [
                { label: 'Courier picked by the customer', value: 'courier' },
                { label: 'Flat price (live prices were unavailable)', value: 'flat' },
              ],
            },
            { name: 'carrierName', label: 'Courier', type: 'text' },
            { name: 'carrierSlug', type: 'text', admin: { hidden: true } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'estimate', type: 'text' },
            { name: 'priceNGN', label: 'Customer paid for delivery (₦)', type: 'number' },
            { name: 'flatArea', label: 'Flat price area', type: 'text' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'itemsNGN', label: 'Items (₦)', type: 'number', access: serverOnly, admin: { readOnly: true } },
        { name: 'deliveryNGN', label: 'Delivery (₦)', type: 'number', access: serverOnly, admin: { readOnly: true } },
        { name: 'totalNGN', label: 'Total (₦)', type: 'number', access: serverOnly, admin: { readOnly: true } },
        { name: 'paystackFeeNGN', label: 'Paystack fee (₦)', type: 'number', access: serverOnly, admin: { readOnly: true } },
        { name: 'chargedNGN', label: 'Charged (₦)', type: 'number', access: serverOnly, admin: { readOnly: true } },
      ],
    },
    {
      name: 'payment',
      type: 'group',
      access: serverOnly,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'reference', type: 'text', unique: true, index: true },
            { name: 'channel', label: 'Paid with', type: 'text' },
            { name: 'paidAt', label: 'Paid at', type: 'date', admin: dateTime },
            { name: 'paidLate', label: 'Paid after it expired', type: 'checkbox' },
          ],
        },
        { name: 'problem', type: 'text' },
        { name: 'lastCheckedAt', type: 'date', admin: { hidden: true } },
      ],
    },
    {
      name: 'shipment',
      type: 'group',
      access: serverOnly,
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'carrierName', label: 'Booked with', type: 'text' },
            { name: 'trackingNumber', label: 'Tracking number', type: 'text' },
            { name: 'trackingUrl', label: 'Tracking link', type: 'text' },
            { name: 'labelUrl', label: 'Label', type: 'text' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'courierCostNGN', label: 'Courier cost (₦)', type: 'number' },
            { name: 'bookedAt', label: 'Booked at', type: 'date', admin: dateTime },
            { name: 'bookedBy', label: 'Booked by', type: 'text' },
          ],
        },
        { name: 'terminalShipmentId', label: 'Terminal shipment ID', type: 'text', index: true },
        { name: 'bookingStartedAt', type: 'date', admin: { hidden: true } },
      ],
    },
    {
      name: 'expiresAt',
      label: 'Unpaid order expires at',
      type: 'date',
      access: serverOnly,
      admin: { position: 'sidebar', readOnly: true, ...dateTime },
    },
    {
      name: 'detailsRemovedAt',
      label: 'Customer details removed at',
      type: 'date',
      access: serverOnly,
      admin: { position: 'sidebar', readOnly: true, condition: (data) => Boolean(data?.detailsRemovedAt), ...dateTime },
    },
    { name: 'staffNotes', label: 'Staff notes', type: 'textarea', admin: { position: 'sidebar', description: 'Only staff see this.' } },
    {
      name: 'history',
      type: 'array',
      admin: { readOnly: true, initCollapsed: true, description: 'Every status change, and who or what made it.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'at', label: 'When', type: 'date', required: true, admin: dateTime },
            { name: 'from', label: 'From status', type: 'select', options: [...ORDER_STATUSES] },
            { name: 'to', label: 'To status', type: 'select', options: [...ORDER_STATUSES] },
            { name: 'by', label: 'Changed by', type: 'text', required: true },
          ],
        },
        { name: 'note', type: 'text' },
      ],
    },
  ],
}
