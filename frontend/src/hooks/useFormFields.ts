import { useCallback, useState } from 'react'

type Validator<Values> = (values: Values) => Partial<Record<keyof Values, string | undefined>>

/**
 * Small form helper shared by the login and register forms.
 * - a field only shows an error after the user has left it (AGENT_RULES: inline validation on blur)
 * - from then on the message updates live, so it disappears the moment the problem is fixed
 * - on submit every field is marked as touched, so all problems show at once
 */
export function useFormFields<Values extends Record<string, string>>(
  initialValues: Values,
  validate: Validator<Values>
) {
  const [values, setValues] = useState<Values>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({})

  // Errors are derived from the current values, so they can never go stale
  const allErrors = validate(values)

  const errors = Object.fromEntries(
    Object.entries(allErrors).filter(([field]) => touched[field as keyof Values])
  ) as Partial<Record<keyof Values, string>>

  const setValue = useCallback(<Key extends keyof Values>(field: Key, value: Values[Key]) => {
    setValues((previous) => ({ ...previous, [field]: value }))
  }, [])

  const markTouched = useCallback((field: keyof Values) => {
    setTouched((previous) => ({ ...previous, [field]: true }))
  }, [])

  /** Marks every field as touched and reports whether the whole form is valid */
  const validateAll = useCallback((): boolean => {
    setTouched(
      Object.fromEntries(Object.keys(values).map((field) => [field, true])) as Partial<Record<keyof Values, boolean>>
    )
    return Object.values(validate(values)).every((message) => !message)
  }, [values, validate])

  return { values, errors, setValue, markTouched, validateAll }
}
