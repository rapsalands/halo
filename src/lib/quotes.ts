export interface Quote { text: string; author: string }

export const QUOTES: Quote[] = [
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
  { text: 'What we think, we become.', author: 'Buddha' },
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { text: 'Stay hungry, stay foolish.', author: 'Whole Earth Catalog' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'Whether you think you can or you can’t, you’re right.', author: 'Henry Ford' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
  { text: 'Everything you can imagine is real.', author: 'Pablo Picasso' },
  { text: 'Little by little, one travels far.', author: 'J.R.R. Tolkien' },
]

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / 86_400_000)
}

export function pickDailyQuote(date: Date): Quote {
  return QUOTES[dayOfYear(date) % QUOTES.length]
}
