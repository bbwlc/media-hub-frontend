'use server'

export type RegisterState = {
  error?: string
  success?: boolean
}

export async function register(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const username = (formData.get('username') as string).trim()
  const password = (formData.get('password') as string)
  const confirmPassword = (formData.get('confirmPassword') as string)
  const email = (formData.get('email') as string).trim()

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  let res: Response
  try {
    res = await fetch('http://localhost:8080/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    })
  } catch {
    return { error: 'Could not reach the server. Please try again.' }
  }

  switch (res.status) {
    case 201:
      return { success: true }
    case 400:
      return { error: 'Invalid registration data.' }
    case 409:
      return { error: 'Username is already taken.' }
    case 500:
      return { error: 'Server error. Please try again later.' }
    default:
      return { error: 'Unexpected error. Please try again.' }
  }
}