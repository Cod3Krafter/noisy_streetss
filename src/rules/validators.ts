const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

/** Prices are stored in whole naira. */
export const nairaValidator =
  (required: boolean) =>
  (value: unknown): true | string => {
    if (isEmpty(value)) return required ? 'This field is required.' : true
    return typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? true
      : 'Enter a whole number of naira, with no kobo.'
  }

export const urlValidator =
  (required: boolean) =>
  (value: unknown): true | string => {
    if (isEmpty(value)) return required ? 'This field is required.' : true
    return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value)
      ? true
      : 'Enter a full web address starting with https://'
  }
