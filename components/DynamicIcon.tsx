import { 
  Wallet, CreditCard, Landmark, Banknote, Coins, Briefcase, Smartphone, 
  ShoppingCart, Coffee, Home, Lightbulb, HeartPulse, Film, BookOpen, Plane, Pill, 
  Utensils, Car, Zap, Shirt, Gift, Scissors, Music, Monitor, MonitorPlay, 
  TrendingUp, CircleDollarSign, PiggyBank, Receipt, Handshake, BadgeDollarSign,
  type LucideIcon,
  Circle
} from 'lucide-react'

// Curated list of icons for Wallets and Categories
export const ICON_MAP: Record<string, LucideIcon> = {
  Wallet, CreditCard, Landmark, Banknote, Coins, Briefcase, Smartphone,
  ShoppingCart, Coffee, Home, Lightbulb, HeartPulse, Film, BookOpen, Plane, Pill,
  Utensils, Car, Zap, Shirt, Gift, Scissors, Music, Monitor, MonitorPlay,
  TrendingUp, CircleDollarSign, PiggyBank, Receipt, Handshake, BadgeDollarSign
}

export const WALLET_ICONS = [
  'Wallet', 'CreditCard', 'Landmark', 'Banknote', 'Coins', 'Briefcase', 'Smartphone', 'PiggyBank'
]

export const EXPENSE_ICONS = [
  'ShoppingCart', 'Coffee', 'Utensils', 'Home', 'Lightbulb', 'Zap', 'HeartPulse', 'Pill',
  'Film', 'Music', 'MonitorPlay', 'Monitor', 'BookOpen', 'Plane', 'Car', 'Shirt', 'Gift', 'Scissors', 'Receipt'
]

export const INCOME_ICONS = [
  'Briefcase', 'TrendingUp', 'CircleDollarSign', 'BadgeDollarSign', 'Handshake', 'Gift'
]

interface Props {
  name: string
  className?: string
}

export function DynamicIcon({ name, className }: Props) {
  // If the name is an actual emoji (doesn't exist in our map), we can either render the emoji
  // or a fallback icon. Let's render the emoji for backwards compatibility with existing DB entries,
  // or the mapped icon if it's found.
  const IconComponent = ICON_MAP[name]

  if (IconComponent) {
    return <IconComponent className={className} />
  }

  // Fallback for existing emojis or missing icons
  return <span className={className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'inherit' }}>{name || '✨'}</span>
}
