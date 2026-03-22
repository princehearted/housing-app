export const getMissingFields = (payload, fields) => {
  return fields.filter((field) => {
    const value = payload[field]
    return value === undefined || value === null || value === ""
  })
}

export const toNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}
