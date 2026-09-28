import { useState } from "react";

export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  function resetForm(nextValues = initialValues) {
    setValues(nextValues);
  }

  return { values, setValues, handleChange, resetForm };
}
